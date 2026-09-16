import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  animate?: boolean;
  className?: string;
}

const SIZE_PX: Record<string, number> = {
  sm: 32,
  md: 56,
  lg: 80,
  xl: 112,
  hero: 144
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', animate = true, className = '' }) => {
  const px = SIZE_PX[size];

  const content = (
    <div
      className={`logo-wrap ${className}`}
      style={{ width: px, height: px }}
    >
      <div className="logo-glow" />
      <img src="/logo.svg" alt="Telegram Pro" className="logo-image" />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
