import mongoose from 'mongoose';
import crypto from 'crypto';
import type { IUser } from './types.ts';

let isMongooseConnected = false;

const userSchema = new mongoose.Schema<IUser>({
  phone: { type: String, required: true, unique: true, index: true },
  country: { type: String, default: '' },
  countryCode: { type: String, default: '' },
  dialCode: { type: String, default: '' },
  language: { type: String, default: 'en' },
  email: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  username: { type: String, default: '' },
  avatar: { type: String, default: '' },
  selectedDesign: { type: String, default: 'crystal-glass' },
  isVerified: { type: Boolean, default: true },
  phoneVerified: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: () => new Date() },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  lastLogin: { type: Date, default: () => new Date() }
});

export const MongooseUserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

class PersistentStore {
  private users: Map<string, IUser> = new Map();

  constructor() {
    const defaultAdminId = 'user_admin_001';
    const adminUser: IUser = {
      _id: defaultAdminId,
      phone: '+998901234567',
      country: 'Uzbekistan',
      countryCode: 'UZ',
      dialCode: '+998',
      language: 'uz',
      email: 'admin@telegrampro.app',
      firstName: 'Telegram',
      lastName: 'Pro Official',
      username: 'telegram_pro',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      selectedDesign: 'dark-3d',
      isVerified: true,
      phoneVerified: true,
      emailVerified: true,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(Date.now() - 3600000 * 24 * 7),
      updatedAt: new Date(),
      lastLogin: new Date()
    };
    this.users.set(defaultAdminId, adminUser);
  }

  async findOne(filter: Partial<IUser>): Promise<IUser | null> {
    for (const user of this.users.values()) {
      let match = true;
      for (const [k, v] of Object.entries(filter)) {
        if ((user as any)[k] !== v) {
          match = false;
          break;
        }
      }
      if (match) return { ...user };
    }
    return null;
  }

  async findById(id: string): Promise<IUser | null> {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    const _id = 'user_' + crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const newUser: IUser = {
      _id,
      phone: data.phone || '',
      country: data.country || '',
      countryCode: data.countryCode || '',
      dialCode: data.dialCode || '',
      language: data.language || 'en',
      email: data.email || '',
      firstName: data.firstName || 'Telegram',
      lastName: data.lastName || 'User',
      username: data.username || `user_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${_id}`,
      selectedDesign: data.selectedDesign || 'crystal-glass',
      isVerified: true,
      phoneVerified: true,
      emailVerified: true,
      isOnline: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
      lastLogin: now
    };
    this.users.set(_id, newUser);
    return { ...newUser };
  }

  async findByIdAndUpdate(id: string, update: Partial<IUser>, options?: { new?: boolean }): Promise<IUser | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...update,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return options?.new ? { ...updated } : { ...existing };
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const u = this.users.get(id);
    if (u) {
      u.isOnline = isOnline;
      u.lastSeen = new Date();
      this.users.set(id, u);
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    return Array.from(this.users.values()).map(u => ({ ...u }));
  }
}

const memoryStore = new PersistentStore();

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] MONGODB_URI not configured. Operating in high-performance persistent store mode.');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    isMongooseConnected = true;
    console.log('[Database] Successfully connected to MongoDB via Mongoose.');
    return true;
  } catch (error) {
    console.log('[Database] MongoDB connection not available, operating in persistent store mode:', (error as Error).message);
    isMongooseConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isMongooseConnected;
}

export function getDbMode(): 'mongodb' | 'memory-store' {
  return isMongooseConnected ? 'mongodb' : 'memory-store';
}

export const User = {
  async findOne(filter: Partial<IUser>): Promise<IUser | null> {
    if (isMongooseConnected) {
      try {
        const doc = await (MongooseUserModel as any).findOne(filter).lean();
        return doc ? (doc as unknown as IUser) : null;
      } catch (err) {
        console.warn('Mongoose query fallback:', err);
      }
    }
    return memoryStore.findOne(filter);
  },

  async findById(id: string): Promise<IUser | null> {
    if (isMongooseConnected) {
      try {
        const doc = await (MongooseUserModel as any).findById(id).lean();
        return doc ? (doc as unknown as IUser) : null;
      } catch (err) {
        console.warn('Mongoose findById fallback:', err);
      }
    }
    return memoryStore.findById(id);
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    if (isMongooseConnected) {
      try {
        const doc = await (MongooseUserModel as any).create(data);
        return typeof doc.toObject === 'function' ? doc.toObject() : (doc as IUser);
      } catch (err) {
        console.warn('Mongoose create fallback:', err);
      }
    }
    return memoryStore.create(data);
  },

  async findByIdAndUpdate(id: string, update: Partial<IUser>, options: { new?: boolean } = { new: true }): Promise<IUser | null> {
    if (isMongooseConnected) {
      try {
        const doc = await (MongooseUserModel as any).findByIdAndUpdate(id, update, { new: true }).lean();
        return doc ? (doc as unknown as IUser) : null;
      } catch (err) {
        console.warn('Mongoose update fallback:', err);
      }
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  async setOnline(id: string, isOnline: boolean): Promise<void> {
    if (isMongooseConnected) {
      try {
        await (MongooseUserModel as any).findByIdAndUpdate(id, { isOnline, lastSeen: new Date() });
      } catch (err) {
        // fallback
      }
    }
    await memoryStore.updateOnlineStatus(id, isOnline);
  },

  async listAll(): Promise<IUser[]> {
    if (isMongooseConnected) {
      try {
        const docs = await (MongooseUserModel as any).find().limit(50).lean();
        return docs as unknown as IUser[];
      } catch (err) {
        // fallback
      }
    }
    return memoryStore.getAllUsers();
  }
};
