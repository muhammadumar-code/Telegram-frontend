import crypto from 'crypto';

const otpSessions = new Map();

export function hashOtp(code) {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

export function generateSixDigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createOtpSession(target, type) {
  const normalizedTarget = target.trim().toLowerCase();
  
  // Find and invalidate any existing active session for this target
  for (const [id, session] of otpSessions.entries()) {
    if (session.target === normalizedTarget && session.type === type) {
      otpSessions.delete(id);
    }
  }

  const rawCode = generateSixDigitOtp();
  const codeHash = hashOtp(rawCode);
  const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const ttlMs = 60 * 1000; // 1 minute (60 seconds)

  const session = {
    sessionId,
    target: normalizedTarget,
    type,
    codeHash,
    expiresAt: now + ttlMs,
    attempts: 0,
    maxAttempts: 3,
    verified: false,
    lastSentAt: now,
    devCode: rawCode
  };

  otpSessions.set(sessionId, session);

  return {
    sessionId,
    expiresInSeconds: 60,
    cooldownSeconds: 60,
    devCode: rawCode,
    attemptsRemaining: 3
  };
}

export function verifyOtp(sessionId, enteredCode) {
  const session = otpSessions.get(sessionId);
  if (!session) {
    return {
      success: false,
      message: 'Verification session expired or invalid. Please request a new code.',
      attemptsRemaining: 0,
      expired: true
    };
  }

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(sessionId);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
      attemptsRemaining: 0,
      expired: true
    };
  }

  if (session.attempts >= session.maxAttempts) {
    otpSessions.delete(sessionId);
    return {
      success: false,
      message: 'Too many attempts. Please request a new code.',
      attemptsRemaining: 0,
      locked: true
    };
  }

  const inputHash = hashOtp(enteredCode);
  if (inputHash === session.codeHash) {
    session.verified = true;
    return {
      success: true,
      message: 'Verification successful.',
      attemptsRemaining: session.maxAttempts - session.attempts
    };
  }

  // Increment failed attempts
  session.attempts += 1;
  const remaining = session.maxAttempts - session.attempts;

  if (remaining <= 0) {
    otpSessions.delete(sessionId);
    return {
      success: false,
      message: 'Too many attempts. Please request a new code.',
      attemptsRemaining: 0,
      locked: true
    };
  }

  return {
    success: false,
    message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    attemptsRemaining: remaining
  };
}

export function getOtpSession(sessionId) {
  const s = otpSessions.get(sessionId);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    otpSessions.delete(sessionId);
    return null;
  }
  return s;
}

export function invalidateOtpSession(sessionId) {
  otpSessions.delete(sessionId);
}
