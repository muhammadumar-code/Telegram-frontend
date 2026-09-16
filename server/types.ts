export interface IUser {
  _id: string;
  phone: string;
  country: string;
  countryCode: string;
  dialCode: string;
  language: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  selectedDesign: 'crystal-glass' | 'dark-3d' | 'aurora-glass';
  isVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

export interface IOtpSession {
  sessionId: string;
  target: string; // phone or email
  type: 'phone' | 'email';
  codeHash: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  lastSentAt: number;
  devCode?: string; // used for seamless dev testing/notification
}
