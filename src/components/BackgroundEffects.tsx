import React from 'react';
import type { DesignType } from '../types/index.ts';

interface BackgroundEffectsProps {
  design: DesignType;
}

// All three theme options share the same Apple-style black & white glass
// language now; only the ambient glow intensity shifts slightly between them.
export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ design }) => {
  const intensity = design === 'crystal-glass' ? 1.4 : design === 'aurora-glass' ? 1.15 : 1;

  return (
    <div className="bg-effects">
      <div className="bg-orb bg-orb--a animate-drift" style={{ opacity: intensity }} />
      <div className="bg-orb bg-orb--b animate-drift" style={{ opacity: intensity, animationDelay: '-5s' }} />
      <div className="bg-orb bg-orb--c animate-drift" style={{ opacity: intensity, animationDelay: '-9s' }} />
      <div className="bg-grid" />
      <div className="bg-vignette" />
    </div>
  );
};
