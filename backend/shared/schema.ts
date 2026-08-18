import { z } from "zod";
import { pgTable, serial, text, varchar, integer, numeric, boolean, timestamp, json, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['trucking_company', 'shipping_entity', 'super_admin', 'customer_support']);
export const cargoTypeEnum = pgEnum('cargo_type', ['general', 'refrigerated', 'hazardous', 'bulk', 'containers', 'livestock', 'agricultural', 'mining', 'construction', 'vehicles', 'electronics', 'textiles', 'pharmaceuticals', 'perishables', 'oversized', 'liquids']);
export const industryEnum = pgEnum('industry', ['agriculture', 'manufacturing', 'retail', 'mining', 'logistics', 'construction']);
export const jobStatusEnum = pgEnum('job_status', ['available', 'taken', 'completed', 'cancelled']);
export const countryEnum = pgEnum('country', ['AGO', 'BWA', 'COM', 'COD', 'SWZ', 'LSO', 'MDG', 'MWI', 'MUS', 'MOZ', 'NAM', 'SYC', 'ZAF', 'TZA', 'ZMB', 'ZWE']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'trial']);
export const notificationTypeEnum = pgEnum('notification_type', ['job_match', 'job_taken', 'job_completed', 'payment_confirmed', 'subscription_expiring']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'in_review', 'resolved', 'closed']);
export const rateBasisEnum = pgEnum('rate_basis', ['flat', 'per_ton', 'per_km', 'per_load', 'quote']);
export const truckTypeEnum = pgEnum('truck_type', ['tri_axle', 'superlink', 'link', 'tautliner', 'flat_deck', 'pantech', 'tanker', 'tipper', 'lowbed', 'reefer', 'side_tipper', 'other']);
export const jobModeEnum = pgEnum('job_mode', ['fixed', 'tender']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'accepted', 'rejected', 'withdrawn']);
export const stopTypeEnum = pgEnum('stop_type', ['pickup', 'delivery']);

// User roles
export const UserRole = {
  TRUCKING_COMPANY: 'trucking_company',
  SHIPPING_ENTITY: 'shipping_entity',
  SUPER_ADMIN: 'super_admin',
  CUSTOMER_SUPPORT: 'customer_support'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Cargo types
export const CargoType = {
  GENERAL: 'general',
  REFRIGERATED: 'refrigerated',
  HAZARDOUS: 'hazardous',
  BULK: 'bulk',
  CONTAINERS: 'containers',
  LIVESTOCK: 'livestock',
  AGRICULTURAL: 'agricultural',
  MINING: 'mining',
  CONSTRUCTION: 'construction',
  VEHICLES: 'vehicles',
  ELECTRONICS: 'electronics',
  TEXTILES: 'textiles',
  PHARMACEUTICALS: 'pharmaceuticals',
  PERISHABLES: 'perishables',
  OVERSIZED: 'oversized',
  LIQUIDS: 'liquids'
} as const;

export type CargoTypeType = typeof CargoType[keyof typeof CargoType];

// Industries
export const Industry = {
  AGRICULTURE: 'agriculture',
  MANUFACTURING: 'manufacturing',
  RETAIL: 'retail',
  MINING: 'mining',
  LOGISTICS: 'logistics',
  CONSTRUCTION: 'construction'
} as const;

export type IndustryType = typeof Industry[keyof typeof Industry];

// Job status
export const JobStatus = {
  AVAILABLE: 'available',
  TAKEN: 'taken',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type JobStatusType = typeof JobStatus[keyof typeof JobStatus];

// Countries
export const Country = {
  ANGOLA: 'AGO',
  BOTSWANA: 'BWA',
  COMOROS: 'COM',
  DR_CONGO: 'COD',
  ESWATINI: 'SWZ',
  LESOTHO: 'LSO',
  MADAGASCAR: 'MDG',
  MALAWI: 'MWI',
  MAURITIUS: 'MUS',
  MOZAMBIQUE: 'MOZ',
  NAMIBIA: 'NAM',
  SEYCHELLES: 'SYC',
  SOUTH_AFRICA: 'ZAF',
  TANZANIA: 'TZA',
  ZAMBIA: 'ZMB',
  ZIMBABWE: 'ZWE'
} as const;

export type CountryType = typeof Country[keyof typeof Country];

// Rate basis -- how rate_amount should be interpreted (a flat R8,000 and a R500/ton
// rate are not comparable as a bare number, the basis is what makes them mean something)
export const RateBasis = {
  FLAT: 'flat',
  PER_TON: 'per_ton',
  PER_KM: 'per_km',
  PER_LOAD: 'per_load',
  QUOTE: 'quote'
} as const;

export type RateBasisType = typeof RateBasis[keyof typeof RateBasis];

export const TruckType = {
  TRI_AXLE: 'tri_axle',
  SUPERLINK: 'superlink',
  LINK: 'link',
  TAUTLINER: 'tautliner',
  FLAT_DECK: 'flat_deck',
  PANTECH: 'pantech',
  TANKER: 'tanker',
  TIPPER: 'tipper',
  LOWBED: 'lowbed',
  REEFER: 'reefer',
  SIDE_TIPPER: 'side_tipper',
  OTHER: 'other'
} as const;

export type TruckTypeType = typeof TruckType[keyof typeof TruckType];

// Job mode -- 'fixed' is the original one-job-one-carrier lifecycle (unchanged).
// 'tender' is for bulk loads where a shipper posts a total quantity and many
// carriers each bid a rate + how much of it they can cover (see jobBids).
export const JobMode = {
  FIXED: 'fixed',
  TENDER: 'tender'
} as const;

export type JobModeType = typeof JobMode[keyof typeof JobMode];

export const BidStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const;

export type BidStatusType = typeof BidStatus[keyof typeof BidStatus];

export const StopType = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery'
} as const;

export type StopTypeType = typeof StopType[keyof typeof StopType];

// Database Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }).notNull(),

  // Common fields
  companyName: varchar('company_name', { length: 255 }),
  contactPersonName: varchar('contact_person_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull().unique(),
  physicalAddress: text('physical_address').notNull(),
  country: countryEnum('country').notNull().default('BWA'),
  businessRegistrationNumber: varchar('business_registration_number', { length: 100 }),
  
  // Trucking company specific
  fleetSize: integer('fleet_size'),
  cargoTypes: json('cargo_types').$type<string[]>(),
  documents: json('documents').$type<Array<{
    filename: string;
    fileUrl: string;
    verified: boolean;
  }>>(),
  verified: boolean('verified').notNull().default(false),
  
  // Subscription fields
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('inactive'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeSubscriptionStatus: varchar('stripe_subscription_status', { length: 50 }),
  
  // Security fields
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  loginAttempts: integer('login_attempts').notNull().default(0),
  accountLocked: boolean('account_locked').notNull().default(false),
  lockExpires: timestamp('lock_expires'),
  
  // 2FA fields
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  twoFactorCode: varchar('two_factor_code', { length: 10 }),
  twoFactorExpires: timestamp('two_factor_expires'),
  backupCodes: json('backup_codes').$type<string[]>(),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  shipperId: integer('shipper_id').notNull().references(() => users.id),
  carrierId: integer('carrier_id').references(() => users.id),
  // Set only when an admin posted this job on a shipping entity's behalf --
  // shipperId still points at the company, this is just an audit trail of who typed it in.
  postedByAdminId: integer('posted_by_admin_id').references(() => users.id),

  // Cargo details -- all optional: not every job has a known weight/volume/deadline upfront,
  // let the poster fill in only what they actually know.
  cargoType: cargoTypeEnum('cargo_type'),
  cargoWeight: integer('cargo_weight'), // in kg
  cargoVolume: integer('cargo_volume'), // in m³
  industry: industryEnum('industry'),
  quantity: integer('quantity').notNull().default(1), // number of loads, for multi-load fixed jobs

  // Locations
  pickupAddress: text('pickup_address'),
  deliveryAddress: text('delivery_address'),
  pickupCountry: countryEnum('pickup_country'),
  deliveryCountry: countryEnum('delivery_country'),
  distanceKm: integer('distance_km'),

  // Schedule
  pickupDate: timestamp('pickup_date'),
  deliveryDeadline: timestamp('delivery_deadline'),

  // Requirements
  specialHandling: text('special_handling'),
  insuranceRequired: boolean('insurance_required').notNull().default(false),
  notes: text('notes'),

  // Equipment -- what kind of truck this load actually needs
  truckType: truckTypeEnum('truck_type'),
  truckRequirements: text('truck_requirements').array(), // e.g. ['pole_pockets', 'closed_body']

  // Structured compliance -- promoted out of free-text notes so they're filterable
  requiresHazmat: boolean('requires_hazmat').notNull().default(false),
  requiresTrec: boolean('requires_trec').notNull().default(false),
  requiresPlacards: boolean('requires_placards').notNull().default(false),
  permits: text('permits').array(), // e.g. ['RIT', 'Agri Permit', 'MPR manifest']

  // Commerce -- the rate and terms, without which a carrier can't decide on a job
  rateAmount: numeric('rate_amount'), // null when rateBasis is 'quote'
  rateBasis: rateBasisEnum('rate_basis').notNull().default('flat'),
  rateCurrency: varchar('rate_currency', { length: 10 }),
  paymentTerms: text('payment_terms'), // free text -- real-world phrasing varies too much to enum
  dieselOnAccount: boolean('diesel_on_account').notNull().default(false),

  // Tender mode -- 'fixed' jobs are unchanged (one carrier takes the whole job).
  // 'tender' jobs stay browsable while many carriers bid via jobBids; carrierId
  // stays null for those, the accepted bids are the record of who's carrying what.
  jobMode: jobModeEnum('job_mode').notNull().default('fixed'),
  totalQuantity: integer('total_quantity'), // e.g. 4000, for tenders
  quantityUnit: varchar('quantity_unit', { length: 20 }), // 'tons' | 'loads', etc.

  // Status
  status: jobStatusEnum('status').notNull().default('available'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  takenAt: timestamp('taken_at'),
  completedAt: timestamp('completed_at')
});

// Multiple pickup/delivery stops for a job (e.g. "pickup A, drop half at B, rest at C").
// pickupAddress/deliveryAddress on the job stay as the summary origin/destination for
// list views; this table is the detail, ordered by `sequence`.
export const jobStops = pgTable('job_stops', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  sequence: integer('sequence').notNull(),
  stopType: stopTypeEnum('stop_type').notNull(),
  address: text('address').notNull(),
  country: countryEnum('country'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

// A carrier's bid on a tender job -- rate + how much of the total quantity they can cover.
// The accepted bids on a tender ARE the assignment record (no separate table needed):
// the tender is filled once accepted bids' capacityOffered sums to >= totalQuantity.
export const jobBids = pgTable('job_bids', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  carrierId: integer('carrier_id').notNull().references(() => users.id),
  rateAmount: numeric('rate_amount'),
  rateBasis: rateBasisEnum('rate_basis').notNull().default('per_ton'),
  capacityOffered: integer('capacity_offered'), // how much of totalQuantity this carrier can cover
  weeklyCapacity: integer('weekly_capacity'),
  message: text('message'),
  status: bidStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  oneBidPerCarrierPerJob: unique().on(table.jobId, table.carrierId)
}));

// A trucking company's declared fleet/reach -- the mirror of a job's requirements,
// so "which carriers can run this load" becomes a query instead of a phone call.
export const carrierCapabilities = pgTable('carrier_capabilities', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  truckTypes: truckTypeEnum('truck_types').array(),
  crossBorder: boolean('cross_border').notNull().default(false),
  hazmatCertified: boolean('hazmat_certified').notNull().default(false),
  countries: countryEnum('countries').array(),
  features: text('features').array(), // e.g. ['pole_pockets', 'tautliner_curtains']
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Broadcast notices that aren't jobs (border delays, weighbridge updates, etc.)
// but matter to the same carrier/shipper audience.
export const advisories = pgTable('advisories', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  country: countryEnum('country'),
  postedByAdminId: integer('posted_by_admin_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  participants: json('participants').$type<number[]>().notNull(),
  messages: json('messages').$type<Array<{
    senderId: number;
    content: string;
    timestamp: Date;
    read: boolean;
  }>>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: json('data').$type<Record<string, any>>(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const ratings = pgTable('ratings', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  raterId: integer('rater_id').notNull().references(() => users.id),
  ratedUserId: integer('rated_user_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`)
});

export const disputes = pgTable('disputes', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  reportedUserId: integer('reported_user_id').references(() => users.id),
  adminId: integer('admin_id').references(() => users.id),
  status: disputeStatusEnum('status').notNull().default('open'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  evidence: json('evidence').$type<Array<{
    type: 'document' | 'image' | 'message';
    url: string;
    description?: string;
  }>>().default([]),
  adminNotes: text('admin_notes'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  resolvedAt: timestamp('resolved_at')
});

// Drizzle schemas and types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const insertRatingSchema = createInsertSchema(ratings);
export const selectRatingSchema = createSelectSchema(ratings);
export const insertDisputeSchema = createInsertSchema(disputes);
export const selectDisputeSchema = createSelectSchema(disputes);
export const insertJobStopSchema = createInsertSchema(jobStops);
export const selectJobStopSchema = createSelectSchema(jobStops);
export const insertJobBidSchema = createInsertSchema(jobBids);
export const selectJobBidSchema = createSelectSchema(jobBids);
export const insertCarrierCapabilitiesSchema = createInsertSchema(carrierCapabilities);
export const selectCarrierCapabilitiesSchema = createSelectSchema(carrierCapabilities);
export const insertAdvisorySchema = createInsertSchema(advisories);
export const selectAdvisorySchema = createSelectSchema(advisories);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type SelectJob = typeof jobs.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;
export type SelectChat = typeof chats.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type SelectNotification = typeof notifications.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;
export type SelectRating = typeof ratings.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;
export type SelectDispute = typeof disputes.$inferSelect;
export type InsertJobStop = typeof jobStops.$inferInsert;
export type SelectJobStop = typeof jobStops.$inferSelect;
export type InsertJobBid = typeof jobBids.$inferInsert;
export type SelectJobBid = typeof jobBids.$inferSelect;
export type InsertCarrierCapabilities = typeof carrierCapabilities.$inferInsert;
export type SelectCarrierCapabilities = typeof carrierCapabilities.$inferSelect;
export type InsertAdvisory = typeof advisories.$inferInsert;
export type SelectAdvisory = typeof advisories.$inferSelect;

// Legacy types for compatibility
export type User = SelectUser;
export type Job = SelectJob;
export type Chat = SelectChat;
export type Notification = SelectNotification;
export type Rating = SelectRating;
export type Dispute = SelectDispute;
export type JobStop = SelectJobStop;
export type JobBid = SelectJobBid;
export type CarrierCapabilities = SelectCarrierCapabilities;
export type Advisory = SelectAdvisory;

// A shipper editing their own job: everything the job accepts on creation, minus
// ownership (shipperId) and lifecycle (status) -- those only change via take/complete/
// cancel/release, never a direct edit. Only allowed while the job is still 'available'
// (enforced in the route, not here). Defined standalone rather than derived via
// insertJobSchema.partial().omit(...) -- drizzle-zod's inferred shape doesn't chain
// cleanly through omit/pick in this version.
export const updateJobSchema = z.object({
  cargoType: z.enum(Object.values(CargoType) as [string, ...string[]]).optional(),
  cargoWeight: z.number().optional(),
  cargoVolume: z.number().optional(),
  industry: z.enum(Object.values(Industry) as [string, ...string[]]).optional(),
  quantity: z.number().min(1).optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  pickupCountry: z.enum(Object.values(Country) as [string, ...string[]]).optional(),
  deliveryCountry: z.enum(Object.values(Country) as [string, ...string[]]).optional(),
  distanceKm: z.number().optional(),
  pickupDate: z.coerce.date().optional(),
  deliveryDeadline: z.coerce.date().optional(),
  specialHandling: z.string().optional(),
  insuranceRequired: z.boolean().optional(),
  notes: z.string().optional(),
  truckType: z.enum(Object.values(TruckType) as [string, ...string[]]).optional(),
  truckRequirements: z.array(z.string()).optional(),
  requiresHazmat: z.boolean().optional(),
  requiresTrec: z.boolean().optional(),
  requiresPlacards: z.boolean().optional(),
  permits: z.array(z.string()).optional(),
  rateAmount: z.union([z.string(), z.number()]).optional(),
  rateBasis: z.enum(Object.values(RateBasis) as [string, ...string[]]).optional(),
  rateCurrency: z.string().optional(),
  paymentTerms: z.string().optional(),
  dieselOnAccount: z.boolean().optional(),
  totalQuantity: z.number().optional(),
  quantityUnit: z.string().optional()
});
export type UpdateJobData = z.infer<typeof updateJobSchema>;

export const submitBidSchema = z.object({
  rateAmount: z.union([z.string(), z.number()]).optional(),
  rateBasis: z.enum(Object.values(RateBasis) as [string, ...string[]]).default(RateBasis.PER_TON),
  capacityOffered: z.number().min(1).optional(),
  weeklyCapacity: z.number().min(1).optional(),
  message: z.string().optional()
});
export type SubmitBidData = z.infer<typeof submitBidSchema>;

export const bidDecisionSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'withdrawn'])
});
export type BidDecisionData = z.infer<typeof bidDecisionSchema>;

// Login schemas
export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or phone number"),
  password: z.string()
});

export const registerTruckingSchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  password: z.string().min(8),
  contactPersonName: z.string().min(1),
  companyName: z.string().min(1),
  phoneNumber: z.string().min(1),
  physicalAddress: z.string().min(1),
  businessRegistrationNumber: z.string().min(1),
  fleetSize: z.number().min(1),
  cargoTypes: z.array(z.enum(Object.values(CargoType) as [string, ...string[]])).min(1),
  country: z.enum(Object.values(Country) as [string, ...string[]]).default(Country.BOTSWANA)
});

export const registerShippingSchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  password: z.string().min(8),
  contactPersonName: z.string().min(1),
  companyName: z.string().min(1),
  phoneNumber: z.string().min(1),
  physicalAddress: z.string().min(1),
  businessRegistrationNumber: z.string().optional(),
  country: z.enum(Object.values(Country) as [string, ...string[]]).default(Country.BOTSWANA)
});

// Enhanced authentication schemas
export const verifyEmailSchema = z.object({
  token: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const enable2FASchema = z.object({});

export const disable2FASchema = z.object({
  password: z.string().min(1)
});

export const verifyBackupCodeSchema = z.object({
  email: z.string().email(),
  backupCode: z.string().min(1)
});

export const twoFactorCodeSchema = z.object({
  email: z.string().email(),
  twoFactorCode: z.string().min(6).max(6)
});

export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationData = z.infer<typeof resendVerificationSchema>;
export type Enable2FAData = z.infer<typeof enable2FASchema>;
export type Disable2FAData = z.infer<typeof disable2FASchema>;
export type VerifyBackupCodeData = z.infer<typeof verifyBackupCodeSchema>;
export type TwoFactorCodeData = z.infer<typeof twoFactorCodeSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterTruckingData = z.infer<typeof registerTruckingSchema>;
export type RegisterShippingData = z.infer<typeof registerShippingSchema>;
