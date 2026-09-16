import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Search,
  LogOut,
  Download,
  Layers,
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCheck,
  X,
  User as UserIcon,
  Server
} from 'lucide-react';
import { Logo } from './Logo.tsx';
import type { User, DesignType, LanguageCode, ChatSummary, ChatMessage } from '../types/index.ts';
import { TRANSLATIONS } from '../i18n/translations.js';

interface HomePageProps {
  user: User;
  activeDesign: DesignType;
  onDesignChange: (design: DesignType) => Promise<void>;
  onLogout: () => Promise<void>;
  socketConnected: boolean;
  socketReconnecting: boolean;
  language: LanguageCode;
  onUpdateProfile: (updated: Partial<User>) => Promise<void>;
}

export const HomePage: React.FC<HomePageProps> = ({
  user,
  activeDesign,
  onDesignChange,
  onLogout,
  socketConnected,
  socketReconnecting,
  language,
  onUpdateProfile
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [chats, setChats] = useState<ChatSummary[]>([
    {
      id: 'chat_team',
      name: 'Telegram Pro Official',
      avatar: '/logo.svg',
      isOfficial: true,
      lastMessage: 'Welcome to Telegram Pro! Real-time messaging active.',
      lastMessageTime: Date.now() - 3600000,
      unreadCount: 0,
      isOnline: true
    },
    {
      id: 'chat_saved',
      name: t.savedMessages,
      avatar: '',
      isSaved: true,
      lastMessage: 'Encrypted cloud notes and bookmarks',
      lastMessageTime: Date.now() - 3600000 * 4,
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 'chat_security',
      name: 'Security Notifications',
      avatar: '/favicon.svg',
      isOfficial: true,
      lastMessage: 'Hardware-grade authorization established',
      lastMessageTime: Date.now() - 600000,
      unreadCount: 1,
      isOnline: true
    }
  ]);

  const [activeChatId, setActiveChatId] = useState<string>('chat_team');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [editFirstName, setEditFirstName] = useState(user.firstName || '');
  const [editLastName, setEditLastName] = useState(user.lastName || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`/api/chats/${activeChatId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.warn('Could not load chat messages:', err));
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const optimisticMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      chatId: activeChatId,
      senderId: user._id,
      senderName: `${user.firstName} ${user.lastName}`.trim() || user.username,
      senderAvatar: user.avatar,
      text: textToSend,
      timestamp: Date.now(),
      status: 'sent'
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          senderName: optimisticMsg.senderName,
          senderAvatar: optimisticMsg.senderAvatar
        })
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        username: editUsername
      });
      setIsProfileModalOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    window.location.href = '/api/download-zip';
    setTimeout(() => setIsDownloadingZip(false), 2000);
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusClass = socketConnected
    ? 'status-pill--connected'
    : socketReconnecting
    ? 'status-pill--reconnecting'
    : 'status-pill--offline';

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header__brand">
          <Logo size="sm" animate={false} />
          <div>
            <div className="home-header__titles">
              <span className="home-header__name">Telegram Pro</span>
              <span className="home-header__pro">PRO</span>
            </div>
            <div className="home-header__sub">
              <Shield size={12} />
              <span>E2EE Active</span>
            </div>
          </div>
        </div>

        <div className="home-header__actions">
          <div className={`status-pill ${statusClass}`}>
            {socketConnected ? (
              <>
                <span className="status-dot" />
                <span>{t.connected}</span>
              </>
            ) : socketReconnecting ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>{t.reconnecting}</span>
              </>
            ) : (
              <>
                <WifiOff size={12} />
                <span>{t.offline}</span>
              </>
            )}
          </div>

          <button type="button" onClick={handleDownloadZip} title="Download telegram-pro.zip" className="icon-btn">
            <Download size={14} className={isDownloadingZip ? 'animate-float' : ''} />
            <span>ZIP</span>
          </button>

          <div className="theme-menu-wrap">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="icon-btn icon-btn--square"
              title="Change Theme Experience"
            >
              <Layers size={16} />
            </button>

            <AnimatePresence>
              {isThemeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="theme-menu"
                >
                  <div className="theme-menu__label">{t.theme}</div>
                  {[
                    { id: 'crystal-glass' as const, label: 'Crystal Glass', desc: 'White/Blue Minimal' },
                    { id: 'dark-3d' as const, label: 'Dark 3D', desc: 'Obsidian & Blue Glow' },
                    { id: 'aurora-glass' as const, label: 'Aurora Glass', desc: 'Violet & Cyan Light' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onDesignChange(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`theme-menu__item ${activeDesign === theme.id ? 'theme-menu__item--active' : ''}`}
                    >
                      <div>
                        <div>{theme.label}</div>
                        <div className="theme-menu__item-desc">{theme.desc}</div>
                      </div>
                      {activeDesign === theme.id && <span className="theme-menu__dot" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="button" onClick={() => setIsProfileModalOpen(true)} className="profile-trigger">
            <div className="avatar-badge" style={{ width: 28, height: 28, fontSize: 12 }}>
              {user.firstName?.charAt(0) || user.username?.charAt(0) || 'P'}
            </div>
            <span className="profile-trigger__name">{user.firstName || user.username}</span>
          </button>

          <button type="button" onClick={onLogout} title={t.logout} className="icon-btn icon-btn--danger icon-btn--square">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="home-body">
        <aside className="home-sidebar">
          <div className="home-sidebar__search">
            <div className="search-shell">
              <Search size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchChats}
              />
            </div>
          </div>

          <div className="chat-list custom-scrollbar">
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className={`chat-item ${isActive ? 'chat-item--active' : ''}`}
                >
                  <div className="chat-avatar">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={chat.name} />
                    ) : (
                      <div className="chat-avatar__fallback">{chat.name.charAt(0)}</div>
                    )}
                    {chat.isOnline && <span className="chat-avatar__dot" />}
                  </div>

                  <div className="chat-item__body">
                    <div className="chat-item__top">
                      <span className="chat-item__name">{chat.name}</span>
                      <span className="chat-item__time">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="chat-item__preview">{chat.lastMessage}</p>
                  </div>

                  {chat.unreadCount > 0 && <span className="chat-item__unread">{chat.unreadCount}</span>}
                </button>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-footer__stack">
              <Server size={13} />
              <span>MongoDB • Express • JWT</span>
            </div>
            <span className="sidebar-footer__tag">REST + WS</span>
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-header">
            <div className="chat-header__who">
              <div className="chat-header__avatar">
                {activeChat.avatar ? (
                  <img src={activeChat.avatar} alt={activeChat.name} />
                ) : (
                  <div className="chat-header__avatar-fallback">{activeChat.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="chat-header__name">{activeChat.name}</h3>
                <div className="chat-header__status">
                  <span className="status-dot" style={{ color: 'var(--success)' }} />
                  <span>{activeChat.isOnline ? t.online : t.offline}</span>
                </div>
              </div>
            </div>

            <span className="chat-header__badge">{t.securityAlert}</span>
          </div>

          <div className="messages-feed custom-scrollbar">
            {messages.map((msg) => {
              const isMine = msg.senderId === user._id;
              return (
                <div key={msg.id} className={`msg-row ${isMine ? 'msg-row--mine' : ''}`}>
                  {!isMine && (
                    <div className="msg-avatar">
                      {msg.senderAvatar ? <img src={msg.senderAvatar} alt="" /> : msg.senderName.charAt(0)}
                    </div>
                  )}

                  <div className={`msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`}>
                    {!isMine && <div className="msg-bubble__sender">{msg.senderName}</div>}
                    <p className="msg-bubble__text">{msg.text}</p>
                    <div className="msg-bubble__meta">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && <CheckCheck size={13} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="composer">
            <form onSubmit={handleSendMessage}>
              <div className="composer-shell">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.typeMessage}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputText.trim()}
                className="composer-send"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-card"
            >
              <div className="modal-header">
                <h3 className="modal-header__title">
                  <UserIcon size={18} />
                  <span>{t.profile}</span>
                </h3>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="modal-avatar-row">
                  <div className="modal-avatar">{editFirstName.charAt(0) || user.username.charAt(0) || 'P'}</div>
                </div>

                <div className="modal-field">
                  <label className="modal-field__label">First Name</label>
                  <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                </div>

                <div className="modal-field">
                  <label className="modal-field__label">Last Name</label>
                  <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                </div>

                <div className="modal-field">
                  <label className="modal-field__label">Username</label>
                  <div className="modal-field--username">
                    <span>@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    />
                  </div>
                </div>

                <div className="modal-summary">
                  <div><strong>Phone:</strong> {user.phone}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Region:</strong> {user.country} ({user.dialCode})</div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="modal-btn modal-btn--cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSavingProfile} className="modal-btn modal-btn--save">
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
