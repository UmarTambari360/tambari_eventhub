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
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  status: OrganizerStatus;
  totalEventsCreated: number;
  totalTicketsSold: number;
  totalRevenue: number;
  createdAt: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'Music'
  | 'Business'
  | 'Arts'
  | 'Food'
  | 'Sports'
  | 'Tech'
  | 'Fashion'
  | 'Culture'
  | 'Comedy'
  | 'Religion';

export interface TicketTypeDTO {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number; // kobo
  quantity: number;
  quantitySold: number;
  available: number; // quantity - quantitySold
  saleStartDate: string | null;
  saleEndDate: string | null;
  minPurchase: number;
  maxPurchase: number;
  isActive: boolean;
  isSaleOpen: boolean; // derived: within date range (if set) and isActive
  createdAt: string;
  updatedAt: string;
}

export interface EventOrganizerDTO {
  id: string;
  fullName: string;
  businessName: string | null;
  avatarUrl: string | null;
}

export interface EventDTO {
  id: string;
  title: string;
  description: string;
  slug: string;
  organizer: EventOrganizerDTO;
  venue: string;
  location: string;
  address: string | null;
  eventDate: string;
  eventEndDate: string | null;
  bannerImageUrl: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  featureOrder: number | null;
  isCancelled: boolean;
  isFree: boolean;
  totalCapacity: number | null;
  category: EventCategory | null;
  tags: string[];
  ticketTypes: TicketTypeDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface EventListItemDTO {
  id: string;
  title: string;
  slug: string;
  organizer: Pick<EventOrganizerDTO, 'id' | 'fullName' | 'businessName'>;
  venue: string;
  location: string;
  eventDate: string;
  eventEndDate: string | null;
  thumbnailUrl: string | null;
  bannerImageUrl: string | null;
  isFree: boolean;
  isFeatured: boolean;
  isCancelled: boolean;
  category: EventCategory | null;
  tags: string[];
  lowestPrice: number | null; // kobo — null if free
  totalCapacity: number | null;
  totalSold: number;
}

// Organizer-facing — includes unpublished events
export interface OrganizerEventDTO extends EventListItemDTO {
  isPublished: boolean;
  ticketTypes: TicketTypeDTO[];
  totalRevenue: number; // kobo
  createdAt: string;
  updatedAt: string;
}

// ─── Platform ─────────────────────────────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  code: string;
}

export interface PlatformSettingsDTO {
  service_fee_percent: number;
  max_featured_events: number;
  event_categories: string[];
  platform_name: string;
  support_email: string;
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
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// PHASE 7: Order, OrderItem, Attendee, Transaction types