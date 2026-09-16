import React from 'react';

interface CountryFlagProps {
  code: string;
  width?: number;
  height?: number;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, width = 24, height = 16 }) => {
  const style = { width, height };

  switch (code.toUpperCase()) {
    case 'UZ':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="160" fill="#1eb53a" y="320"/>
          <rect width="640" height="160" fill="#0099b5" y="0"/>
          <rect width="640" height="160" fill="#ffffff" y="160"/>
          <rect width="640" height="10" fill="#d52b1e" y="155"/>
          <rect width="640" height="10" fill="#d52b1e" y="315"/>
          <circle cx="70" cy="80" r="45" fill="#ffffff"/>
          <circle cx="85" cy="80" r="45" fill="#0099b5"/>
          {/* 12 stars */}
          <g fill="#ffffff">
            <circle cx="150" cy="40" r="6"/>
            <circle cx="180" cy="40" r="6"/>
            <circle cx="210" cy="40" r="6"/>
            <circle cx="150" cy="70" r="6"/>
            <circle cx="180" cy="70" r="6"/>
            <circle cx="210" cy="70" r="6"/>
            <circle cx="150" cy="100" r="6"/>
            <circle cx="180" cy="100" r="6"/>
            <circle cx="210" cy="100" r="6"/>
            <circle cx="180" cy="130" r="6"/>
            <circle cx="210" cy="130" r="6"/>
            <circle cx="240" cy="130" r="6"/>
          </g>
        </svg>
      );
    case 'US':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#bd3d44"/>
          <rect width="640" height="37" fill="#ffffff" y="37"/>
          <rect width="640" height="37" fill="#ffffff" y="111"/>
          <rect width="640" height="37" fill="#ffffff" y="185"/>
          <rect width="640" height="37" fill="#ffffff" y="259"/>
          <rect width="640" height="37" fill="#ffffff" y="333"/>
          <rect width="640" height="37" fill="#ffffff" y="407"/>
          <rect width="260" height="260" fill="#192f5d"/>
          <circle cx="130" cy="130" r="80" fill="#ffffff" opacity="0.4"/>
        </svg>
      );
    case 'GB':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#012169"/>
          <path d="M0,0 L640,480 M640,0 L0,480" stroke="#ffffff" strokeWidth="60"/>
          <path d="M0,0 L640,480 M640,0 L0,480" stroke="#c8102e" strokeWidth="36"/>
          <path d="M320,0 L320,480 M0,240 L640,240" stroke="#ffffff" strokeWidth="100"/>
          <path d="M320,0 L320,480 M0,240 L640,240" stroke="#c8102e" strokeWidth="60"/>
        </svg>
      );
    case 'RU':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="160" fill="#ffffff"/>
          <rect width="640" height="160" y="160" fill="#0052b4"/>
          <rect width="640" height="160" y="320" fill="#d80027"/>
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="160" fill="#000000"/>
          <rect width="640" height="160" y="160" fill="#dd0000"/>
          <rect width="640" height="160" y="320" fill="#ffce00"/>
        </svg>
      );
    case 'TR':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#e30a17"/>
          <circle cx="260" cy="240" r="120" fill="#ffffff"/>
          <circle cx="290" cy="240" r="96" fill="#e30a17"/>
          <polygon points="380,240 420,252 400,218 400,262 420,228" fill="#ffffff"/>
        </svg>
      );
    case 'KR':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#ffffff"/>
          <circle cx="320" cy="240" r="100" fill="#cd2e3a"/>
          <path d="M 320 140 A 50 50 0 0 0 320 240 A 50 50 0 0 1 320 340 A 100 100 0 0 1 320 140 Z" fill="#0047a0"/>
        </svg>
      );
    case 'JP':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#ffffff"/>
          <circle cx="320" cy="240" r="120" fill="#bc002d"/>
        </svg>
      );
    case 'FR':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="213" height="480" fill="#002395"/>
          <rect width="213" height="480" x="213" fill="#ffffff"/>
          <rect width="214" height="480" x="426" fill="#ed2939"/>
        </svg>
      );
    case 'ES':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="120" fill="#aa151b"/>
          <rect width="640" height="240" y="120" fill="#f1bf00"/>
          <rect width="640" height="120" y="360" fill="#aa151b"/>
        </svg>
      );
    case 'KZ':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#00afca"/>
          <circle cx="320" cy="240" r="60" fill="#fec50c"/>
          <path d="M 270 270 Q 320 310 370 270" stroke="#fec50c" strokeWidth="8" fill="none"/>
        </svg>
      );
    case 'KG':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="480" fill="#e8112d"/>
          <circle cx="320" cy="240" r="80" fill="#ffe100"/>
          <circle cx="320" cy="240" r="60" fill="#e8112d"/>
        </svg>
      );
    case 'AE':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="640" height="160" fill="#00732f"/>
          <rect width="640" height="160" y="160" fill="#ffffff"/>
          <rect width="640" height="160" y="320" fill="#000000"/>
          <rect width="160" height="480" fill="#ff0000"/>
        </svg>
      );
    case 'CA':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="160" height="480" fill="#ff0000"/>
          <rect width="320" height="480" x="160" fill="#ffffff"/>
          <rect width="160" height="480" x="480" fill="#ff0000"/>
          <polygon points="320,160 340,220 380,210 350,250 380,270 335,280 340,320 320,300 300,320 305,280 260,270 290,250 260,210 300,220" fill="#ff0000"/>
        </svg>
      );
    case 'IT':
      return (
        <svg viewBox="0 0 640 480" className="flag-icon" style={style}>
          <rect width="213" height="480" fill="#009246"/>
          <rect width="213" height="480" x="213" fill="#ffffff"/>
          <rect width="214" height="480" x="426" fill="#ce2b37"/>
        </svg>
      );
    default:
      return (
        <div className="flag-icon flag-icon--fallback" style={style}>
          {code}
        </div>
      );
  }
};
