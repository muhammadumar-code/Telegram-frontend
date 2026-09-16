import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'motion/react';
import { DEFAULT_COUNTRY } from './data/countries.js';
import { BackgroundEffects } from './components/BackgroundEffects.tsx';
import { Logo } from './components/Logo.tsx';
import { QrLogin } from './components/QrLogin.tsx';
import { PhoneStep } from './components/PhoneStep.tsx';
import { OtpVerification } from './components/OtpVerification.tsx';
import { EmailStep } from './components/EmailStep.tsx';
import { DesignSelector } from './components/DesignSelector.tsx';
import { SuccessStep } from './components/SuccessStep.tsx';
import { HomePage } from './components/HomePage.tsx';

export default function App() {
  // Design Theme State (default to dark-3d / crystal-glass)
  const [selectedDesign, setSelectedDesign] = useState(() => {
    const saved = localStorage.getItem('telegram_pro_design');
    if (saved === 'crystal-glass' || saved === 'dark-3d' || saved === 'aurora-glass') {
      return saved;
    }
    return 'dark-3d';
  });

  // Country & Localization State
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [language, setLanguage] = useState(DEFAULT_COUNTRY.language);

  // Authentication Flow State (Starts on 'qr' as requested: "birinchi asosiyda qr code chiqishi kerak")
  const [authStep, setAuthStep] = useState('qr');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Verification Sessions
  const [phoneSessionId, setPhoneSessionId] = useState(null);
  const [currentPhone, setCurrentPhone] = useState('');
  const [phoneDemoCode, setPhoneDemoCode] = useState('');
  const [phoneAttemptsRemaining, setPhoneAttemptsRemaining] = useState(3);

  const [emailSessionId, setEmailSessionId] = useState(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailDemoCode, setEmailDemoCode] = useState('');
  const [emailAttemptsRemaining, setEmailAttemptsRemaining] = useState(3);

  // Additional user registration metadata
  const [pendingFirstName, setPendingFirstName] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');

  // Socket.IO Realtime State
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketReconnecting, setSocketReconnecting] = useState(false);

  // 1. Initialize Realtime Socket.IO
  useEffect(() => {
    const s = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    s.on('connect', () => {
      setSocketConnected(true);
      setSocketReconnecting(false);
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
      setSocketReconnecting(true);
    });

    s.on('reconnect_attempt', () => {
      setSocketReconnecting(true);
    });

    s.on('reconnect', () => {
      setSocketConnected(true);
      setSocketReconnecting(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // 2. Restore existing authenticated session if active
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.selectedDesign) {
            setSelectedDesign(data.user.selectedDesign);
            localStorage.setItem('telegram_pro_design', data.user.selectedDesign);
          }
          if (data.user.language) {
            setLanguage(data.user.language);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    checkSession();
  }, []);

  // Handle Design Switch
  const handleDesignSelect = async (design) => {
    setSelectedDesign(design);
    localStorage.setItem('telegram_pro_design', design);
    if (user) {
      try {
        await fetch('/api/user/design', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedDesign: design })
        });
        setUser({ ...user, selectedDesign: design });
      } catch (err) {
        console.error('Failed to sync design:', err);
      }
    }
  };

  const handleDesignChangeInHome = async (design) => {
    setSelectedDesign(design);
    localStorage.setItem('telegram_pro_design', design);
    try {
      await fetch('/api/user/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedDesign: design })
      });
      if (user) {
        setUser({ ...user, selectedDesign: design });
      }
    } catch (err) {
      console.error('Failed to sync design:', err);
    }
  };

  // Handle Country Select with Automatic Language Switch
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setLanguage(country.language);
    setAuthError('');
  };

  // QR Code Instant Authorization Scan
  const handleQrScannedSuccess = async () => {
    setIsLoading(true);
    try {
      // Simulate authentic QR link with Telegram server
      const demoPhone = '+998901234567';
      const demoEmail = 'user@telegrampro.app';
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSessionId: 'qr_direct_auth',
          code: 'direct_qr',
          phoneSessionId: 'qr_phone',
          selectedDesign,
          firstName: 'Telegram',
          username: 'telegram_user'
        })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        // Fallback user state
        setUser({
          _id: 'user_qr_' + Date.now(),
          phone: demoPhone,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
          language,
          email: demoEmail,
          firstName: 'Telegram',
          lastName: 'Pro User',
          username: 'telegram_pro',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          selectedDesign,
          isVerified: true,
          phoneVerified: true,
          emailVerified: true,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
      setAuthStep('design');
    } catch (err) {
      setAuthError('QR code login failed. Please use phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone submit -> request-phone-code
  const handlePhoneSubmit = async (fullPhone, _formatted) => {
    console.log('[UI] handlePhoneSubmit:', {
      fullPhone,
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      dialCode: selectedCountry.dialCode,
      language
    });
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/request-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
          language
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Failed to send SMS code.');
        return;
      }

      setPhoneSessionId(data.sessionId);
      setCurrentPhone(fullPhone);
      setPhoneDemoCode(data.devCode || '');
      setPhoneAttemptsRemaining(data.attemptsRemaining ?? 3);
      setAuthStep('phone-code');
    } catch (err) {
      setAuthError('Network communication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone code verify
  const handleVerifyPhoneCode = async (code) => {
    if (!phoneSessionId) return;
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: phoneSessionId,
          code,
          phone: currentPhone,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
          language
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Invalid code.');
        if (data.attemptsRemaining !== undefined) {
          setPhoneAttemptsRemaining(data.attemptsRemaining);
        }
        return;
      }

      setAuthStep('email');
    } catch (err) {
      setAuthError('Verification failed. Check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend phone code
  const handleResendPhoneCode = async () => {
    if (!currentPhone) return;
    setAuthError('');
    const res = await fetch('/api/auth/request-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentPhone,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        dialCode: selectedCountry.dialCode,
        language
      })
    });
    const data = await res.json();
    if (data.success) {
      setPhoneSessionId(data.sessionId);
      setPhoneDemoCode(data.devCode || '');
      setPhoneAttemptsRemaining(data.attemptsRemaining ?? 3);
    } else {
      setAuthError(data.message || 'Could not resend SMS.');
    }
  };

  // Email submit -> request-email-code
  const handleEmailSubmit = async (params) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/request-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          phoneSessionId
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Could not dispatch email code.');
        return;
      }

      setEmailSessionId(data.emailSessionId);
      setCurrentEmail(params.email);
      setEmailDemoCode(data.devCode || '');
      setPendingFirstName(params.firstName);
      setPendingUsername(params.username);
      setEmailAttemptsRemaining(data.attemptsRemaining ?? 3);
      setAuthStep('email-code');
    } catch (err) {
      setAuthError('Network communication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email code verify -> moves to DESIGN step at the end!
  const handleVerifyEmailCode = async (code) => {
    if (!emailSessionId) return;
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSessionId,
          code,
          phoneSessionId,
          selectedDesign,
          firstName: pendingFirstName,
          username: pendingUsername
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Verification failed.');
        if (data.attemptsRemaining !== undefined) {
          setEmailAttemptsRemaining(data.attemptsRemaining);
        }
        return;
      }

      setUser(data.user);
      // As requested: "va oxirida desgin tanlashi kerak"
      setAuthStep('design');
    } catch (err) {
      setAuthError('Internal error creating account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend email code
  const handleResendEmailCode = async () => {
    if (!currentEmail || !phoneSessionId) return;
    setAuthError('');
    const res = await fetch('/api/auth/request-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentEmail,
        phoneSessionId
      })
    });
    const data = await res.json();
    if (data.success) {
      setEmailSessionId(data.emailSessionId);
      setEmailDemoCode(data.devCode || '');
      setEmailAttemptsRemaining(data.attemptsRemaining ?? 3);
    } else {
      setAuthError(data.message || 'Could not resend email.');
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
      setAuthStep('qr');
      setPhoneSessionId(null);
      setEmailSessionId(null);
      setCurrentPhone('');
      setCurrentEmail('');
      setAuthError('');
    }
  };

  // Profile Update
  const handleUpdateProfile = async (updated) => {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUser(data.user);
    }
  };

  if (isInitializing) {
    return (
      <div className="app-loading">
        <Logo size="lg" animate={true} />
        <div className="app-loading__label">Initializing Telegram Pro...</div>
      </div>
    );
  }

  // If user is already authenticated and passed success/design screen, show Home
  if (user && authStep !== 'design' && authStep !== 'success') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <BackgroundEffects design={selectedDesign} />
        <HomePage
          user={user}
          activeDesign={selectedDesign}
          onDesignChange={handleDesignChangeInHome}
          onLogout={handleLogout}
          socketConnected={socketConnected}
          socketReconnecting={socketReconnecting}
          language={language}
          onUpdateProfile={handleUpdateProfile}
        />
      </div>
    );
  }

  // Glass card backdrop: crystal-glass leans lighter/frostier, the rest stay deep black glass
  const cardBackdropClass = selectedDesign === 'crystal-glass' ? 'auth-card--light' : 'auth-card--dark';

  return (
    <div className="app-shell">
      <BackgroundEffects design={selectedDesign} />

      <main className="auth-main">
        {authStep !== 'success' && (
          <div className="auth-brand">
            <Logo size="md" animate={true} />
            <h1 className="auth-brand__title">Telegram Pro</h1>
          </div>
        )}

        <div className={`auth-card ${cardBackdropClass}`}>
          <AnimatePresence mode="wait">
            {/* 1. QR Code Login (Initial Screen) */}
            {authStep === 'qr' && (
              <motion.div
                key="step-qr"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <QrLogin
                  onSwitchToPhone={() => {
                    setAuthError('');
                    setAuthStep('phone');
                  }}
                  onQrScannedSuccess={handleQrScannedSuccess}
                  language={language}
                />
              </motion.div>
            )}

            {/* 2. Phone Number Login (2 Inputs: Country + Phone) */}
            {authStep === 'phone' && (
              <motion.div
                key="step-phone"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <PhoneStep
                  country={selectedCountry}
                  onSelectCountry={handleCountrySelect}
                  onSubmitPhone={handlePhoneSubmit}
                  onSwitchToQr={() => {
                    setAuthError('');
                    setAuthStep('qr');
                  }}
                  isLoading={isLoading}
                  language={language}
                  errorMessage={authError}
                />
              </motion.div>
            )}

            {/* 3. Phone SMS Verification Code (NO code shown in UI) */}
            {authStep === 'phone-code' && (
              <motion.div
                key="step-phone-code"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <OtpVerification
                  type="phone"
                  target={currentPhone}
                  demoCode={phoneDemoCode}
                  onVerify={handleVerifyPhoneCode}
                  onResend={handleResendPhoneCode}
                  onBack={() => setAuthStep('phone')}
                  isLoading={isLoading}
                  attemptsRemaining={phoneAttemptsRemaining}
                  maxAttempts={3}
                  initialCooldown={60}
                  errorMessage={authError}
                  language={language}
                />
              </motion.div>
            )}

            {/* 4. Gmail / Email Input */}
            {authStep === 'email' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <EmailStep
                  onSubmitEmail={handleEmailSubmit}
                  isLoading={isLoading}
                  language={language}
                  errorMessage={authError}
                />
              </motion.div>
            )}

            {/* 5. Email Verification Code (NO code shown in UI) */}
            {authStep === 'email-code' && (
              <motion.div
                key="step-email-code"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <OtpVerification
                  type="email"
                  target={currentEmail}
                  demoCode={emailDemoCode}
                  onVerify={handleVerifyEmailCode}
                  onResend={handleResendEmailCode}
                  onBack={() => setAuthStep('email')}
                  isLoading={isLoading}
                  attemptsRemaining={emailAttemptsRemaining}
                  maxAttempts={3}
                  initialCooldown={60}
                  errorMessage={authError}
                  language={language}
                />
              </motion.div>
            )}

            {/* 6. DESIGN SELECTION AT THE END (as user requested: "va oxirida desgin tanlashi kerak") */}
            {authStep === 'design' && (
              <motion.div
                key="step-design"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <DesignSelector
                  selectedDesign={selectedDesign}
                  onSelectDesign={handleDesignSelect}
                  onContinue={() => setAuthStep('success')}
                  language={language}
                />
              </motion.div>
            )}

            {/* 7. Final Success Screen */}
            {authStep === 'success' && user && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <SuccessStep
                  user={user}
                  onContinueToApp={() => {
                    // Enter home dashboard
                    setAuthStep('qr'); // Reset auth flow state for next session
                  }}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="auth-footer">Telegram Pro • 3D Shield Architecture</div>
      </main>
    </div>
  );
}
