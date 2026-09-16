import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { Smartphone, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo.tsx';
import type { LanguageCode } from '../types/index.ts';

interface QrLoginProps {
  onSwitchToPhone: () => void;
  onQrScannedSuccess: () => Promise<void>;
  language: LanguageCode;
}

export const QrLogin: React.FC<QrLoginProps> = ({
  onSwitchToPhone,
  onQrScannedSuccess,
  language
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [token, setToken] = useState<string>('tg_pro_' + Math.random().toString(36).substring(2, 10));
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(
      `tg://login?token=${token}&app=telegram_pro`,
      {
        width: 280,
        margin: 1,
        color: {
          dark: '#ffffff',
          light: '#00000000'
        },
        errorCorrectionLevel: 'H'
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [token]);

  const handleSimulateScan = async () => {
    setIsSimulating(true);
    setTimeout(async () => {
      await onQrScannedSuccess();
      setIsSimulating(false);
    }, 1200);
  };

  const isUz = language === 'uz';
  const isRu = language === 'ru';

  return (
    <div className="qr-wrap">
      <h2 className="step-head__title">
        {isUz ? "QR-kod orqali tezkor kirish" : isRu ? 'Вход по QR-коду' : 'Log in to Telegram Pro by QR Code'}
      </h2>
      <p className="step-head__subtitle" style={{ marginBottom: 24 }}>
        {isUz
          ? 'Telefoningizdagi Telegram orqali skanerlang'
          : isRu
          ? 'Отсканируйте код через приложение Telegram'
          : 'Scan this code with your mobile Telegram app'}
      </p>

      <div className="qr-frame">
        <div className="qr-frame__glow" />
        <motion.div
          animate={{ y: [-110, 110, -110] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="qr-scanline"
        />

        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Telegram Pro QR Code" className="qr-image" />
        ) : (
          <div className="qr-loading">
            <RefreshCw className="animate-spin" size={28} color="var(--white)" />
          </div>
        )}

        <div className="qr-badge">
          <Logo size="sm" animate={false} />
        </div>
      </div>

      <div className="qr-steps">
        <div className="qr-step">
          <span className="qr-step__num">1</span>
          <span>
            {isUz ? 'Telefoningizda Telegram ilovasini oching' : isRu ? 'Откройте Telegram на телефоне' : 'Open Telegram on your phone'}
          </span>
        </div>
        <div className="qr-step">
          <span className="qr-step__num">2</span>
          <span>
            {isUz
              ? 'Sozlamalar → Qurilmalar → Qurilmani ulash'
              : isRu
              ? 'Настройки → Устройства → Подключить устройство'
              : 'Go to Settings > Devices > Link Desktop Device'}
          </span>
        </div>
        <div className="qr-step">
          <span className="qr-step__num">3</span>
          <span>
            {isUz ? 'Kamerani ushbu QR-kodga qarating' : isRu ? 'Наведите камеру на этот QR-код' : 'Point your camera at this QR code'}
          </span>
        </div>
      </div>

      <div className="qr-demo">
        <button type="button" onClick={handleSimulateScan} disabled={isSimulating} className="qr-demo__btn">
          <ShieldCheck size={14} color="var(--success)" />
          <span>
            {isSimulating
              ? (isUz ? 'Tasdiqlanmoqda...' : 'Verifying scan...')
              : (isUz ? 'QR orqali sinov tariqasida kirish (1-klik)' : 'Instant QR Demo Scan')}
          </span>
        </button>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={onSwitchToPhone}
        className="btn btn-primary"
      >
        <Smartphone size={16} />
        <span>
          {isUz ? 'TELEFON RAQAMI BILAN KIRISH' : isRu ? 'ВОЙТИ ПО НОМЕРУ ТЕЛЕФОНА' : 'LOG IN BY PHONE NUMBER'}
        </span>
        <ArrowRight size={16} />
      </motion.button>
    </div>
  );
};
