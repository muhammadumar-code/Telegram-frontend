import React, { useState, useMemo } from 'react';
import { Search, Check, ChevronRight } from 'lucide-react';
import type { Country, LanguageCode } from '../types/index.ts';
import { COUNTRIES } from '../data/countries.js';
import { CountryFlag } from './CountryFlag.tsx';
import { TRANSLATIONS } from '../i18n/translations.js';

interface CountrySelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  onContinue: () => void;
  language: LanguageCode;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  onContinue,
  language
}) => {
  const [search, setSearch] = useState('');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.nativeName.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      <div className="step-head">
        <h2 className="step-head__title">{t.chooseCountry}</h2>
        <p className="step-head__subtitle">{t.chooseCountrySub}</p>
      </div>

      <div className="country-dropdown" style={{ position: 'static', marginBottom: 20 }}>
        <div className="country-search">
          <Search size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchCountry}
          />
        </div>

        <div className="country-list custom-scrollbar">
          {filteredCountries.length === 0 ? (
            <div className="country-list__empty">No matching countries found</div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = selectedCountry.code === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onSelectCountry(c)}
                  className={`country-item ${isSelected ? 'country-item--selected' : ''}`}
                >
                  <div className="country-item__main">
                    <CountryFlag code={c.code} width={26} height={18} />
                    <div style={{ minWidth: 0 }}>
                      <div className="country-item__name">
                        {c.name}
                        {c.nativeName !== c.name && (
                          <span style={{ color: 'var(--ink-40)', marginLeft: 6, fontWeight: 400 }}>
                            ({c.nativeName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="country-item__meta">
                    {isSelected ? <Check size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <button type="button" onClick={onContinue} className="btn btn-primary">
        <span>{t.continueBtn}</span>
      </button>
    </div>
  );
};
