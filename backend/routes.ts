import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storage } from "./storage.js";
import { WebSocketService } from "./services/services/websocket.js";
import { emailService } from "./services/services/email.js";
import { stripeService } from "./services/services/stripe.js";
import { authenticateToken, requireRole, requireSubscription, AuthRequest } from "./middleware/middleware/auth.js";
import { 
  loginSchema, 
  registerTruckingSchema, 
  registerShippingSchema, 
  insertJobSchema,
  UserRole,
  JobStatus 
} from "./shared/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('JWT_SECRET not set. Using development secret.');
}

// Configure multer for file uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Helper function to generate 6-digit 2FA code
function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate backup codes
function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

// Attaches job details and the other participant's public info to a chat,
// for the chat inbox/detail UI. Never spreads the raw user record (has password hash etc.) -
// only whitelisted public fields are included.
async function enrichChat(chat: any, currentUserId: number) {
  const otherParticipantId = chat.participants.find((p: number) => p !== currentUserId);

  const [job, otherUser] = await Promise.all([
    storage.getJobById(chat.jobId),
    otherParticipantId ? storage.getUserById(otherParticipantId) : Promise.resolve(null)
  ]);

  return {
    ...chat,
    job: job ? {
      id: job.id,
      cargoType: job.cargoType,
      pickupAddress: job.pickupAddress,
      deliveryAddress: job.deliveryAddress,
      pickupCountry: job.pickupCountry,
      deliveryCountry: job.deliveryCountry,
      status: job.status,
      pickupDate: job.pickupDate,
      deliveryDeadline: job.deliveryDeadline,
    } : null,
    otherParticipant: otherUser ? {
      id: otherUser.id,
      name: otherUser.contactPersonName,
      companyName: otherUser.companyName,
      email: otherUser.email,
      phoneNumber: otherUser.phoneNumber,
      role: otherUser.role,
    } : null
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WebSocketService(httpServer);

  // Serve uploaded files
  app.use('/uploads', authenticateToken, (req, res, next) => {
    // Add access control logic here if needed
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.url);
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  });

  // ==================== AUTHENTICATION ROUTES ====================

  // Register Trucking Company
  app.post('/api/auth/register/trucking', async (req, res) => {
    try {
      const validatedData = registerTruckingSchema.parse(req.body);

      // Check if phone number already registered
      const existingByPhone = await storage.getUserByPhoneNumber(validatedData.phoneNumber);
      if (existingByPhone) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }

      // Check if email already registered (only if one was provided)
      if (validatedData.email) {
        const existingByEmail = await storage.getUserByEmail(validatedData.email);
        if (existingByEmail) {
          return res.status(409).json({ message: 'Email already registered' });
        }
      }

      // Create user. Only generate a verification token if an email was provided --
      // phone-only accounts have no verification step for now and can log in right away.
      const user = await storage.createUser({
        ...validatedData,
        role: UserRole.TRUCKING_COMPANY,
        emailVerificationToken: validatedData.email ? crypto.randomBytes(32).toString('hex') : undefined,
        subscriptionStatus: 'trial'
      } as any);

      if (user.email && user.emailVerificationToken) {
        const emailSent = await emailService.sendVerificationEmail(
          user.email,
          user.emailVerificationToken
        );

        if (!emailSent) {
          console.warn('Failed to send verification email to:', user.email);
        }
      }

      res.status(201).json({
        message: user.email
          ? 'Registration successful. Please check your email for verification.'
          : 'Registration successful. You can now log in with your phone number.'
      });
    } catch (error: any) {
      console.error('Trucking registration error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  // Register Shipping Entity
  app.post('/api/auth/register/shipping', async (req, res) => {
    try {
      const validatedData = registerShippingSchema.parse(req.body);

      // Check if phone number already registered
      const existingByPhone = await storage.getUserByPhoneNumber(validatedData.phoneNumber);
      if (existingByPhone) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }

      // Check if email already registered (only if one was provided)
      if (validatedData.email) {
        const existingByEmail = await storage.getUserByEmail(validatedData.email);
        if (existingByEmail) {
          return res.status(409).json({ message: 'Email already registered' });
        }
      }

      // Create user. Only generate a verification token if an email was provided --
      // phone-only accounts have no verification step for now and can log in right away.
      const user = await storage.createUser({
        ...validatedData,
        role: UserRole.SHIPPING_ENTITY,
        emailVerificationToken: validatedData.email ? crypto.randomBytes(32).toString('hex') : undefined,
        subscriptionStatus: 'active' // Shipping entities get free access
      } as any);

      if (user.email && user.emailVerificationToken) {
        const emailSent = await emailService.sendVerificationEmail(
          user.email,
          user.emailVerificationToken
        );

        if (!emailSent) {
          console.warn('Failed to send verification email to:', user.email);
        }
      }

      res.status(201).json({
        message: user.email
          ? 'Registration successful. Please check your email for verification.'
          : 'Registration successful. You can now log in with your phone number.'
      });
    } catch (error: any) {
      console.error('Shipping registration error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  // Email Verification
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Invalid verification token' });
      }

      // Find user with this token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      if (user.emailVerified) {
        return res.status(200).json({ 
          message: 'Email already verified',
          alreadyVerified: true
        });
      }

      // Verify the email
      await storage.verifyUserEmail(user.id);

      res.status(200).json({ 
        message: 'Email verified successfully! You can now log in.',
        verified: true
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  });

  // Login with 2FA
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, email, password, twoFactorCode } = req.body;

      // Validate input. Accept the legacy `email` field too, for any older frontend build still sending it.
      const validatedData = loginSchema.parse({ identifier: identifier || email, password });

      // Find user by email or phone number
      const user = await storage.getUserByEmailOrPhone(validatedData.identifier);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.accountLocked && user.lockExpires) {
        if (new Date() < user.lockExpires) {
          const minutesLeft = Math.ceil((user.lockExpires.getTime() - Date.now()) / 60000);
          return res.status(423).json({ 
            message: `Account locked. Try again in ${minutesLeft} minutes.`,
            locked: true
          });
        } else {
          // Unlock account if lock period has expired
          await storage.unlockAccount(user.id);
        }
      }

      // Check password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      
      if (!isValidPassword) {
        // Increment login attempts
        const attempts = await storage.incrementLoginAttempts(user.id);
        
        // Lock account after 5 failed attempts
        if (attempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await storage.lockAccount(user.id, lockUntil);
          return res.status(423).json({ 
            message: 'Account locked due to too many failed login attempts. Try again in 30 minutes.',
            locked: true
          });
        }
        
        return res.status(401).json({ 
          message: `Invalid credentials. ${5 - attempts} attempts remaining.`
        });
      }

      // Check if email is verified -- only applies to users who registered with an email.
      // Phone-only accounts have no verification step and skip this check entirely.
      if (user.email && !user.emailVerified) {
        return res.status(401).json({
          message: 'Please verify your email before logging in.',
          emailNotVerified: true
        });
      }

      // Reset login attempts on successful password verification
      await storage.resetLoginAttempts(user.id);

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // If 2FA code not provided, send code and require it
        if (!twoFactorCode) {
          const code = generate2FACode();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          
          await storage.set2FACode(user.id, code, expiresAt);
          await emailService.send2FACode(user.email, code);
          
          return res.status(200).json({
            requires2FA: true,
            message: 'A 2FA code has been sent to your email'
          });
        }

        // Verify 2FA code
        const isValidCode = await storage.verify2FACode(user.id, twoFactorCode);
        
        if (!isValidCode) {
          return res.status(401).json({ message: 'Invalid or expired 2FA code' });
        }

        // Clear 2FA code after successful verification
        await storage.clear2FACode(user.id);
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          subscriptionStatus: user.subscriptionStatus,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ message: error.message || 'Login failed' });
    }
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({ 
          message: 'If an account exists with this email, you will receive a password reset link.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);
      
      // Send reset email
      const emailSent = await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      if (!emailSent) {
        console.error('Failed to send password reset email to:', user.email);
      }

      res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Find user with valid reset token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.resetPassword(user.id, hashedPassword);

      res.status(200).json({ 
        message: 'Password reset successfully. You can now log in with your new password.'
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // 2FA Management
  app.post('/api/auth/2fa/enable', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // Generate backup codes
      const backupCodes = generateBackupCodes();

      // Enable 2FA
      await storage.enable2FA(userId, backupCodes);

      res.status(200).json({
        message: '2FA enabled successfully',
        backupCodes,
        warning: 'Save these backup codes in a safe place. They can be used if you lose access to your email.'
      });
    } catch (error: any) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  });

  app.post('/api/auth/2fa/disable', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: 'Password is required to disable 2FA' });
      }

      // Verify password
      const user = await storage.getUserById(userId);
      const isValidPassword = await bcrypt.compare(password, user!.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Disable 2FA
      await storage.disable2FA(userId);

      res.status(200).json({ message: '2FA disabled successfully' });
    } catch (error: any) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });

  app.post('/api/auth/2fa/verify-backup', async (req, res) => {
    try {
      const { email, backupCode } = req.body;

      if (!email || !backupCode) {
        return res.status(400).json({ message: 'Email and backup code are required' });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify backup code
      const isValid = await storage.verifyBackupCode(user.id, backupCode.toUpperCase());

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid backup code' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful using backup code',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          subscriptionStatus: user.subscriptionStatus,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    } catch (error: any) {
      console.error('Backup code verification error:', error);
      res.status(500).json({ message: 'Failed to verify backup code' });
    }
  });

  // Resend Verification Email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return res.status(200).json({ 
          message: 'If an account exists with this email, a verification link has been sent.'
        });
      }

      if (user.emailVerified) {
        return res.status(200).json({ 
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      const newToken = crypto.randomBytes(32).toString('hex');
      await storage.updateVerificationToken(user.id, newToken);

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(user.email, newToken);

      if (!emailSent) {
        console.error('Failed to send verification email to:', user.email);
      }

      res.status(200).json({ 
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  });

  // Get Current User
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        companyName: req.user!.companyName,
        contactPersonName: req.user!.contactPersonName,
        subscriptionStatus: req.user!.subscriptionStatus,
        emailVerified: req.user!.emailVerified,
        twoFactorEnabled: req.user!.twoFactorEnabled
      }
    });
  });

  // Document upload route
  app.post('/api/auth/upload-documents', authenticateToken, upload.array('documents', 5), async (req: AuthRequest, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const documents = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        verified: false
      }));

      await storage.updateUser(req.user!.id, { documents });
      const updatedUser = await storage.getUserById(req.user!.id);

      res.json({ 
        message: 'Documents uploaded successfully',
        documents: updatedUser?.documents || []
      });
    } catch (error: any) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Document upload failed' });
    }
  });

  // ==================== JOB ROUTES ====================

  app.post('/api/jobs', authenticateToken, requireRole([UserRole.SHIPPING_ENTITY]), async (req: AuthRequest, res) => {
    try {
      const jobData = insertJobSchema.parse({
        ...req.body,
        shipperId: req.user!.id,
        pickupDate: new Date(req.body.pickupDate),
        deliveryDeadline: new Date(req.body.deliveryDeadline)
      });

      const job = await storage.createJob(jobData as any);

      // Notify relevant trucking companies
      wsService.sendJobUpdate(job.id, {
        type: 'new_job',
        job
      });

      res.status(201).json({ message: 'Job posted successfully', job });
    } catch (error: any) {
      console.error('Job creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to create job' });
    }
  });

  app.get('/api/jobs', authenticateToken, requireSubscription, async (req: AuthRequest, res) => {
    try {
      const { 
        status, 
        cargoType, 
        industry, 
        pickupCountry, 
        deliveryCountry,
        page = '1',
        limit = '20'
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (cargoType) filters.cargoType = cargoType;
      if (industry) filters.industry = industry;
      if (pickupCountry) filters.pickupCountry = pickupCountry;
      if (deliveryCountry) filters.deliveryCountry = deliveryCountry;

      // For trucking companies, only show available jobs
      if (req.user!.role === UserRole.TRUCKING_COMPANY) {
        filters.status = JobStatus.AVAILABLE;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const jobs = await storage.getJobs({ ...filters, limit: limitNum, offset: skip });

      res.json({ jobs });
    } catch (error: any) {
      console.error('Jobs fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  app.get('/api/jobs/my', authenticateToken, async (req: AuthRequest, res) => {
    try {
      let jobs;
      if (req.user!.role === UserRole.SHIPPING_ENTITY) {
        jobs = await storage.getJobsByShipper(req.user!.id);
      } else if (req.user!.role === UserRole.TRUCKING_COMPANY) {
        jobs = await storage.getJobsByCarrier(req.user!.id);
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ jobs });
    } catch (error: any) {
      console.error('My jobs fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch your jobs' });
    }
  });

  app.patch('/api/jobs/:id/take', authenticateToken, requireRole([UserRole.TRUCKING_COMPANY]), requireSubscription, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const job = await storage.takeJob(id, req.user!.id);

      if (!job) {
        return res.status(404).json({ message: 'Job not found or already taken' });
      }

      // Notify shipper
      wsService.sendNotificationToUser(job.shipperId, {
        type: 'job_taken',
        title: 'Job Taken',
        message: `Your job has been taken by ${req.user!.companyName}`,
        data: { jobId: job.id }
      });

      res.json({ message: 'Job taken successfully', job });
    } catch (error: any) {
      console.error('Job take error:', error);
      res.status(500).json({ message: 'Failed to take job' });
    }
  });

  app.patch('/api/jobs/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJobById(id);

      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check permissions
      if (req.user!.role === UserRole.SHIPPING_ENTITY && job.shipperId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to complete this job' });
      } else if (req.user!.role === UserRole.TRUCKING_COMPANY && job.carrierId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to complete this job' });
      }

      const completedJob = await storage.completeJob(id);

      // Notify relevant parties
      if (req.user!.role === UserRole.SHIPPING_ENTITY && completedJob?.carrierId) {
        wsService.sendNotificationToUser(completedJob.carrierId, {
          type: 'job_completed',
          title: 'Job Completed',
          message: `Job has been marked as completed by ${req.user!.companyName}`,
          data: { jobId: completedJob.id }
        });
      } else if (req.user!.role === UserRole.TRUCKING_COMPANY) {
        wsService.sendNotificationToUser(completedJob!.shipperId, {
          type: 'job_completed',
          title: 'Job Completed',
          message: `Job has been marked as completed by ${req.user!.companyName}`,
          data: { jobId: completedJob!.id }
        });
      }

      res.json({ message: 'Job completed successfully', job: completedJob });
    } catch (error: any) {
      console.error('Job complete error:', error);
      res.status(500).json({ message: 'Failed to complete job' });
    }
  });

  // ==================== CHAT ROUTES ====================

  app.get('/api/chats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const chats = await storage.getChatsByUser(req.user!.id);
      const enriched = await Promise.all(chats.map(chat => enrichChat(chat, req.user!.id)));
      res.json({ chats: enriched });
    } catch (error: any) {
      console.error('Chats fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch chats' });
    }
  });

  app.get('/api/chats/job/:jobId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { jobId } = req.params;
      let chat = await storage.getChatByJobId(parseInt(jobId));

      if (!chat) {
        // Get job to find participants
        const job = await storage.getJobById(parseInt(jobId));
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Only create chat if job has both shipper and carrier
        if (!job.carrierId) {
          return res.status(400).json({ 
            message: 'Chat cannot be created until a carrier is assigned to this job' 
          });
        }

        // Create chat if it doesn't exist
        const participants = [job.shipperId];
        if (job.carrierId) {
          participants.push(job.carrierId);
        }

        // Check if user is authorized
        if (!participants.includes(req.user!.id)) {
          return res.status(403).json({ message: 'Not authorized to access this chat' });
        }

        chat = await storage.createChat({
          jobId: parseInt(jobId),
          participants,
          messages: []
        } as any);
      }

      // Check if user is participant
      if (!chat.participants.includes(req.user!.id)) {
        return res.status(403).json({ message: 'Not authorized to access this chat' });
      }

      res.json({ chat: await enrichChat(chat, req.user!.id) });
    } catch (error: any) {
      console.error('Chat fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch chat' });
    }
  });

  app.get('/api/chats/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const chat = await storage.getChatById(parseInt(id));

      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      if (!chat.participants.includes(req.user!.id)) {
        return res.status(403).json({ message: 'Not authorized to access this chat' });
      }

      res.json({ chat: await enrichChat(chat, req.user!.id) });
    } catch (error: any) {
      console.error('Chat fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch chat' });
    }
  });

  app.patch('/api/chats/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markMessagesAsRead(id, req.user!.id);

      if (!success) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      res.json({ message: 'Messages marked as read' });
    } catch (error: any) {
      console.error('Mark read error:', error);
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  });

  app.post('/api/chats/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Get chat to verify access
      const chat = await storage.getChatById(parseInt(id));
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is a participant
      if (!chat.participants.includes(req.user!.id)) {
        return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
      }

      // Add message
      const updatedChat = await storage.addMessage(parseInt(id), req.user!.id, content.trim());

      if (!updatedChat) {
        return res.status(500).json({ message: 'Failed to add message' });
      }

      // Send WebSocket notification to other participants
      for (const participantId of chat.participants) {
        if (participantId !== req.user!.id) {
          wsService.sendNotificationToUser(participantId, {
            type: 'new_message',
            title: 'New Message',
            message: `New message from ${req.user!.contactPersonName}`,
            data: { chatId: id, senderId: req.user!.id }
          });
        }
      }

      res.json({ 
        message: 'Message sent successfully', 
        chat: updatedChat 
      });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // ==================== NOTIFICATION ROUTES ====================

  app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { limit = '50' } = req.query;
      const notifications = await storage.getNotificationsByUser(req.user!.id, parseInt(limit as string));
      res.json({ notifications });
    } catch (error: any) {
      console.error('Notifications fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id);

      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

// ==================== PAYMENT ROUTES (Stripe integration) ====================

  app.post('/api/payments/stripe/create-checkout-session', authenticateToken, requireRole([UserRole.TRUCKING_COMPANY]), async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      // @ts-ignore
      const session = await stripeService.createCheckoutSession(user.id, user.email, process.env.STRIPE_PRICE_ID);
      res.json({ sessionId: session.id });
    } catch (error: any) {
      console.error('Stripe checkout session error:', error);
      res.status(500).json({ message: 'Failed to create Stripe checkout session' });
    }
  });

  app.post('/api/payments/stripe/verify-session', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.body;
      // @ts-ignore
      const session = await stripeService.retrieveCheckoutSession(sessionId);

      if (session.payment_status === 'paid') {
        // @ts-ignore
        const subscription = await stripeService.getSubscription(session.subscription);
        
        await storage.updateUser(req.user!.id, { 
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripeSubscriptionStatus: subscription.status,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
        });

        res.json({ message: 'Subscription verified successfully' });
      } else {
        res.status(400).json({ message: 'Subscription payment not successful' });
      }
    } catch (error: any) {
      console.error('Stripe verify session error:', error);
      res.status(500).json({ message: 'Failed to verify Stripe session' });
    }
  });

  app.post('/api/payments/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // @ts-ignore
      event = stripeService.constructWebhookEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Stripe webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created.
        // You should handle the logic to provision access to your service.
        break;
      case 'invoice.paid':
        // Continue to provision the subscription as payments continue to be made.
        break;
      case 'invoice.payment_failed':
        // The payment failed or the customer does not have a valid payment method.
        // The subscription becomes past_due. Notify the customer and send them to the
        // customer portal to update their payment information.
        break;
      default:
        console.log(`Unhandled Stripe webhook event type ${event.type}`);
    }

    res.status(200).send();
  });

// ==================== ADMIN ROUTES ====================

  app.get('/api/admin/dashboard', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const stats = {
        totalUsers: await storage.getUserCount(),
        truckingCompanies: await storage.getUserCount(UserRole.TRUCKING_COMPANY),
        shippingEntities: await storage.getUserCount(UserRole.SHIPPING_ENTITY),
        totalJobs: await storage.getJobCount(),
        activeJobs: await storage.getJobCount(JobStatus.AVAILABLE),
        completedJobs: await storage.getJobCount(JobStatus.COMPLETED),
      };

      res.json({ stats });
    } catch (error: any) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const { role, verified, hasDocuments, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const users = await storage.getAllUsers({
        role: role as string,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        hasDocuments: hasDocuments === 'true' ? true : hasDocuments === 'false' ? false : undefined,
        limit: Number(limit),
        offset: offset
      });

      res.json({ users });
    } catch (error: any) {
      console.error('Admin users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/users/pending-documents', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsersWithPendingDocuments();
      res.json({ users });
    } catch (error: any) {
      console.error('Admin pending documents error:', error);
      res.status(500).json({ message: 'Failed to fetch users with pending documents' });
    }
  });

  app.post('/api/admin/users/:userId/verify-documents', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { approved, notes } = req.body;

      await storage.verifyUserDocuments(Number(userId), req.user!.id, approved, notes);
      
      res.json({ 
        message: approved ? 'Documents approved successfully' : 'Documents rejected',
        approved 
      });
    } catch (error: any) {
      console.error('Admin verify documents error:', error);
      res.status(500).json({ message: 'Failed to process document verification' });
    }
  });

  // Admin dispute management routes
  app.get('/api/admin/disputes', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const { status, adminId, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const disputes = await storage.getDisputes({
        status: status as string,
        adminId: adminId ? Number(adminId) : undefined,
        limit: Number(limit),
        offset: offset
      });

      res.json({ disputes });
    } catch (error: any) {
      console.error('Admin disputes error:', error);
      res.status(500).json({ message: 'Failed to fetch disputes' });
    }
  });

  app.post('/api/admin/disputes/:disputeId/assign', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const { disputeId } = req.params;

      await storage.assignDisputeToAdmin(Number(disputeId), req.user!.id);
      
      res.json({ message: 'Dispute assigned successfully' });
    } catch (error: any) {
      console.error('Admin assign dispute error:', error);
      res.status(500).json({ message: 'Failed to assign dispute' });
    }
  });

  app.post('/api/admin/disputes/:disputeId/resolve', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.CUSTOMER_SUPPORT]), async (req: AuthRequest, res) => {
    try {
      const { disputeId } = req.params;
      const { resolution } = req.body;

      await storage.resolveDispute(Number(disputeId), resolution, req.user!.id);
      
      res.json({ message: 'Dispute resolved successfully' });
    } catch (error: any) {
      console.error('Admin resolve dispute error:', error);
      res.status(500).json({ message: 'Failed to resolve dispute' });
    }
  });


// Add to routes.ts
app.get('/api/debug/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email as string || 'leatilemanando@gmail.com';
    
    // Test verification email
    const verificationSent = await emailService.sendVerificationEmail(testEmail, 'test-verification-token');
    
    // Test 2FA email
    const twoFactorSent = await emailService.send2FACode(testEmail, '123456');
    
    res.json({
      success: verificationSent && twoFactorSent,
      verificationEmail: verificationSent ? 'Sent' : 'Failed',
      twoFactorEmail: twoFactorSent ? 'Sent' : 'Failed',
      message: verificationSent && twoFactorSent 
        ? 'Test emails sent successfully' 
        : 'Some emails failed to send',
      testEmail: testEmail
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});


  
  // User dispute creation route
  app.post('/api/disputes', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { jobId, reportedUserId, title, description, evidence } = req.body;

      const dispute = await storage.createDispute({
        jobId,
        reporterId: req.user!.id,
        reportedUserId,
        title,
        description,
        evidence: evidence || []
      } as any);

      res.status(201).json({ dispute });
    } catch (error: any) {
      console.error('Create dispute error:', error);
      res.status(500).json({ message: 'Failed to create dispute' });
    }
  });

  return httpServer;
}
