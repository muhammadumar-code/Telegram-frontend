import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import type { DesignType, LanguageCode } from '../types/index.ts';
import { TRANSLATIONS } from '../i18n/translations.js';

interface DesignSelectorProps {
  selectedDesign: DesignType;
  onSelectDesign: (design: DesignType) => void;
  onContinue: () => void;
  language: LanguageCode;
}

export const DesignSelector: React.FC<DesignSelectorProps> = ({
  selectedDesign,
  onSelectDesign,
  onContinue,
  language
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const designs: Array<{
    id: DesignType;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'crystal-glass',
      title: t.design1Title,
      description: t.design1Desc,
      badge: 'Apple Minimal',
      icon: <Layers size={18} />
    },
    {
      id: 'dark-3d',
      title: t.design2Title,
      description: t.design2Desc,
      badge: 'Obsidian 3D',
      icon: <ShieldCheck size={18} />
    },
    {
      id: 'aurora-glass',
      title: t.design3Title,
      description: t.design3Desc,
      badge: 'Futuristic Glow',
      icon: <Sparkles size={18} />
    }
  ];

  return (
    <div>
      <div className="step-head">
        <h2 className="step-head__title">{t.chooseExperience}</h2>
        <p className="step-head__subtitle">{t.selectDesignSub}</p>
      </div>

      <div className="design-list">
        {designs.map((d) => {
          const isSelected = selectedDesign === d.id;
          return (
            <motion.div
              key={d.id}
              onClick={() => onSelectDesign(d.id)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`design-card ${isSelected ? 'design-card--selected' : ''}`}
            >
              <div className="design-card__top">
                <div className="design-card__left">
                  <div className="design-card__icon">{d.icon}</div>
                  <div>
                    <span className="design-card__title">
                      {d.title}
                      <span className="design-card__badge">{d.badge}</span>
                    </span>
                    <p className="design-card__desc">{d.description}</p>
                  </div>
                </div>

                <div className="design-card__check">
                  {isSelected && <Check size={14} />}
                </div>
              </div>

              <div className="design-card__footer">
                <span className="design-card__footer-dot">
                  <span className="pulse-dot" />
                  Interactive Glass Core
                </span>
                <span>3D Active</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onContinue}
        className="btn btn-primary"
      >
        <span>{t.continueBtn}</span>
      </motion.button>
    </div>
  );
};
