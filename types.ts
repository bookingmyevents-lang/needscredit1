import { StringMappingType } from "typescript";

export enum UserRole {
  RENTER = 'RENTER',
  OWNER = 'OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Verified';
  bankInfo?: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
  };
  upiId?: string;
  profilePictureUrl?: string;
  bio?: string;
  ownerCredit?: number;
  notificationPreferences?: Partial<Record<NotificationType, boolean>>;
}

export enum FurnishingStatus {
  FURNISHED = 'Furnished',
  SEMI_FURNISHED = 'Semi-Furnished',
  UNFURNISHED = 'Unfurnished',
}

export enum Facing {
  NORTH = 'North',
  SOUTH = 'South',
  EAST = 'East',
  WEST = 'West',
  NORTH_EAST = 'North-East',
  NORTH_WEST = 'North-West',
  SOUTH_EAST = 'South-East',
  SOUTH_WEST = 'South-West',
}

export interface FurnishingItem {
    name: string;
    quantity: number;
    icon: string;
}

export interface Amenity {
    name: string;
    icon: string;
}

export interface NearbyPlace {
    name: string;
    type: 'School' | 'Hospital' | 'Restaurant' | 'Shopping' | 'Park' | 'IT Park' | 'Transport Hub';
    distance: string;
}

export interface Review {
    id: string;
    userId: string;
    author: string;
    role: 'Owner' | 'Tenant';
    time: string;
    rating: number;
    goodThings: string;
    needsImprovement: string;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  address: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: Amenity[];
  images: string[];
  description: string;
  availability: 'available' | 'rented';
  availableDate: string;
  furnishing: FurnishingStatus;
  facing: Facing;
  parking: string;
  postedDate: string;
  latitude: number;
  longitude: number;
  projectName: string;
  securityDeposit: number;
  brokerage: number;
  balconies: number;
  floor: string;
  leaseType: string;
  ageOfProperty: string;
  furnishingItems: FurnishingItem[];
  nearbyPlaces: NearbyPlace[];
  reviewIds: string[];
  viewingAdvance: number;
  panoViewUrl?: string;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AGREEMENT_SENT = 'AGREEMENT_SENT',
  AGREEMENT_SIGNED = 'AGREEMENT_SIGNED', // Both have signed, deposit is now due
  PLATFORM_FEE_DUE = 'PLATFORM_FEE_DUE',
  OFFLINE_PAYMENT_PENDING = 'OFFLINE_PAYMENT_PENDING',
  RENT_DUE = 'RENT_DUE',
  RENT_PAID = 'RENT_PAID',
  DEPOSIT_DUE = 'DEPOSIT_DUE',
  DEPOSIT_PAID = 'DEPOSIT_PAID', // Tenant paid, owner needs to confirm
  MOVE_IN_READY = 'MOVE_IN_READY', // Deposit paid & confirmed, keys can be handed over
  COMPLETED = 'COMPLETED', // Keys handed over, rental is active
}

export enum PaymentType {
    VIEWING_ADVANCE = 'VIEWING_ADVANCE',
    RENT = 'RENT',
    DEPOSIT = 'DEPOSIT',
    REFUND = 'REFUND',
    BILL = 'BILL',
    PLATFORM_FEE = 'PLATFORM_FEE',
    APPLICATION_FEE = 'APPLICATION_FEE',
}

export interface Payment {
  id: string;
  userId: string;
  propertyId: string;
  type: PaymentType;
  amount: number;
  paymentDate: string;
  status: 'Paid' | 'Failed' | 'Refunded';
}

export interface Application {
  id: string;
  propertyId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  moveInDate: string;
  status: ApplicationStatus;
  documents: {
    idProof: File | null;
    incomeProof: File | null;
  };
  paymentHistory?: Payment[];
  amount?: number;
  dueDate?: string;
  platformFee?: {
    amount: number;
    paid: boolean;
  };
  offlinePaymentDetails?: {
    upiTransactionId: string;
    acknowledged: boolean;
  };
  finalRentAmount?: number;
  finalDepositAmount?: number;
  contractDuration?: string;
  utilityResponsibilities?: string;
}

export enum ViewingStatus {
    REQUESTED = 'REQUESTED',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    TENANT_REJECTED = 'TENANT_REJECTED',
}

export interface Viewing {
    id: string;
    propertyId: string;
    tenantId: string;
    ownerId: string;
    advanceAmount: number;
    status: ViewingStatus;
    scheduledAt: string | null;
    requestedAt: string;
    verificationData?: PoliceVerificationFormData;
    paymentId?: string;
}

export interface Agreement {
    id: string;
    propertyId: string;
    tenantId: string;
    ownerId: string;
    rentAmount: number;
    depositAmount: number;
    startDate: string;
    endDate: string;
    signedByTenant: boolean;
    signedByOwner: boolean;
    agreementUrl?: string;
    reviewLeft?: boolean;
}

export enum VerificationStatus {
    NOT_SUBMITTED = 'NOT_SUBMITTED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}

export interface PoliceVerificationFormData {
  fullName?: string;
  dateOfBirth?: string;
  fatherName?: string;
  permanentAddress?: string;
  previousAddress?: string;
  previousAddressDuration?: string;
  employerName?: string;
  employerAddress?: string;
  previousLandlordName?: string;
  previousLandlordContact?: string;
  reasonForMoving?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}


export interface Verification {
    id: string;
    tenantId: string;
    status: VerificationStatus;
    formData: PoliceVerificationFormData;
    submittedAt: string;
}

export enum BillType {
    ELECTRICITY = 'ELECTRICITY',
    WATER = 'WATER',
    MAINTENANCE = 'MAINTENANCE',
}

export interface Bill {
    id: string;
    propertyId: string;
    tenantId: string;
    type: BillType;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    paidOn?: string;
}

export enum DisputeStatus {
    OPEN = 'OPEN',
    IN_REVIEW = 'IN_REVIEW',
    RESOLVED = 'RESOLVED',
}

export interface Dispute {
    id: string;
    relatedId: string; // Could be viewingId, paymentId, etc.
    type: 'Viewing' | 'Payment' | 'Property';
    status: DisputeStatus;
    messages: { userId: string, text: string, timestamp: string }[];
    raisedBy: string; // userId
}

export enum ActivityType {
    VIEWED_PROPERTY = 'VIEWED_PROPERTY',
    REQUESTED_VIEWING = 'REQUESTED_VIEWING',
    SUBMITTED_APPLICATION = 'SUBMITTED_APPLICATION',
    APPROVED_APPLICATION = 'APPROVED_APPLICATION',
    PAID_BILL = 'PAID_BILL',
    GENERATED_BILL = 'GENERATED_BILL',
    PAID_RENT = 'PAID_RENT',
    SIGNED_AGREEMENT = 'SIGNED_AGREEMENT',
    RAISED_DISPUTE = 'RAISED_DISPUTE',
    AGREEMENT_ACTION_REQUIRED = 'AGREEMENT_ACTION_REQUIRED',
    CREATED_MAINTENANCE_REQUEST = 'CREATED_MAINTENANCE_REQUEST',
    COMPLETED_MAINTENANCE_REQUEST = 'COMPLETED_MAINTENANCE_REQUEST',
    LEFT_REVIEW = 'LEFT_REVIEW',
}

export interface ActivityLog {
    id: string;
    userId: string;
    type: ActivityType;
    message: string;
    timestamp: string;
}

export enum NotificationType {
    NEW_VIEWING_REQUEST = 'NEW_VIEWING_REQUEST',
    APPLICATION_STATUS_UPDATE = 'APPLICATION_STATUS_UPDATE',
    VIEWING_STATUS_UPDATE = 'VIEWING_STATUS_UPDATE',
    RENT_DUE_SOON = 'RENT_DUE_SOON',
    AGREEMENT_ACTION_REQUIRED = 'AGREEMENT_ACTION_REQUIRED',
    NEW_PAYMENT_RECEIVED = 'NEW_PAYMENT_RECEIVED',
    PLATFORM_FEE_DUE_OWNER = 'PLATFORM_FEE_DUE_OWNER',
    OFFLINE_PAYMENT_SUBMITTED = 'OFFLINE_PAYMENT_SUBMITTED',
    OFFLINE_PAYMENT_CONFIRMED = 'OFFLINE_PAYMENT_CONFIRMED',
    DEPOSIT_PAYMENT_DUE = 'DEPOSIT_PAYMENT_DUE',
    KEYS_HANDOVER_READY = 'KEYS_HANDOVER_READY',
    NEW_MAINTENANCE_REQUEST = 'NEW_MAINTENANCE_REQUEST',
    MAINTENANCE_STATUS_UPDATE = 'MAINTENANCE_STATUS_UPDATE',
    NEW_BILL_GENERATED = 'NEW_BILL_GENERATED',
    REFUND_INITIATED = 'REFUND_INITIATED',
    NEW_REVIEW_RECEIVED = 'NEW_REVIEW_RECEIVED',
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    message: string;
    timestamp: string;
    isRead: boolean;
    relatedId: string; // propertyId, viewingId, etc.
}

export enum MaintenanceStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    DONE = 'Done',
}

export enum MaintenanceCategory {
    PLUMBING = 'Plumbing',
    ELECTRICAL = 'Electrical',
    APPLIANCE = 'Appliance Repair',
    GENERAL = 'General Maintenance',
    CLEANING = 'Cleaning',
    OTHER = 'Other',
}

export interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    propertyId: string;
    assignedToId: string; // userId of renter or owner
    createdBy: string; // userId
    status: MaintenanceStatus;
    category: MaintenanceCategory;
    imageUrls?: string[];
    comments?: { userId: string, text: string, timestamp: string }[];
    dueDate: string;
    createdAt: string;
}


export interface AiFilters {
    rent_max?: number;
    bedrooms?: number[];
    bathrooms?: number[];
    furnishing?: FurnishingStatus[];
    amenities?: string[];
}

export interface PlatformSettings {
    platformFee: number;
    serviceFeePercentage: number;
    defaultViewingAdvance: number;
    applicationFee: number;
}