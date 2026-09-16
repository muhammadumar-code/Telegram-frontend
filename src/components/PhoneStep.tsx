import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Shield,
  ArrowRight,
  Loader2,
  Search,
  Check,
  QrCode as QrIcon
} from 'lucide-react';
import type { Country, LanguageCode } from '../types/index.ts';
import { COUNTRIES } from '../data/countries.js';
import { CountryFlag } from './CountryFlag.tsx';
import { TRANSLATIONS } from '../i18n/translations.js';

interface PhoneStepProps {
  country: Country;
  onSelectCountry: (country: Country) => void;
  onSubmitPhone: (rawPhone: string, formattedPhone: string) => Promise<void>;
  onSwitchToQr: () => void;
  isLoading: boolean;
  language: LanguageCode;
  errorMessage?: string;
}

export const PhoneStep: React.FC<PhoneStepProps> = ({
  country,
  onSelectCountry,
  onSubmitPhone,
  onSwitchToQr,
  isLoading,
  language,
  errorMessage
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [localError, setLocalError] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nativeName.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 15) {
      setPhoneNumber(raw);
      setLocalError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 7) {
      setLocalError(t.invalidPhone);
      return;
    }

    const fullPhoneNumber = `${country.dialCode}${phoneNumber}`;
    await onSubmitPhone(fullPhoneNumber, `${country.dialCode} ${phoneNumber}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button type="button" onClick={onSwitchToQr} className="btn-link">
          <QrIcon size={16} />
          <span>QR-kod orqali kirish</span>
        </button>
      </div>

      <div className="step-head">
        <h2 className="step-head__title">{t.yourPhoneNumber}</h2>
        <p className="step-head__subtitle">{t.phoneSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Country selector */}
        <div className="field" style={{ position: 'relative' }}>
          <label className="field__label">1. Davlat (Country)</label>
          <button
            type="button"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            className="country-trigger"
          >
            <div className="country-trigger__main">
              <CountryFlag code={country.code} width={26} height={18} />
              <div style={{ minWidth: 0 }}>
                <span className="country-trigger__name">{country.name}</span>
                {country.nativeName !== country.name && (
                  <span className="country-trigger__native">{country.nativeName}</span>
                )}
              </div>
            </div>
            <div className="country-trigger__meta">
              <span className="country-trigger__dial">{country.dialCode}</span>
              <ChevronDown size={16} className={`chevron ${isCountryDropdownOpen ? 'chevron--open' : ''}`} />
            </div>
          </button>

          <AnimatePresence>
            {isCountryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="country-dropdown"
              >
                <div className="country-search">
                  <Search size={14} />
                  <input
                    type="text"
                    autoFocus
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder={t.searchCountry}
                  />
                </div>

                <div className="country-list custom-scrollbar">
                  {filteredCountries.map((c) => {
                    const isSelected = c.code === country.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onSelectCountry(c);
                          setIsCountryDropdownOpen(false);
                          setCountrySearch('');
                        }}
                        className={`country-item ${isSelected ? 'country-item--selected' : ''}`}
                      >
                        <div className="country-item__main">
                          <CountryFlag code={c.code} width={20} height={14} />
                          <span className="country-item__name">{c.name}</span>
                        </div>
                        <div className="country-item__meta">
                          <span>{c.dialCode}</span>
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone number */}
        <div className="field">
          <label className="field__label">2. Telefon raqami (Phone number)</label>
          <div className="phone-field">
            <div className="phone-field__dial">
              <CountryFlag code={country.code} width={20} height={14} />
              <span>{country.dialCode}</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={country.phoneDigits === 9 ? '90 123 45 67' : t.phonePlaceholder}
            />
          </div>
        </div>

        {(localError || errorMessage) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="field-error">
            <span className="field-error__dot" />
            <span>{localError || errorMessage}</span>
          </motion.div>
        )}

        <div className="field-hint">
          <Shield size={16} color="var(--white)" />
          <span>{t.securityNotice} (Kodni terminaldan ko‘rishingiz mumkin)</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading || !phoneNumber}
          className="btn btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>SMS kod yuborilmoqda...</span>
            </>
          ) : (
            <>
              <span>{t.continueBtn}</span>
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};
