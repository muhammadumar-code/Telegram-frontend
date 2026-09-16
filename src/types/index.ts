export type DesignType = 'crystal-glass' | 'dark-3d' | 'aurora-glass';

export type LanguageCode = 'uz' | 'en' | 'ru' | 'de' | 'tr' | 'ko' | 'ja' | 'fr' | 'es';

export interface Country {
  name: string;
  nativeName: string;
  code: string;
  dialCode: string;
  language: LanguageCode;
  phoneDigits: number;
  format: string;
}

export interface User {
  _id: string;
  phone: string;
  country: string;
  countryCode: string;
  dialCode: string;
  language: LanguageCode;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  selectedDesign: DesignType;
  isVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  isOnline: boolean;
  lastSeen: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
  lastLogin?: string | Date;
}

export type AuthStep =
  | 'qr'
  | 'phone'
  | 'phone-code'
  | 'email'
  | 'email-code'
  | 'design'
  | 'success';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatSummary {
  id: string;
  name: string;
  avatar: string;
  isOfficial?: boolean;
  isSaved?: boolean;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
}
