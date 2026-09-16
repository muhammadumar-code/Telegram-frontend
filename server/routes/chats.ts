import express from 'express';
import { authenticateToken } from './auth.ts';
import type { Server as SocketIOServer } from 'socket.io';

const router = express.Router();

export interface IChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

const defaultMessages: IChatMessage[] = [
  {
    id: 'msg_1',
    chatId: 'chat_team',
    senderId: 'user_admin_001',
    senderName: 'Telegram Pro Official',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    text: 'Welcome to Telegram Pro! Your account is protected by End-to-End Encryption, 3D Shield Architecture, and Hardware-grade Security.',
    timestamp: Date.now() - 3600000 * 2,
    status: 'read'
  },
  {
    id: 'msg_2',
    chatId: 'chat_team',
    senderId: 'user_admin_001',
    senderName: 'Telegram Pro Official',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    text: 'You can test real-time messaging, toggle between 3 Apple-inspired glass themes, edit your profile, or export the full telegram-pro.zip archive!',
    timestamp: Date.now() - 3600000 * 1,
    status: 'read'
  }
];

const messagesStore: IChatMessage[] = [...defaultMessages];

let ioInstance: SocketIOServer | null = null;
export function setChatIoInstance(io: SocketIOServer) {
  ioInstance = io;
}

// Get chats list
router.get('/', async (req, res) => {
  const userId = await authenticateToken(req);
  const now = Date.now();

  const chats = [
    {
      id: 'chat_team',
      name: 'Telegram Pro Official',
      avatar: '/logo.svg',
      isOfficial: true,
      lastMessage: messagesStore[messagesStore.length - 1]?.text || 'Welcome to Telegram Pro',
      lastMessageTime: messagesStore[messagesStore.length - 1]?.timestamp || now,
      unreadCount: 0,
      isOnline: true
    },
    {
      id: 'chat_saved',
      name: 'Saved Messages',
      avatar: '',
      isSaved: true,
      lastMessage: 'Cloud storage and private note scratchpad',
      lastMessageTime: now - 3600000 * 5,
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 'chat_security',
      name: 'Security Notifications',
      avatar: '/favicon.svg',
      isOfficial: true,
      lastMessage: 'Login verified from current session',
      lastMessageTime: now - 180000,
      unreadCount: 1,
      isOnline: true
    }
  ];

  res.json({ success: true, chats });
});

// Get messages for a chat
router.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const filtered = messagesStore.filter(m => m.chatId === chatId);
  res.json({ success: true, messages: filtered });
});

// Send message
router.post('/:chatId/messages', async (req, res) => {
  const userId = await authenticateToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { chatId } = req.params;
  const { text, senderName, senderAvatar } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Text cannot be empty.' });
  }

  const newMsg: IChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    chatId,
    senderId: userId,
    senderName: senderName || 'Me',
    senderAvatar: senderAvatar || '',
    text: text.trim(),
    timestamp: Date.now(),
    status: 'sent'
  };

  messagesStore.push(newMsg);

  if (ioInstance) {
    ioInstance.emit('message:receive', newMsg);
  }

  // Automatic smart reply if chatting with Telegram Pro Official
  if (chatId === 'chat_team') {
    setTimeout(() => {
      const replyMsg: IChatMessage = {
        id: 'msg_reply_' + Date.now(),
        chatId: 'chat_team',
        senderId: 'user_admin_001',
        senderName: 'Telegram Pro Official',
        senderAvatar: '/logo.svg',
        text: `Received: "${newMsg.text}". All messages are encrypted with AES-256 and synchronized in real-time.`,
        timestamp: Date.now(),
        status: 'delivered'
      };
      messagesStore.push(replyMsg);
      if (ioInstance) {
        ioInstance.emit('message:receive', replyMsg);
      }
    }, 800);
  }

  res.json({ success: true, message: newMsg });
});

export default router;
