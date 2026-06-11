import { logger } from '../lib/logger';
import { cacheGet, cacheSet } from '../lib/redis';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const BANKS_CACHE_KEY = 'paystack:banks';
const BANKS_CACHE_TTL = 86_400; // 24 hours

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface PaystackBank {
  id: number;
  name: string;
  code: string;
  active: boolean;
  country: string;
  currency: string;
}

interface PaystackAccountVerification {
  account_number: string;
  account_name: string;
  bank_id: number;
}

interface PaystackSubaccount {
  id: number;
  subaccount_code: string;
  business_name: string;
  description: string;
  primary_contact_email: string | null;
  percentage_charge: number;
  settlement_bank: string;
  account_number: string;
}

interface PaystackTransactionInitialize {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackTransactionVerify {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  fees: number;
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    signature: string;
    reusable: boolean;
    country_code: string;
    account_name: string | null;
  };
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
  };
  subaccount: {
    id: number;
    subaccount_code: string;
    business_name: string;
    description: string | null;
    primary_contact_email: string | null;
    primary_contact_name: string | null;
    primary_contact_phone: string | null;
    metadata: Record<string, unknown> | null;
    percentage_charge: number;
    settlement_bank: string;
    account_number: string;
  } | null;
  split: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

interface PaystackRefund {
  id: number;
  transaction: number;
  dispute: number | null;
  amount: number;
  deducted_amount: number | null;
  fully_deducted: boolean | null;
  refunded_at: string | null;
  expected_at: string;
  currency: string;
  domain: string;
  status: string;
  refunded_by: string;
  created_at: string;
  transaction_reference: string;
  merchant_note: string;
  customer_note: string;
}

interface InitializeTransactionOptions {
  email: string;
  amount: number; // in kobo
  reference: string;
  callbackUrl: string;
  subaccountCode: string;
  platformFeeKobo: number;
  metadata?: Record<string, unknown>;
}

function getSecretKey(): string {
  const key = process.env['PAYSTACK_SECRET_KEY'];
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<PaystackResponse<T>> {
  const url = `${PAYSTACK_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = (await response.json()) as PaystackResponse<T>;

  if (!response.ok) {
    logger.error('Paystack API error', {
      path,
      status: response.status,
      message: body.message,
    });
    throw new Error(`Paystack API error: ${body.message}`);
  }

  return body;
}

/**
 * Fetch list of Nigerian banks from Paystack.
 * Cached in Redis for 24 hours.
 */
export async function getPaystackBanks(): Promise<PaystackBank[]> {
  const cached = await cacheGet(BANKS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PaystackBank[];
  }

  const result = await paystackFetch<PaystackBank[]>(
    '/bank?country=nigeria&use_cursor=false&perPage=100'
  );

  const activeBanks = result.data.filter((b) => b.active);

  await cacheSet(BANKS_CACHE_KEY, JSON.stringify(activeBanks), BANKS_CACHE_TTL);

  return activeBanks;
}

/**
 * Verify a bank account number and get the account name.
 * Calls Paystack's account name verification endpoint.
 */
export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<PaystackAccountVerification> {
  const result = await paystackFetch<PaystackAccountVerification>(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return result.data;
}

/**
 * Create a Paystack subaccount for an approved organizer.
 * The platform bears the transaction fee (bearer: "account").
 */
export async function createSubaccount(
  businessName: string,
  settlementBank: string, // bank code
  accountNumber: string,
  percentageCharge: number // e.g. 97.5 means organizer gets 97.5%
): Promise<PaystackSubaccount> {
  const result = await paystackFetch<PaystackSubaccount>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: percentageCharge,
      description: `EventHub organizer subaccount for ${businessName}`,
    }),
  });
  return result.data;
}

/**
 * Initialize a Paystack transaction with split payment.
 * The platform fee is deducted from the organizer's share automatically.
 */
export async function initializeTransaction(
  options: InitializeTransactionOptions
): Promise<PaystackTransactionInitialize> {
  const {
    email,
    amount,
    reference,
    callbackUrl,
    subaccountCode,
    platformFeeKobo,
    metadata,
  } = options;

  const result = await paystackFetch<PaystackTransactionInitialize>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount,
        reference,
        callback_url: callbackUrl,
        subaccount: subaccountCode,
        // bearer: "account" means the main account (EventHub) bears Paystack fees
        // The split is: platform gets `platformFeeKobo`, organizer gets the rest
        bearer: 'subaccount',
        transaction_charge: platformFeeKobo,
        metadata: {
          ...metadata,
          cancel_action: callbackUrl,
        },
      }),
    }
  );

  return result.data;
}

/**
 * Verify a transaction by reference.
 * Used for webhook confirmation and manual fallback verification.
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackTransactionVerify> {
  const result = await paystackFetch<PaystackTransactionVerify>(
    `/transaction/verify/${reference}`
  );
  return result.data;
}

/**
 * Initiate a refund for a transaction.
 */
export async function refundTransaction(
  transactionReference: string,
  amount?: number // if omitted, full refund
): Promise<PaystackRefund> {
  const body: Record<string, unknown> = {
    transaction: transactionReference,
    merchant_note: 'Refund issued by EventHub',
    customer_note: 'Your refund has been processed',
  };

  if (amount !== undefined) {
    body['amount'] = amount;
  }

  const result = await paystackFetch<PaystackRefund>('/refund', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result.data;
}

export type {
  PaystackBank,
  PaystackAccountVerification,
  PaystackSubaccount,
  PaystackTransactionInitialize,
  PaystackTransactionVerify,
  PaystackRefund,
};