import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../db.ts';
import {
  createOtpSession,
  verifyOtp,
  getOtpSession,
  invalidateOtpSession
} from '../services/otp.js';
import { smsService } from '../services/sms.js';
import { emailService } from '../services/email.js';
import type { Server as SocketIOServer } from 'socket.io';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'telegram_pro_jwt_secret_2025_secure_key';

let ioInstance: SocketIOServer | null = null;
export function setIoInstance(io: SocketIOServer) {
  ioInstance = io;
}

// Temporary storage for verified phone sessions before email completion
const verifiedPhoneSessions = new Map<string, {
  phone: string;
  country: string;
  countryCode: string;
  dialCode: string;
  language: string;
  verifiedAt: number;
}>();

// Helper to extract authenticated user
export async function authenticateToken(req: express.Request): Promise<string | null> {
  const token = req.cookies?.telegram_pro_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// 1. Request Phone SMS Code
router.post('/request-phone-code', async (req, res) => {
  try {
    const { phone, country, countryCode, dialCode, language } = req.body;
    console.log('[Auth] /request-phone-code received:', { phone, country, countryCode, dialCode, language });

    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      console.warn('[Auth] Invalid phone number rejected:', phone);
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format.'
      });
    }

    const cleanPhone = phone.trim();
    const otpResult = createOtpSession(cleanPhone, 'phone');
    console.log('[Auth] OTP session created for phone:', cleanPhone, 'devCode:', otpResult.devCode);

    // Send SMS via provider
    const smsResult = await smsService.sendVerificationCode(cleanPhone, otpResult.devCode || '');
    console.log('[Auth] SMS dispatch result:', smsResult);

    if (ioInstance) {
      ioInstance.emit('verification:sent', {
        type: 'phone',
        target: cleanPhone.replace(/\d(?=\d{3})/g, '*'),
        timestamp: Date.now()
      });
    }

    // Return session data. Codes are dispatched to SMS / Terminal only.
    res.json({
      success: true,
      sessionId: otpResult.sessionId,
      devCode: otpResult.devCode,
      attemptsRemaining: otpResult.attemptsRemaining,
      cooldownSeconds: otpResult.cooldownSeconds,
      expiresInSeconds: otpResult.expiresInSeconds
    });
  } catch (err) {
    console.error('request-phone-code error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while dispatching SMS code.' });
  }
});

// 2. Verify Phone SMS Code
router.post('/verify-phone-code', async (req, res) => {
  try {
    const { sessionId, code, phone, country, countryCode, dialCode, language } = req.body;

    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and verification code are required.'
      });
    }

    const verifyResult = verifyOtp(sessionId, code);

    if (!verifyResult.success) {
      if (ioInstance) {
        ioInstance.emit('verification:failed', {
          sessionId,
          type: 'phone',
          attemptsRemaining: verifyResult.attemptsRemaining
        });
      }
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining,
        locked: verifyResult.locked,
        expired: verifyResult.expired
      });
    }

    // Save phone verification record
    const otpSession = getOtpSession(sessionId);
    const targetPhone = otpSession?.target || phone || '';

    verifiedPhoneSessions.set(sessionId, {
      phone: targetPhone,
      country: country || 'Uzbekistan',
      countryCode: countryCode || 'UZ',
      dialCode: dialCode || '+998',
      language: language || 'uz',
      verifiedAt: Date.now()
    });

    res.json({
      success: true,
      message: 'Phone number verified successfully.',
      phoneSessionId: sessionId
    });
  } catch (err) {
    console.error('verify-phone-code error:', err);
    res.status(500).json({ success: false, message: 'Internal verification failure.' });
  }
});

// 3. Request Email Code
router.post('/request-email-code', async (req, res) => {
  try {
    const { email, phoneSessionId } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!phoneSessionId || !verifiedPhoneSessions.has(phoneSessionId)) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification is required prior to email verification.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpResult = createOtpSession(cleanEmail, 'email');

    // Send email code via Nodemailer / SMTP
    await emailService.sendVerificationCode(cleanEmail, otpResult.devCode || '');

    if (ioInstance) {
      ioInstance.emit('verification:sent', {
        type: 'email',
        target: cleanEmail.replace(/(.{2})(.*)(?=@)/, (_m, g1, g2) => g1 + '*'.repeat(g2.length)),
        timestamp: Date.now()
      });
    }

    res.json({
      success: true,
      emailSessionId: otpResult.sessionId,
      devCode: otpResult.devCode,
      attemptsRemaining: otpResult.attemptsRemaining,
      cooldownSeconds: otpResult.cooldownSeconds,
      expiresInSeconds: otpResult.expiresInSeconds
    });
  } catch (err) {
    console.error('request-email-code error:', err);
    res.status(500).json({ success: false, message: 'Internal server error dispatching email code.' });
  }
});

// 4. Verify Email Code & Finalize Account Creation
router.post('/verify-email-code', async (req, res) => {
  try {
    const {
      emailSessionId,
      code,
      phoneSessionId,
      selectedDesign,
      firstName,
      lastName,
      username
    } = req.body;

    if (!emailSessionId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email session ID and verification code are required.'
      });
    }

    const phoneData = phoneSessionId ? verifiedPhoneSessions.get(phoneSessionId) : null;
    if (!phoneData) {
      return res.status(403).json({
        success: false,
        message: 'Phone session invalid or expired. Please restart registration.'
      });
    }

    const verifyResult = verifyOtp(emailSessionId, code);

    if (!verifyResult.success) {
      if (ioInstance) {
        ioInstance.emit('verification:failed', {
          sessionId: emailSessionId,
          type: 'email',
          attemptsRemaining: verifyResult.attemptsRemaining
        });
      }
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining,
        locked: verifyResult.locked,
        expired: verifyResult.expired
      });
    }

    const emailSession = getOtpSession(emailSessionId);
    const targetEmail = emailSession?.target || '';

    // Check if user with this phone or email already exists
    let user = await User.findOne({ phone: phoneData.phone });

    if (!user) {
      user = await User.findOne({ email: targetEmail });
    }

    const design = (selectedDesign === 'dark-3d' || selectedDesign === 'aurora-glass')
      ? selectedDesign
      : 'crystal-glass';

    if (user) {
      // Update existing user with verified credentials
      user = await User.findByIdAndUpdate(user._id, {
        phone: phoneData.phone,
        country: phoneData.country,
        countryCode: phoneData.countryCode,
        dialCode: phoneData.dialCode,
        language: phoneData.language,
        email: targetEmail,
        selectedDesign: design,
        isVerified: true,
        phoneVerified: true,
        emailVerified: true,
        isOnline: true,
        lastLogin: new Date()
      }, { new: true });
    } else {
      // Create new user in database
      const generatedUsername = username || `pro_${Math.floor(100000 + Math.random() * 900000)}`;
      user = await User.create({
        phone: phoneData.phone,
        country: phoneData.country,
        countryCode: phoneData.countryCode,
        dialCode: phoneData.dialCode,
        language: phoneData.language,
        email: targetEmail,
        firstName: firstName || 'Telegram',
        lastName: lastName || 'Pro',
        username: generatedUsername,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${generatedUsername}`,
        selectedDesign: design,
        isVerified: true,
        phoneVerified: true,
        emailVerified: true,
        isOnline: true
      });
    }

    if (!user) {
      return res.status(500).json({ success: false, message: 'Could not initialize user profile.' });
    }

    // Clean up temporary sessions
    invalidateOtpSession(emailSessionId);
    if (phoneSessionId) {
      invalidateOtpSession(phoneSessionId);
      verifiedPhoneSessions.delete(phoneSessionId);
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    res.cookie('telegram_pro_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    if (ioInstance) {
      ioInstance.emit('session:created', {
        userId: user._id,
        username: user.username,
        timestamp: Date.now()
      });
      ioInstance.emit('auth:verified', {
        userId: user._id,
        phone: user.phone
      });
      ioInstance.emit('user:online', {
        userId: user._id,
        username: user.username
      });
    }

    res.json({
      success: true,
      message: 'Account verified and session established.',
      user,
      token
    });
  } catch (err) {
    console.error('verify-email-code error:', err);
    res.status(500).json({ success: false, message: 'Internal error creating account.' });
  }
});

// 5. Get Current Active Session
router.get('/session', async (req, res) => {
  try {
    const userId = await authenticateToken(req);
    if (!userId) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    const user = await User.findById(userId);
    if (!user) {
      res.clearCookie('telegram_pro_token');
      return res.status(401).json({ authenticated: false, user: null });
    }

    await User.setOnline(user._id, true);

    res.json({
      authenticated: true,
      user
    });
  } catch (err) {
    res.status(500).json({ authenticated: false, error: 'Session verification failure.' });
  }
});

// 6. Logout
router.post('/logout', async (req, res) => {
  try {
    const userId = await authenticateToken(req);
    if (userId) {
      await User.setOnline(userId, false);
      if (ioInstance) {
        ioInstance.emit('session:logout', { userId });
        ioInstance.emit('user:offline', { userId });
      }
    }

    res.clearCookie('telegram_pro_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout error.' });
  }
});

// 7. Get Current User Profile
router.get('/user/me', async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({ success: true, user });
});

// 8. Update Profile Info
router.put('/user/profile', async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { firstName, lastName, username, avatar } = req.body;
  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (username !== undefined) updateData.username = username.trim();
  if (avatar !== undefined) updateData.avatar = avatar;

  const updated = await User.findByIdAndUpdate(userId, updateData, { new: true });
  res.json({ success: true, user: updated });
});

// 9. Update Design Choice
router.put('/user/design', async (req, res) => {
  const userId = await authenticateToken(req);
  const { selectedDesign } = req.body;

  if (!['crystal-glass', 'dark-3d', 'aurora-glass'].includes(selectedDesign)) {
    return res.status(400).json({ success: false, message: 'Invalid design option.' });
  }

  if (userId) {
    const updated = await User.findByIdAndUpdate(userId, { selectedDesign }, { new: true });
    return res.json({ success: true, user: updated });
  }

  res.json({ success: true, selectedDesign });
});

export default router;
