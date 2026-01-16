// src/pages/AccountInfo.tsx
// Account information and settings - FEATURE 4
// FIXED: Added UserDropdown back to header

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Globe, Calendar, Shield, Edit2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useStore';
import type { TargetLanguage } from '@/types';
import { UserDropdown } from '@/components/UserDropdown';
import { setNativeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

// Only allow these languages for the "native language" field on the Account Info page
const NATIVE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
];

export const AccountInfo = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { t, i18n } = useTranslation();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEditingLanguages, setIsEditingLanguages] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    user?.targetLanguages?.map(tl => typeof tl === 'string' ? tl : tl.code) || []
  );
  const [isEditingArtists, setIsEditingArtists] = useState(false);
  const [preferredArtists, setPreferredArtists] = useState<string[]>(user?.preferredArtists || []);
  const [newArtistInput, setNewArtistInput] = useState('');
  const [isEditingNative, setIsEditingNative] = useState(false);
  const [nativeSelection, setNativeSelection] = useState<string>(user?.nativeLanguage || '');

  const handleSaveName = () => {
    if (displayName.trim()) {
      updateUser({ displayName: displayName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveUsername = async () => {
    setUsernameError(null);
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError(t('pages.account.username_error_empty'));
      return;
    }
    if (/\s/.test(trimmed)) {
      setUsernameError(t('pages.account.username_error_spaces'));
      return;
    }

    try {
      await updateUser({ username: trimmed });
      setIsEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err?.response?.data?.error || t('pages.account.username_update_failed'));
    }
  };

  const handleSaveEmail = async () => {
    setEmailError(null);
    const trimmed = emailInput.trim();
    if (trimmed) {
      // basic email format check
      const valid = /^\S+@\S+\.\S+$/.test(trimmed);
      if (!valid) {
        setEmailError(t('pages.account.email_error_invalid'));
        return;
      }
    }

    try {
      // send null when empty to allow clearing
      await updateUser({ email: trimmed || null });
      setIsEditingEmail(false);
    } catch (err: any) {
      setEmailError(err?.response?.data?.error || t('pages.account.email_update_failed'));
    }
  };

  const handleSaveLanguages = () => {
    updateUser({
      // cast to TargetLanguage[] to ensure the literal 'beginner' matches the union type
      targetLanguages: selectedLanguages.map(code => ({ code, level: 'beginner', addedAt: new Date().toISOString() })) as TargetLanguage[],
    });
    setIsEditingLanguages(false);
  };

  const toggleLanguage = (langCode: string) => {
    if (langCode === user?.nativeLanguage) return;
    
    setSelectedLanguages(prev =>
      prev.includes(langCode)
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    );
  };

  const handleAddArtist = () => {
    const trimmed = newArtistInput.trim();
    if (trimmed && !preferredArtists.includes(trimmed)) {
      setPreferredArtists(prev => [...prev, trimmed]);
      setNewArtistInput('');
    }
  };

  const handleRemoveArtist = (artist: string) => {
    setPreferredArtists(prev => prev.filter(a => a !== artist));
  };

  const handleSaveArtists = async () => {
    await updateUser({ preferredArtists });
    setIsEditingArtists(false);
  };

  const handleCancelArtists = () => {
    setPreferredArtists(user?.preferredArtists || []);
    setNewArtistInput('');
    setIsEditingArtists(false);
  };

  // Helper to get translated language name (fallback to English list)
  const getLangName = (code?: string) => {
    if (!code) return '';
    const key = `languages.${code}`;
    const translated = t(key);
    if (translated && !translated.includes('languages.')) return translated;
    const found = LANGUAGES.find(l => l.code === code);
    return found?.name || code.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - FIXED: Added UserDropdown */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('account.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('account.subtitle')}
                </p>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-3xl font-bold text-white">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                {/* Display Name */}
                <div className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('account.display_name')}
                    </p>
                    {isEditingName ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="primary" size="sm" onClick={handleSaveName}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDisplayName(user?.displayName || '');
                            setIsEditingName(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">{user?.displayName}</p>
                    )}
                  </div>
                  {!isEditingName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Username (editable) */}
                <div className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('account.username')}</p>
                    {!isEditingUsername ? (
                      <p className="text-gray-600 dark:text-gray-400">{user?.username || t('account.no_username')}</p>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="flex-1"
                          placeholder={t('account.placeholders.username')}
                        />
                        <Button variant="primary" size="sm" onClick={handleSaveUsername}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setUsernameInput(user?.username || ''); setIsEditingUsername(false); setUsernameError(null); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {usernameError && <p className="mt-1 text-sm text-red-600">{usernameError}</p>}
                  </div>
                  {!isEditingUsername && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsEditingUsername(true); setUsernameInput(user?.username || ''); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Email */}
                <div className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('account.email')}
                    </p>
                    {!isEditingEmail ? (
                      <p className="text-gray-600 dark:text-gray-400">{user?.email || t('account.no_email')}</p>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="flex-1"
                          placeholder={t('account.placeholders.email')}
                        />
                        <Button variant="primary" size="sm" onClick={handleSaveEmail}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEmailInput(user?.email || ''); setIsEditingEmail(false); setEmailError(null); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                  </div>
                  {!isEditingEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsEditingEmail(true); setEmailInput(user?.email || ''); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Native Language */}
                <div className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('account.native_label')}</p>
                    {!isEditingNative ? (
                       <div className="flex items-center justify-between">
                        <p className="text-gray-600 dark:text-gray-400">{getLangName(user?.nativeLanguage) || user?.nativeLanguage || t('settings.native_unknown')}</p>
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditingNative(true); setNativeSelection(user?.nativeLanguage || ''); }} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={nativeSelection}
                          onChange={(e) => setNativeSelection(e.target.value)}
                          className="rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                          <option value="">--</option>
                          {NATIVE_LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{getLangName(l.code)}</option>
                          ))}
                        </select>
                        <Button variant="primary" size="sm" onClick={async () => {
                          if (!nativeSelection) return;
                          try {
                            await updateUser({ nativeLanguage: nativeSelection });
                            // apply immediately
                            setNativeLanguage(nativeSelection);
                            setIsEditingNative(false);
                          } catch (err) {
                            console.error('Failed to update native language', err);
                            alert(t('pages.account.native_update_failed'));
                          }
                        }}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditingNative(false); setNativeSelection(user?.nativeLanguage || ''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Age Verification */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('account.account_type')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user?.isAdult ? t('account.adult') : t('account.minor')}
                    </p>
                    {!user?.isAdult && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t('settings.cookie.functional.desc')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t('account.member_since')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(user?.createdAt || Date.now()).toLocaleDateString(i18n.language || 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Target Languages Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('account.target_languages')}
              </h3>
              {!isEditingLanguages ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingLanguages(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  {t('account.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLanguages(
                        user?.targetLanguages?.map(tl => typeof tl === 'string' ? tl : tl.code) || []
                      );
                      setIsEditingLanguages(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('buttons.cancel')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveLanguages}>
                    <Save className="mr-2 h-4 w-4" />
                    {t('buttons.save')}
                  </Button>
                </div>
              )}
            </div>

            {isEditingLanguages ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LANGUAGES.map((lang) => {
                   const isSelected = selectedLanguages.includes(lang.code);
                   const isNative = lang.code === user?.nativeLanguage;
                   return (
                     <button
                       key={lang.code}
                       onClick={() => toggleLanguage(lang.code)}
                       disabled={isNative}
                       className={`rounded-lg border-2 p-3 text-left transition-all ${
                         isSelected
                           ? 'border-primary-600 bg-primary-50 dark:bg-primary-950'
                           : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                       } ${
                         isNative ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                       }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {getLangName(lang.code)}
                      </p>
                      {isNative && (
                        <p className="text-xs text-gray-500">{t('account.native_label')}</p>
                      )}
                    </button>
                   );
                 })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.targetLanguages?.map((tl) => {
                   const code = typeof tl === 'string' ? tl : tl.code;
                   return (
                     <span
                       key={code}
                       className="badge-primary"
                     >
                       {getLangName(code) || code.toUpperCase()}
                     </span>
                   );
                 })}
                 {(!user?.targetLanguages || user.targetLanguages.length === 0) && (
                   <p className="text-gray-500">{t('account.no_target_languages')}</p>
                 )}
               </div>
            )}
          </motion.div>

          {/* Preferred Artists Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('account.preferred_artists')}
              </h3>
              {!isEditingArtists ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingArtists(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  {t('account.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelArtists}>
                    <X className="mr-2 h-4 w-4" />
                    {t('buttons.cancel')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveArtists}>
                    <Save className="mr-2 h-4 w-4" />
                    {t('buttons.save')}
                  </Button>
                </div>
              )}
            </div>

            {isEditingArtists ? (
              <div>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newArtistInput}
                      onChange={(e) => setNewArtistInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArtist();
                        }
                      }}
                      placeholder={t('account.enter_artist_placeholder')}
                      className="flex-1"
                    />
                    <Button variant="primary" onClick={handleAddArtist}>
                      {t('buttons.add')}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('account.artist_personalization')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferredArtists.map((artist) => (
                    <span
                      key={artist}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-950 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-800"
                    >
                      {artist}
                      <button
                        onClick={() => handleRemoveArtist(artist)}
                        className="rounded-full hover:bg-primary-200 dark:hover:bg-primary-900 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {preferredArtists.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">{t('account.no_preferred_artists')}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user?.preferredArtists || []).map((artist) => (
                  <span
                    key={artist}
                    className="badge-primary"
                  >
                    {artist}
                  </span>
                ))}
                {(!user?.preferredArtists || user.preferredArtists.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400">{t('account.no_preferred_artists_set')}</p>
                )}
              </div>
            )}
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('account.stats_title')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.totalXp || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('account.total_xp')}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.currentStreak || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('account.current_streak')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
