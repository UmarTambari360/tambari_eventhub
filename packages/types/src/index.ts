// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'attendee' | 'organizer' | 'admin';

export type OrganizerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizerStatus?: OrganizerStatus;
  jti: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}

// ─── Organizer Applications ───────────────────────────────────────────────────

export interface OrganizerApplicationDTO {
  id: string;
  businessName: string;
  businessDescription: string;
  websiteUrl: string | null;
  instagramHandle: string | null;
  bankName: string;
  bankAccountName: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    memberSince?: string;
  };
}

export interface OrganizerProfileDTO {
  id: string;
  userId: string;
  businessName: string;
  businessDescription: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  paystackSubaccountCode: string | null;
  bankName: string | null;
  bankAccountNumber: string | null; // always masked: ****1234
  bankAccountName: string | null;
  status: OrganizerStatus;
  totalEventsCreated: number;
  totalTicketsSold: number;
  totalRevenue: number;
  createdAt: string;
}

// ─── Platform ─────────────────────────────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  code: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = undefined> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    issues?: Array<{ field: string; message: string }>;
  };
}

export type ApiResponse<T = undefined> = ApiSuccess<T> | ApiError;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// PHASE 5: Event and TicketType types
// PHASE 7: Order, OrderItem, Attendee, Transaction types