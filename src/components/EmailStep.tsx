import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Loader2, User as UserIcon, ShieldCheck } from 'lucide-react';
import type { LanguageCode } from '../types/index.ts';
import { TRANSLATIONS } from '../i18n/translations.js';

interface EmailStepProps {
  onSubmitEmail: (data: { email: string; firstName: string; username: string }) => Promise<void>;
  isLoading: boolean;
  language: LanguageCode;
  errorMessage?: string;
}

export const EmailStep: React.FC<EmailStepProps> = ({
  onSubmitEmail,
  isLoading,
  language,
  errorMessage
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [localError, setLocalError] = useState('');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError(t.invalidEmail);
      return;
    }

    setLocalError('');
    await onSubmitEmail({
      email: cleanEmail,
      firstName: firstName.trim() || 'Telegram User',
      username: username.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="step-head">
        <h2 className="step-head__title">{t.addYourEmail}</h2>
        <p className="step-head__subtitle">{t.emailSubtitle}</p>
      </div>

      <div className="field">
        <label className="field__label">Email Address</label>
        <div className="field-shell">
          <Mail size={18} className="field-shell__icon" />
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLocalError('');
            }}
            placeholder={t.emailPlaceholder}
          />
        </div>
      </div>

      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <label className="field__label">First Name</label>
          <div className="field-shell field-shell--compact">
            <UserIcon size={15} className="field-shell__icon" />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your Name"
            />
          </div>
        </div>

        <div>
          <label className="field__label">Username</label>
          <div className="field-shell field-shell--compact">
            <span style={{ color: 'var(--ink-40)', fontFamily: 'var(--font-mono)', marginRight: 2 }}>@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="username"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </div>

      {(localError || errorMessage) && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="field-error">
          <span className="field-error__dot" />
          <span>{localError || errorMessage}</span>
        </motion.div>
      )}

      <div className="field-hint">
        <ShieldCheck size={16} color="var(--success)" />
        <span>Hardware-backed cryptographic validation</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit"
        disabled={isLoading || !email}
        className="btn btn-primary"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Sending email code...</span>
          </>
        ) : (
          <>
            <span>{t.continueBtn}</span>
            <ArrowRight size={16} />
          </>
        )}
      </motion.button>
    </form>
  );
};
