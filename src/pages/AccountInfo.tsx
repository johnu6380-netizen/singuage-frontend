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
import { UserDropdown } from '@/components/UserDropdown';

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

export const AccountInfo = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingLanguages, setIsEditingLanguages] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    user?.targetLanguages?.map(tl => typeof tl === 'string' ? tl : tl.code) || []
  );
  const [isEditingArtists, setIsEditingArtists] = useState(false);
  const [preferredArtists, setPreferredArtists] = useState<string[]>(user?.preferredArtists || []);
  const [newArtistInput, setNewArtistInput] = useState('');

  const handleSaveName = () => {
    if (displayName.trim()) {
      updateUser({ displayName: displayName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveLanguages = () => {
    updateUser({ 
      targetLanguages: selectedLanguages.map(code => ({ code, level: 'beginner', addedAt: new Date().toISOString() }))
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
                  Account Information
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your profile and preferences
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
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Display Name
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
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Email Address
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {/* Native Language */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Native Language
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {LANGUAGES.find(l => l.code === user?.nativeLanguage)?.name || user?.nativeLanguage}
                    </p>
                  </div>
                </div>

                {/* Age Verification */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Account Type
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user?.isAdult ? 'Adult (18+)' : 'Minor (Under 18)'}
                    </p>
                    {!user?.isAdult && (
                      <p className="mt-1 text-xs text-gray-500">
                        Explicit content is automatically filtered
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Member Since
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', {
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
                Target Languages
              </h3>
              {!isEditingLanguages ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingLanguages(true)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
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
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveLanguages}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
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
                        {lang.name}
                      </p>
                      {isNative && (
                        <p className="text-xs text-gray-500">Native Language</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.targetLanguages?.map((tl) => {
                  const code = typeof tl === 'string' ? tl : tl.code;
                  const lang = LANGUAGES.find(l => l.code === code);
                  return (
                    <span
                      key={code}
                      className="badge-primary"
                    >
                      {lang?.name || code.toUpperCase()}
                    </span>
                  );
                })}
                {(!user?.targetLanguages || user.targetLanguages.length === 0) && (
                  <p className="text-gray-500">No target languages set</p>
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
                Preferred Artists
              </h3>
              {!isEditingArtists ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingArtists(true)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelArtists}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveArtists}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
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
                      placeholder="Enter artist name..."
                      className="flex-1"
                    />
                    <Button variant="primary" onClick={handleAddArtist}>
                      Add
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Add artists you enjoy to personalize your Discover page
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
                    <p className="text-gray-500 dark:text-gray-400">No preferred artists yet</p>
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
                  <p className="text-gray-500 dark:text-gray-400">No preferred artists set</p>
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
              Account Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.totalXp || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.currentStreak || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
