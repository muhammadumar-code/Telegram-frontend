import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCw, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { LanguageCode } from '../types/index.ts';
import { TRANSLATIONS } from '../i18n/translations.js';

interface OtpVerificationProps {
  type: 'phone' | 'email';
  target: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  attemptsRemaining: number;
  maxAttempts: number;
  initialCooldown?: number;
  errorMessage?: string;
  language: LanguageCode;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
  type,
  target,
  onVerify,
  onResend,
  onBack,
  isLoading,
  attemptsRemaining,
  maxAttempts,
  initialCooldown = 60,
  errorMessage,
  language
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [isResending, setIsResending] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isLocked = attemptsRemaining <= 0;
  const currentAttempt = Math.max(1, maxAttempts - attemptsRemaining + 1);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setShake(true);
      const t2 = setTimeout(() => setShake(false), 320);
      return () => clearTimeout(t2);
    }
  }, [errorMessage]);

  const handleDigitChange = (index: number, val: string) => {
    if (isLocked) return;

    if (val.length > 1) {
      const sanitized = val.replace(/\D/g, '').slice(0, 6);
      if (sanitized) {
        const nextDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = sanitized[i] || '';
        }
        setDigits(nextDigits);
        const nextFocus = Math.min(sanitized.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (sanitized.length === 6) {
          onVerify(sanitized);
        }
      }
      return;
    }

    const singleDigit = val.replace(/\D/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = singleDigit;
    setDigits(nextDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join('');
    if (fullCode.length === 6) {
      onVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setDigits(['', '', '', '', '', '']);
      setCooldown(initialCooldown);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="btn-link" style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} />
        <span>Change {type === 'phone' ? 'Phone' : 'Email'}</span>
      </button>

      <div className="step-head">
        <h2 className="step-head__title">{type === 'phone' ? t.verificationCode : t.enterEmailCode}</h2>
        <p className="step-head__subtitle">{type === 'phone' ? t.enterCodeSent : t.enterEmailCodeSub}</p>
        <p className="step-head__target">{target}</p>
      </div>

      <div className={`otp-row ${shake ? 'animate-shake' : ''}`}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={isLocked || isLoading}
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`otp-box ${errorMessage ? 'otp-box--error' : digit ? 'otp-box--filled' : ''}`}
          />
        ))}
      </div>

      <div className="otp-meta">
        <span>
          {t.attemptCounter
            .replace('{current}', String(Math.min(currentAttempt, maxAttempts)))
            .replace('{max}', String(maxAttempts))}
        </span>

        {attemptsRemaining > 0 ? (
          <span className={attemptsRemaining === 1 ? 'otp-meta__warn' : ''}>
            {t.attemptsRemaining.replace('{count}', String(attemptsRemaining))}
          </span>
        ) : (
          <span className="otp-meta__locked">{t.tooManyAttempts}</span>
        )}
      </div>

      {errorMessage && (
        <div className="otp-alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={() => onVerify(digits.join(''))}
        disabled={isLoading || isLocked || digits.join('').length < 6}
        className="btn btn-primary"
        style={{ marginBottom: 16 }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>{t.continueBtn}</span>
        )}
      </motion.button>

      <div className="otp-resend">
        {cooldown > 0 ? (
          <div className="otp-resend__cooldown">
            <span>{language === 'uz' ? 'Kodni qayta yuborish:' : language === 'ru' ? 'Повторный код через:' : 'Resend code in:'}</span>
            <span>{formatTimer(cooldown)}</span>
          </div>
        ) : (
          <button type="button" onClick={handleResendClick} disabled={isResending} className="otp-resend__btn">
            <RotateCw size={14} className={isResending ? 'animate-spin' : ''} />
            <span>{t.resendCodeNow}</span>
          </button>
        )}
      </div>
    </div>
  );
};
