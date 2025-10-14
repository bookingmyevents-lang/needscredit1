import { Property, FurnishingStatus, Facing, Review, User, UserRole, Viewing, ViewingStatus, Agreement, Verification, VerificationStatus, Bill, BillType, Dispute, DisputeStatus, Payment, PaymentType, Application, ApplicationStatus, ActivityLog, ActivityType, Notification, NotificationType } from './types';

export const mockReviews: Review[] = [
    { id: 'review1', author: 'Kailash Chandra Tripathy', role: 'Owner', time: '1 year ago', rating: 5, goodThings: 'Within 50m from the Nandan Kanan Road. Close to proposed under construction metro rail. Close to proximity to Nandan Kanan.', needsImprovement: 'There is nothing I found from dislike prospective.' },
    { id: 'review2', author: 'Arpan Pratik', role: 'Owner', time: '1 year ago', rating: 4, goodThings: 'This is a beautiful place to live. All the facilities are there in this property. Hospitals, restaurants, schools are near by.', needsImprovement: 'This is a little expensive according to the price, and the parking issues may be seen.' }
];

export const mockUsers: User[] = [
  { 
    id: 'user-renter', 
    name: 'Ravi Kumar', 
    email: 'renter@example.com', 
    password: 'password', 
    role: UserRole.RENTER, 
    kycStatus: 'Not Verified', 
    phoneNumber: '9876543210',
    profilePictureUrl: 'https://i.pravatar.cc/150?u=renter@example.com',
    bio: 'Looking for a quiet and clean place to call home. I work in tech and enjoy hiking on weekends.'
  },
  { 
    id: 'user-owner', 
    name: 'Alice Wonderland', 
    email: 'owner@example.com', 
    password: 'password', 
    role: UserRole.OWNER, 
    kycStatus: 'Verified', 
    bankInfo: { accountHolder: 'Alice Wonderland', accountNumber: '...9876', ifscCode: 'HDFC000123' }, 
    phoneNumber: '8765432109',
    profilePictureUrl: 'https://i.pravatar.cc/150?u=owner@example.com',
    bio: 'Proud owner of several properties in Bhubaneswar. I aim to provide comfortable and well-maintained homes for my tenants.',
    ownerCredit: 0,
  },
  { 
    id: 'user-admin', 
    name: 'Admin User', 
    email: 'admin@example.com', 
    password: 'password', 
    role: UserRole.SUPER_ADMIN, 
    kycStatus: 'Verified', 
    phoneNumber: '7654321098',
    profilePictureUrl: 'https://i.pravatar.cc/150?u=admin@example.com',
    bio: 'Keeping the RentEase platform running smoothly.'
  },
];

export const mockProperties: Property[] = [
  {
    id: 'prop1',
    ownerId: 'user-owner',
    title: '3 BHK Flat in SJ The Royal Lagoon',
    address: 'SJ The Royal Lagoon, Raghunathpur, Bhubaneswar',
    rent: 44000,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1825,
    latitude: 20.3533,
    longitude: 85.826,
    amenities: [ { name: 'Waiting Lounge', icon: 'LoungeIcon' }, { name: 'Amphitheater', icon: 'TheaterIcon' }, { name: 'Cricket Pitch', icon: 'CricketIcon' }, { name: 'Tennis Court', icon: 'TennisIcon' }, { name: 'Spa', icon: 'SpaIcon' }, { name: 'Gazebo', icon: 'GazeboIcon' }, { name: 'Swimming Pool', icon: 'PoolIcon' }, { name: 'Gym', icon: 'GymIcon'}, ],
    images: [ 'https://picsum.photos/seed/prop1/800/600', 'https://picsum.photos/seed/prop1a/800/600', 'https://picsum.photos/seed/prop1b/800/600', 'https://picsum.photos/seed/prop1c/800/600', 'https://picsum.photos/seed/prop1d/800/600', ],
    description: 'This Flat can be a comfortable and affordable home for your family. It is a 3 BHK unit available on rent at Raghunathpur in Bhubaneswar. This Flat comes with a plethora of amenities to meet your modern lifestyle needs. It is semi furnished. It is located on floor 7 of the building having a total 14 floors.',
    availability: 'available',
    availableDate: new Date().toISOString(),
    furnishing: FurnishingStatus.SEMI_FURNISHED,
    facing: Facing.NORTH_EAST,
    parking: '1 Covered Parking',
    postedDate: '2024-07-15T10:00:00Z',
    projectName: 'SJ The Royal Lagoon',
    securityDeposit: 88000,
    brokerage: 44000,
    balconies: 2,
    floor: '7 of 14 floors',
    leaseType: 'Family / Company',
    ageOfProperty: '7 years',
    furnishingItems: [ { name: 'Fan', quantity: 1, icon: 'FanIcon' }, { name: 'Light', quantity: 1, icon: 'LightIcon' }, { name: 'Wardrobe', quantity: 1, icon: 'WardrobeIcon' }, { name: 'Chimney', quantity: 1, icon: 'ChimneyIcon' }, ],
    nearbyPlaces: [ 
        { name: 'ODM Public School', type: 'School', distance: '0.5 km' }, 
        { name: 'L V Prasad Eye Institute', type: 'Hospital', distance: '1.2 km' }, 
        { name: 'Malva Restaurant', type: 'Restaurant', distance: '0.8 km' },
        { name: 'DN Regalia Mall', type: 'Shopping', distance: '2.5 km' },
        { name: 'Infosys Campus', type: 'IT Park', distance: '3.0 km' },
        { name: 'Ekamra Kanan Botanical Gardens', type: 'Park', distance: '4.0 km' },
        { name: 'Apollo Hospitals', type: 'Hospital', distance: '2.8 km' },
        { name: 'Esplanade One Mall', type: 'Shopping', distance: '5.5 km' },
        { name: 'Barbeque Nation', type: 'Restaurant', distance: '2.6 km' },
    ],
    reviews: mockReviews,
    viewingAdvance: 500,
  },
  {
    id: 'prop2',
    ownerId: 'user-owner',
    title: 'Spacious 2BHK in Patia',
    address: '456 Tech Towers, Patia, Bhubaneswar',
    rent: 25000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1500,
    latitude: 20.35,
    longitude: 85.82,
    amenities: [ { name: 'Lift', icon: 'LiftIcon' }, { name: 'Power Backup', icon: 'BoltIcon' }, { name: 'Gated Community', icon: 'GateIcon' }, { name: 'Pet Friendly', icon: 'PetIcon' } ],
    images: [ 'https://picsum.photos/seed/prop2/800/600', 'https://picsum.photos/seed/prop2a/800/600', 'https://picsum.photos/seed/prop2b/800/600', ],
    description: 'Charming family home in a quiet, friendly neighborhood. Large backyard perfect for pets and kids. Close to top-rated schools and IT parks.',
    availability: 'available',
    availableDate: new Date().toISOString(),
    furnishing: FurnishingStatus.SEMI_FURNISHED,
    facing: Facing.SOUTH,
    parking: '1 Garage',
    postedDate: '2024-07-20T14:30:00Z',
    projectName: 'Tech Towers',
    securityDeposit: 50000,
    brokerage: 0,
    balconies: 1,
    floor: '4 of 8 floors',
    leaseType: 'Family',
    ageOfProperty: '5 years',
    furnishingItems: [{name: 'Wardrobe', quantity: 2, icon: 'WardrobeIcon'}],
    nearbyPlaces: [{name: 'KIIT University', type: 'School', distance: '1.0 km'}],
    reviews: [],
    viewingAdvance: 500,
  },
  {
    id: 'prop3',
    ownerId: 'user-owner',
    title: 'Sea View Apartment in Puri',
    address: '789 Marine Drive, Puri, Odisha',
    rent: 30000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    latitude: 19.81,
    longitude: 85.83,
    amenities: [ { name: 'CCTV', icon: 'CctvIcon' }, { name: 'Swimming Pool', icon: 'PoolIcon' }, { name: 'Lift', icon: 'LiftIcon' }, { name: 'Security', icon: 'SecurityIcon' } ],
    images: [ 'https://picsum.photos/seed/prop3/800/600', 'https://picsum.photos/seed/prop3a/800/600', 'https://picsum.photos/seed/prop3b/800/600', ],
    description: 'Live where you vacation! This beautiful apartment offers breathtaking ocean views and resort-style amenities. Fully furnished and ready for you to move in.',
    availability: 'rented',
    availableDate: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
    furnishing: FurnishingStatus.FURNISHED,
    facing: Facing.EAST,
    parking: '1 Assigned',
    postedDate: '2024-06-25T09:00:00Z',
    projectName: 'Oceanview Apartments',
    securityDeposit: 60000,
    brokerage: 15000,
    balconies: 1,
    floor: '12 of 20 floors',
    leaseType: 'Any',
    ageOfProperty: '5 years',
    furnishingItems: [],
    nearbyPlaces: [{ name: 'Puri Beach', type: 'Park', distance: '0.1 km' }],
    reviews: [],
    viewingAdvance: 1000,
  },
  {
    id: 'prop4',
    ownerId: 'user-owner',
    title: 'Modern Studio Apartment in Infocity',
    address: 'DLF Cybercity, Infocity, Bhubaneswar',
    rent: 15000,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
    latitude: 20.358,
    longitude: 85.825,
    amenities: [ { name: 'Gym', icon: 'GymIcon' }, { name: 'Lift', icon: 'LiftIcon' }, { name: 'Power Backup', icon: 'BoltIcon' }, { name: 'CCTV', icon: 'CctvIcon' } ],
    images: [ 'https://picsum.photos/seed/prop4/800/600', 'https://picsum.photos/seed/prop4a/800/600' ],
    description: 'A compact and modern studio apartment, perfect for students or working professionals. Located in the heart of the IT hub with all modern amenities.',
    availability: 'available',
    availableDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    furnishing: FurnishingStatus.FURNISHED,
    facing: Facing.EAST,
    parking: '1 Bike Parking',
    postedDate: '2024-07-22T11:00:00Z',
    projectName: 'DLF Cybercity',
    securityDeposit: 30000,
    brokerage: 7500,
    balconies: 1,
    floor: '10 of 15 floors',
    leaseType: 'Bachelors / Company',
    ageOfProperty: '3 years',
    furnishingItems: [ { name: 'Bed', quantity: 1, icon: 'BedIcon' }, { name: 'AC', quantity: 1, icon: 'AcUnitIcon' }, { name: 'Wardrobe', quantity: 1, icon: 'WardrobeIcon' }, { name: 'Geyser', quantity: 1, icon: 'GeyserIcon' } ],
    nearbyPlaces: [ 
        { name: 'Infosys', type: 'IT Park', distance: '0.5 km' }, 
        { name: 'Care Hospital', type: 'Hospital', distance: '2.0 km' }, 
        { name: 'Infocity Food Court', type: 'Restaurant', distance: '0.3 km' } 
    ],
    reviews: [],
    viewingAdvance: 500,
  },
  {
    id: 'prop5',
    ownerId: 'user-owner',
    title: '4 BHK Independent House in Nayapalli',
    address: 'IRC Village, Nayapalli, Bhubaneswar',
    rent: 55000,
    bedrooms: 4,
    bathrooms: 4,
    sqft: 2500,
    latitude: 20.285,
    longitude: 85.821,
    amenities: [ { name: 'Garden', icon: 'GardenIcon' }, { name: 'Garage', icon: 'GarageIcon' }, { name: 'Pet Friendly', icon: 'PetIcon' }, { name: 'Regular Water Supply', icon: 'WaterDropIcon' } ],
    images: [ 'https://picsum.photos/seed/prop5/800/600', 'https://picsum.photos/seed/prop5a/800/600', 'https://picsum.photos/seed/prop5b/800/600' ],
    description: 'A spacious and beautiful independent house located in a prime residential area. Perfect for a large family, with a private garden and ample parking space.',
    availability: 'available',
    availableDate: new Date().toISOString(),
    furnishing: FurnishingStatus.UNFURNISHED,
    facing: Facing.WEST,
    parking: '2 Covered Parking',
    postedDate: '2024-07-18T09:00:00Z',
    projectName: 'Independent House',
    securityDeposit: 110000,
    brokerage: 27500,
    balconies: 3,
    floor: 'G+1 floor',
    leaseType: 'Family',
    ageOfProperty: '10 years',
    furnishingItems: [],
    nearbyPlaces: [ 
        { name: 'DAV Public School, Unit 8', type: 'School', distance: '1.5 km' }, 
        { name: 'AMRI Hospital', type: 'Hospital', distance: '2.2 km' } 
    ],
    reviews: [],
    viewingAdvance: 1000,
  },
  {
    id: 'prop6',
    ownerId: 'user-owner',
    title: 'Fully Furnished 2BHK near Airport',
    address: 'Bapuji Nagar, Bhubaneswar',
    rent: 35000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    latitude: 20.265,
    longitude: 85.823,
    amenities: [ { name: 'Lift', icon: 'LiftIcon' }, { name: 'Power Backup', icon: 'BoltIcon' }, { name: 'CCTV', icon: 'CctvIcon' } ],
    images: [ 'https://picsum.photos/seed/prop6/800/600', 'https://picsum.photos/seed/prop6a/800/600' ],
    description: 'A tastefully furnished 2BHK apartment with all modern amenities. Located in a premium area with excellent connectivity to the airport and railway station.',
    availability: 'rented',
    availableDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    furnishing: FurnishingStatus.FURNISHED,
    facing: Facing.NORTH,
    parking: '1 Covered Parking',
    postedDate: '2024-06-30T18:00:00Z',
    projectName: 'Elite Residency',
    securityDeposit: 70000,
    brokerage: 0,
    balconies: 2,
    floor: '3 of 5 floors',
    leaseType: 'Family / Company',
    ageOfProperty: '2 years',
    furnishingItems: [
        { name: 'Sofa', quantity: 1, icon: 'SofaIcon' },
        { name: 'Dining Table', quantity: 1, icon: 'RestaurantIcon' },
        { name: 'Bed', quantity: 2, icon: 'BedIcon' },
        { name: 'AC', quantity: 2, icon: 'AcUnitIcon' },
        { name: 'TV', quantity: 1, icon: 'TvIcon' },
        { name: 'Fridge', quantity: 1, icon: 'FridgeIcon' },
        { name: 'Washing Machine', quantity: 1, icon: 'WashingMachineIcon' },
    ],
    nearbyPlaces: [ 
        { name: 'Bhubaneswar Railway Station', type: 'School', distance: '2.0 km' }, // Using school as a proxy for transit
        { name: 'Capital Hospital', type: 'Hospital', distance: '1.5 km' } 
    ],
    reviews: [],
    viewingAdvance: 500,
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    propertyId: 'prop1',
    renterId: 'user-renter',
    renterName: 'Ravi Kumar',
    renterEmail: 'renter@example.com',
    moveInDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: ApplicationStatus.PENDING,
    documents: { idProof: null, incomeProof: null },
  },
  {
    id: 'app2',
    propertyId: 'prop2',
    renterId: 'user-renter', // Using same user for demo
    renterName: 'Ravi Kumar',
    renterEmail: 'renter@example.com',
    moveInDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: ApplicationStatus.APPROVED,
    documents: { idProof: null, incomeProof: null },
  }
];

export const mockViewings: Viewing[] = [
    { 
        id: 'view1', 
        propertyId: 'prop1', 
        tenantId: 'user-renter', 
        ownerId: 'user-owner', 
        advanceAmount: 500, 
        status: ViewingStatus.REQUESTED, 
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
        requestedAt: new Date().toISOString(),
        verificationData: {
            fullName: 'Ravi Kumar',
            employmentDetails: 'Software Engineer at Google',
            idProofUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }
    },
    { 
        id: 'view2', 
        propertyId: 'prop2', 
        tenantId: 'user-renter', 
        ownerId: 'user-owner', 
        advanceAmount: 500, 
        status: ViewingStatus.ACCEPTED, 
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
        requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        verificationData: {
            fullName: 'Priya Sharma',
            employmentDetails: 'Product Manager at Microsoft',
            idProofUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }
    },
];

export const mockAgreements: Agreement[] = [
    { id: 'agree1', propertyId: 'prop3', tenantId: 'user-renter', ownerId: 'user-owner', rentAmount: 30000, depositAmount: 60000, startDate: '2024-07-01T00:00:00Z', signedByOwner: true, signedByTenant: true }
];

export const mockVerifications: Verification[] = [
    { id: 'ver1', tenantId: 'user-renter', status: VerificationStatus.NOT_SUBMITTED, formData: {}, submittedAt: '' }
];

export const mockBills: Bill[] = [
    { id: 'bill1', propertyId: 'prop3', tenantId: 'user-renter', type: BillType.ELECTRICITY, amount: 2500, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
    { id: 'bill2', propertyId: 'prop3', tenantId: 'user-renter', type: BillType.WATER, amount: 800, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isPaid: false },
];

export const mockPayments: Payment[] = [
    { id: 'pay1', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.RENT, amount: 30000, paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay2', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.DEPOSIT, amount: 60000, paymentDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay3', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.BILL, amount: 2200, paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay4', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.BILL, amount: 750, paymentDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), status: 'Failed' },
    { id: 'pay5', userId: 'user-renter', propertyId: 'prop1', type: PaymentType.VIEWING_ADVANCE, amount: 500, paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay6', userId: 'user-renter', propertyId: 'prop6', type: PaymentType.RENT, amount: 35000, paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay7', userId: 'user-renter', propertyId: 'prop6', type: PaymentType.DEPOSIT, amount: 70000, paymentDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay8', userId: 'user-renter', propertyId: 'prop4', type: PaymentType.VIEWING_ADVANCE, amount: 500, paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay9', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.RENT, amount: 30000, paymentDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
    { id: 'pay10', userId: 'user-renter', propertyId: 'prop3', type: PaymentType.BILL, amount: 2350, paymentDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid' },
];


export const mockDisputes: Dispute[] = [
    { id: 'disp1', relatedId: 'view2', type: 'Viewing', status: DisputeStatus.OPEN, raisedBy: 'some-other-user', messages: [{ userId: 'some-other-user', text: "The owner isn't responding to my messages to confirm the address.", timestamp: new Date().toISOString() }] }
];

export const mockActivityLogs: ActivityLog[] = [
    {
        id: 'log1',
        userId: 'user-renter',
        type: ActivityType.PAID_BILL,
        message: 'Paid electricity bill of ₹2500 for Sea View Apartment in Puri.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'log2',
        userId: 'user-renter',
        type: ActivityType.SIGNED_AGREEMENT,
        message: 'Signed rental agreement for Sea View Apartment in Puri.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'log3',
        userId: 'user-owner',
        type: ActivityType.APPROVED_APPLICATION,
        message: 'Approved application for Ravi Kumar for Spacious 2BHK in Patia.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

export const mockNotifications: Notification[] = [
    {
        id: 'notif1',
        userId: 'user-owner',
        type: NotificationType.NEW_VIEWING_REQUEST,
        message: 'Ravi Kumar has requested a viewing for "3 BHK Flat in SJ The Royal Lagoon".',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        isRead: false,
        relatedId: 'prop1',
    },
    {
        id: 'notif2',
        userId: 'user-renter',
        type: NotificationType.APPLICATION_STATUS_UPDATE,
        message: 'Your application for "Spacious 2BHK in Patia" has been approved!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isRead: true,
        relatedId: 'app2',
    }
];


export const mockAgreementText = `
RENTAL AGREEMENT

This Rental Agreement ("Agreement") is made and entered into on this day, by and between:

LANDLORD: the Landlord
("Landlord")

and

TENANT: the Tenant
("Tenant")

1. PROPERTY.
Landlord, in consideration of the rent to be paid and the covenants and agreements to be performed and observed by the Tenant, does hereby lease to the Tenant the following property: the address specified in the application ("the Premises").

2. TERM.
The term of this lease shall be for a period of 12 months, commencing on the agreed-upon move-in date.

3. RENT.
The total rent for the term hereof is the sum of the monthly rent specified in the application per month, payable on the 1st day of each month.

4. SECURITY DEPOSIT.
Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of [Security Deposit Amount] as security for the faithful performance by Tenant of the terms hereof.

5. USE OF PREMISES.
The Premises shall be used and occupied by Tenant and Tenant's immediate family, exclusively, as a private single-family dwelling, and no part of the Premises shall be used at any time during the term of this Agreement by Tenant for the purpose of carrying on any business, profession, or trade of any kind, or for any purpose other than as a private single-family dwelling.

6. UTILITIES.
Tenant shall be responsible for arranging for and paying for all utility services required on the Premises.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

_________________________
Landlord Signature

_________________________
Tenant Signature
`;