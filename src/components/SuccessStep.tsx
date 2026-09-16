import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from './Logo.tsx';
import type { LanguageCode, User } from '../types/index.ts';
import { TRANSLATIONS } from '../i18n/translations.js';

interface SuccessStepProps {
  user: User;
  onContinueToApp: () => void;
  language: LanguageCode;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  user,
  onContinueToApp,
  language
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="success-wrap"
    >
      <div className="success-logo">
        <div className="success-glow" />
        <Logo size="hero" animate={true} />
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="success-tag">
          <CheckCircle2 size={14} />
          <span>Security Verified</span>
        </div>

        <h1 className="success-title">{t.welcomeTitle}</h1>
        <p className="success-subtitle">{t.welcomeSubtitle}</p>

        <div className="success-pill">
          <div className="avatar-badge">
            {user.firstName?.charAt(0) || user.username?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="success-pill__name">{user.firstName} {user.lastName}</div>
            <div className="success-pill__handle">@{user.username} • {user.phone}</div>
          </div>
        </div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onContinueToApp}
        className="btn btn-primary success-cta"
      >
        <span>{t.enterAppBtn}</span>
        <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );
};
