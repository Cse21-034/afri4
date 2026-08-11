import { createHash } from 'crypto';
import type {
  InsertUser,
  InsertJob,
  InsertChat,
  InsertNotification,
  InsertRating,
  InsertDispute,
  User,
  Job,
  Chat,
  Notification,
  Rating,
  Dispute
} from './shared/schema.js';
import { users, jobs, chats, notifications, ratings, disputes } from './shared/schema.js';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { eq, and, or, desc, gt, sql } from 'drizzle-orm';

interface IStorage {
  // Users
  createUser(data: Omit<InsertUser, 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | null>;
  getUserByEmailOrPhone(identifier: string): Promise<User | null>;
  updateUser(id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void>;
  updateUserSubscription(id: number, data: {
        subscriptionStatus: 'active' | 'inactive' | 'trial';
    subscriptionExpiresAt?: Date;
  }): Promise<void>;
  
  // Email Verification
  getUserByVerificationToken(token: string): Promise<User | null>;
  verifyUserEmail(userId: number): Promise<void>;
  updateVerificationToken(userId: number, token: string): Promise<void>;
  
  // Password Reset
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | null>;
  resetPassword(userId: number, hashedPassword: string): Promise<void>;
  
  // Account Locking
  incrementLoginAttempts(userId: number): Promise<number>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockAccount(userId: number, until: Date): Promise<void>;
  unlockAccount(userId: number): Promise<void>;
  
  // 2FA Methods
  set2FACode(userId: number, code: string, expiresAt: Date): Promise<void>;
  verify2FACode(userId: number, code: string): Promise<boolean>;
  clear2FACode(userId: number): Promise<void>;
  enable2FA(userId: number, backupCodes: string[]): Promise<void>;
  disable2FA(userId: number): Promise<void>;
  verifyBackupCode(userId: number, code: string): Promise<boolean>;
  
  // Jobs
  createJob(data: Omit<InsertJob, 'createdAt' | 'updatedAt'>): Promise<Job>;
  getJobById(id: number): Promise<Job | null>;
  getJobs(filters: {
    status?: string;
    cargoType?: string;
    industry?: string;
    pickupCountry?: string;
    deliveryCountry?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]>;
  getUserJobs(userId: number, role: 'shipper' | 'carrier'): Promise<Job[]>;
  getJobsByShipper(shipperId: number): Promise<Job[]>;
  getJobsByCarrier(carrierId: number): Promise<Job[]>;
  updateJob(id: number, data: Partial<Omit<Job, 'id' | 'createdAt'>>): Promise<void>;
  takeJob(jobId: number, carrierId: number): Promise<Job | null>;
  completeJob(jobId: number): Promise<Job | null>;
  
  // Chats
  createChat(data: Omit<InsertChat, 'createdAt' | 'updatedAt'>): Promise<Chat>;
  getChatById(id: number): Promise<Chat | null>;
  getChatByJobId(jobId: number): Promise<Chat | null>;
  getUserChats(userId: number): Promise<Chat[]>;
  getChatsByUser(userId: number): Promise<Chat[]>;
  addMessage(chatId: number, senderId: number, content: string): Promise<Chat | null>;
  markMessagesAsRead(chatId: number, userId: number): Promise<boolean>;
  
  // Notifications
  createNotification(data: Omit<InsertNotification, 'createdAt'>): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Ratings
  createRating(data: Omit<InsertRating, 'createdAt'>): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;
  getJobRatings(jobId: number): Promise<Rating[]>;
  getUserAverageRating(userId: number): Promise<number>;
  
  // Analytics operations
  getUserCount(role?: string): Promise<number>;
  getJobCount(status?: string): Promise<number>;
  
  // Admin operations
  getAllUsers(filters: {
    role?: string;
    verified?: boolean;
    hasDocuments?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]>;
  getUsersWithPendingDocuments(): Promise<User[]>;
  verifyUserDocuments(userId: number, adminId: number, approved: boolean, notes?: string): Promise<void>;
  
  // Dispute operations
  createDispute(data: Omit<InsertDispute, 'createdAt' | 'updatedAt'>): Promise<Dispute>;
  getDisputes(filters: {
    status?: string;
    adminId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Dispute[]>;
  getDisputeById(id: number): Promise<Dispute | null>;
  updateDispute(id: number, data: Partial<Omit<Dispute, 'id' | 'createdAt'>>): Promise<void>;
  assignDisputeToAdmin(disputeId: number, adminId: number): Promise<void>;
  resolveDispute(disputeId: number, resolution: string, adminId: number): Promise<void>;
}

class PostgreSQLStorage implements IStorage {
  // ==================== USER METHODS ====================

  async createUser(data: Omit<InsertUser, 'createdAt' | 'updatedAt'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...data,
        password: hashedPassword,
        loginAttempts: 0,
        accountLocked: false,
      } as any)
      .returning();
    
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user || null;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));

    return user || null;
  }

  async getUserByEmailOrPhone(identifier: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phoneNumber, identifier)));

    return user || null;
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, id));
  }

  async updateUserSubscription(id: number, data: {
        subscriptionStatus: 'active' | 'inactive' | 'trial';
    subscriptionExpiresAt?: Date;
  }): Promise<void> {
    await db
      .update(users)
      .set({
                subscriptionStatus: data.subscriptionStatus,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, id));
  }

  // ==================== EMAIL VERIFICATION ====================

  async getUserByVerificationToken(token: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    
    return user || null;
  }

  async verifyUserEmail(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async updateVerificationToken(userId: number, token: string): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  // ==================== PASSWORD RESET ====================

  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      );
    
    return user || null;
  }

  async resetPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  // ==================== ACCOUNT LOCKING ====================

  async incrementLoginAttempts(userId: number): Promise<number> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return 0;

    const newAttempts = (user.loginAttempts || 0) + 1;

    await db
      .update(users)
      .set({
        loginAttempts: newAttempts,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));

    return newAttempts;
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        loginAttempts: 0,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async lockAccount(userId: number, until: Date): Promise<void> {
    await db
      .update(users)
      .set({
        accountLocked: true,
        lockExpires: until,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async unlockAccount(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        accountLocked: false,
        lockExpires: null,
        loginAttempts: 0,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  // ==================== 2FA METHODS ====================

  async set2FACode(userId: number, code: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorCode: code,
        twoFactorExpires: expiresAt,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async verify2FACode(userId: number, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.twoFactorCode, code),
          gt(users.twoFactorExpires, new Date())
        )
      );

    return !!user;
  }

  async clear2FACode(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorCode: null,
        twoFactorExpires: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async enable2FA(userId: number, backupCodes: string[]): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
        backupCodes: backupCodes,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async disable2FA(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorCode: null,
        twoFactorExpires: null,
        backupCodes: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
  }

  async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.backupCodes) {
      return false;
    }

    const backupCodes = user.backupCodes as string[];
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const newBackupCodes = backupCodes.filter((_, index) => index !== codeIndex);

    await db
      .update(users)
      .set({
        backupCodes: newBackupCodes,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));

    return true;
  }

  // ==================== JOB METHODS ====================

  async createJob(data: Omit<InsertJob, 'createdAt' | 'updatedAt'>): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(data)
      .returning();
    
    return job;
  }

  async getJobById(id: number): Promise<Job | null> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    
    return job || null;
  }

  async getJobs(filters: {
    status?: string;
    cargoType?: string;
    industry?: string;
    pickupCountry?: string;
    deliveryCountry?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    const conditions = [];
    if (filters.status) conditions.push(eq(jobs.status, filters.status as any));
    if (filters.cargoType) conditions.push(eq(jobs.cargoType, filters.cargoType as any));
    if (filters.industry) conditions.push(eq(jobs.industry, filters.industry as any));
    if (filters.pickupCountry) conditions.push(eq(jobs.pickupCountry, filters.pickupCountry as any));
    if (filters.deliveryCountry) conditions.push(eq(jobs.deliveryCountry, filters.deliveryCountry as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(jobs.createdAt)) as any;
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return query;
  }

  async getUserJobs(userId: number, role: 'shipper' | 'carrier'): Promise<Job[]> {
    const condition = role === 'shipper' 
      ? eq(jobs.shipperId, userId)
      : eq(jobs.carrierId, userId);
    
    return db
      .select()
      .from(jobs)
      .where(condition)
      .orderBy(desc(jobs.createdAt));
  }

  async updateJob(id: number, data: Partial<Omit<Job, 'id' | 'createdAt'>>): Promise<void> {
    await db
      .update(jobs)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(eq(jobs.id, id));
  }

  async takeJob(jobId: number, carrierId: number): Promise<Job | null> {
    const [updatedJob] = await db
      .update(jobs)
      .set({
        carrierId,
        status: 'taken',
        takenAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(jobs.id, jobId))
      .returning();
    
    return updatedJob || null;
  }

  async completeJob(jobId: number): Promise<Job | null> {
    const [updatedJob] = await db
      .update(jobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(jobs.id, jobId))
      .returning();
    
    return updatedJob || null;
  }

  // ==================== CHAT METHODS ====================

  async createChat(data: Omit<InsertChat, 'createdAt' | 'updatedAt'>): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(data)
      .returning();
    
    return chat;
  }

  async getChatById(id: number): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id));
    
    return chat || null;
  }

  async getChatByJobId(jobId: number): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.jobId, jobId));
    
    return chat || null;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return db
      .select()
      .from(chats)
      .where(sql`${chats.participants}::jsonb @> ${JSON.stringify([userId])}`)
      .orderBy(desc(chats.updatedAt));
  }

  async addMessage(chatId: number, senderId: number, content: string): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    
    if (!chat) return null;
    
    const newMessage = {
      senderId,
      content,
      timestamp: new Date(),
      read: false,
    };
    
    const updatedMessages = [...(chat.messages || []), newMessage];
    
    const [updatedChat] = await db
      .update(chats)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      } as any)
      .where(eq(chats.id, chatId))
      .returning();
    
    return updatedChat || null;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<boolean> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    
    if (!chat) return false;
    
    const updatedMessages = (chat.messages || []).map(message => ({
      ...message,
      read: message.senderId === userId ? message.read : true,
    }));
    
    await db
      .update(chats)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      } as any)
      .where(eq(chats.id, chatId));
    
    return true;
  }

  // ==================== NOTIFICATION METHODS ====================

  async createNotification(data: Omit<InsertNotification, 'createdAt'>): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  }

  async getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ read: true } as any)
      .where(eq(notifications.id, id));
    
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true } as any)
      .where(eq(notifications.userId, userId));
  }

  // ==================== RATING METHODS ====================

  async createRating(data: Omit<InsertRating, 'createdAt'>): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(data)
      .returning();
    
    return rating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getJobRatings(jobId: number): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.jobId, jobId));
  }

  async getUserAverageRating(userId: number): Promise<number> {
    const [result] = await db
      .select({
        avgRating: sql<number>`AVG(${ratings.rating})::float`,
      })
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));
    
    return result?.avgRating || 0;
  }
  
  // ==================== ANALYTICS METHODS ====================

  async getUserCount(role?: string): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(users);
    
    if (role) {
      query = query.where(eq(users.role, role as any)) as any;
    }
    
    const [result] = await query;
    return result?.count || 0;
  }
  
  async getJobCount(status?: string): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(jobs);
    
    if (status) {
      query = query.where(eq(jobs.status, status as any)) as any;
    }
    
    const [result] = await query;
    return result?.count || 0;
  }

  // ==================== HELPER METHODS ====================

  async getJobsByShipper(shipperId: number): Promise<Job[]> {
    return this.getUserJobs(shipperId, 'shipper');
  }
  
  async getJobsByCarrier(carrierId: number): Promise<Job[]> {
    return this.getUserJobs(carrierId, 'carrier');
  }
  
  async getChatsByUser(userId: number): Promise<Chat[]> {
    return this.getUserChats(userId);
  }
  
  async getNotificationsByUser(userId: number, limit: number = 50): Promise<Notification[]> {
    return this.getUserNotifications(userId, limit);
  }
  
  // ==================== ADMIN METHODS ====================

  async getAllUsers(filters: {
    role?: string;
    verified?: boolean;
    hasDocuments?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    let query = db.select().from(users);
    
    const conditions = [];
    if (filters.role) conditions.push(eq(users.role, filters.role as any));
    if (filters.verified !== undefined) conditions.push(eq((users as any).verified, filters.verified));
    if (filters.hasDocuments !== undefined) {
      if (filters.hasDocuments) {
        conditions.push(sql`${users.documents} IS NOT NULL AND ${users.documents} != '[]'`);
      } else {
        conditions.push(or(sql`${users.documents} IS NULL`, sql`${users.documents} = '[]'`));
      }
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(users.createdAt)) as any;
    
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;
    
    return await query;
  }
  
  async getUsersWithPendingDocuments(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(
        and(
          sql`${users.documents} IS NOT NULL`,
          sql`${users.documents} != '[]'`,
          eq((users as any).verified, false)
        )
      )
      .orderBy(desc(users.createdAt));
  }
  
  async verifyUserDocuments(userId: number, adminId: number, approved: boolean, notes?: string): Promise<void> {
    await db
      .update(users)
      .set({
        verified: approved,
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId));
    
    // Create notification for user
    await this.createNotification({
      userId: userId,
      type: approved ? 'job_match' : 'subscription_expiring',
      title: approved ? 'Documents Verified' : 'Documents Rejected',
      message: approved 
        ? 'Your business documents have been verified and your account is now active.'
        : `Your documents were rejected: ${notes || 'Please upload valid business documents.'}`,
      data: { adminId, notes }
    } as any);
  }
  
  // ==================== DISPUTE METHODS ====================

  async createDispute(data: Omit<InsertDispute, 'createdAt' | 'updatedAt'>): Promise<Dispute> {
    const [dispute] = await db
      .insert(disputes)
      .values(data)
      .returning();
    
    return dispute;
  }
  
  async getDisputes(filters: {
    status?: string;
    adminId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Dispute[]> {
    let query = db.select().from(disputes);
    
    const conditions = [];
    if (filters.status) conditions.push(eq(disputes.status, filters.status as any));
    if (filters.adminId) conditions.push(eq(disputes.adminId, filters.adminId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(disputes.createdAt)) as any;
    
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;
    
    return await query;
  }
  
  async getDisputeById(id: number): Promise<Dispute | null> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    
    return dispute || null;
  }
  
  async updateDispute(id: number, data: Partial<Omit<Dispute, 'id' | 'createdAt'>>): Promise<void> {
    await db
      .update(disputes)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(eq(disputes.id, id));
  }
  
  async assignDisputeToAdmin(disputeId: number, adminId: number): Promise<void> {
    await db
      .update(disputes)
      .set({
        adminId: adminId,
        status: 'in_review',
        updatedAt: new Date(),
      } as any)
      .where(eq(disputes.id, disputeId));
  }
  
  async resolveDispute(disputeId: number, resolution: string, adminId: number): Promise<void> {
    await db
      .update(disputes)
      .set({
        resolution: resolution,
        status: 'resolved',
        adminId: adminId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(disputes.id, disputeId));
  }
}

export const storage = new PostgreSQLStorage();
