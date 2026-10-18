import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Globe,
  MapPin,
  Save,
  X,
  Sparkles,
  User as UserIcon,
  Code2,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedUser: User) => void;
}

const POPULAR_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Go',
  'Rust',
  'C++',
  'Java',
  'PHP',
  'C#',
  'Ruby',
  'Swift',
  'SQL',
  'Kotlin',
];

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab in the modal
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'skills'>('profile');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [favoriteLanguages, setFavoriteLanguages] = useState<string[]>([]);
  const [isActivityPublic, setIsActivityPublic] = useState(true);

  // Avatar states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarMarkedForDeletion, setIsAvatarMarkedForDeletion] = useState(false);

  // Status & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setUsername(user.username || '');
      setTagline(user.tagline || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsiteUrl(user.website_url || '');
      setGithubUrl(user.github_url || '');
      setLinkedinUrl(user.linkedin_url || '');
      setFavoriteLanguages(user.favorite_languages || []);
      setIsActivityPublic(user.is_activity_public !== false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsAvatarMarkedForDeletion(false);
      setErrors({});
      setGeneralError(null);
      setSuccessMessage(null);
      setActiveTab('profile');
    }
  }, [user, isOpen]);

  // Clean up preview object URL on unmount or change
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user) return null;

  // Dirty check for unsaved changes
  const isDirty =
    name !== (user.name || '') ||
    username !== (user.username || '') ||
    tagline !== (user.tagline || '') ||
    bio !== (user.bio || '') ||
    location !== (user.location || '') ||
    websiteUrl !== (user.website_url || '') ||
    githubUrl !== (user.github_url || '') ||
    linkedinUrl !== (user.linkedin_url || '') ||
    JSON.stringify(favoriteLanguages) !== JSON.stringify(user.favorite_languages || []) ||
    isActivityPublic !== (user.is_activity_public !== false) ||
    avatarFile !== null ||
    isAvatarMarkedForDeletion;

  const handleClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        t('profile.confirmDiscard', 'You have unsaved changes. Discard them?')
      );
      if (!confirmDiscard) return;
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: t('profile.invalidImageType', 'Please choose a JPEG, PNG, or WebP image.'),
      }));
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrors((prev) => ({
        ...prev,
        avatar: t('profile.avatarTooLarge', 'Image size must not exceed 2 MB.'),
      }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.avatar;
      return copy;
    });

    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsAvatarMarkedForDeletion(false);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsAvatarMarkedForDeletion(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleLanguage = (lang: string) => {
    setFavoriteLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.filter((l) => l !== lang);
      }
      if (prev.length >= 8) {
        return prev;
      }
      return [...prev, lang];
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = t('profile.nameRequired', 'Display name is required.');
    } else if (name.length > 100) {
      errs.name = t('profile.nameMax', 'Display name cannot exceed 100 characters.');
    }

    if (!username.trim()) {
      errs.username = t('profile.usernameRequired', 'Username is required.');
    } else if (username.length < 3 || username.length > 30) {
      errs.username = t('profile.usernameLength', 'Username must be between 3 and 30 characters.');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errs.username = t(
        'profile.usernameAlphaDash',
        'Username can only contain letters, numbers, dashes, and underscores.'
      );
    }

    if (tagline.length > 100) {
      errs.tagline = t('profile.taglineMax', 'Tagline cannot exceed 100 characters.');
    }

    if (bio.length > 300) {
      errs.bio = t('profile.bioMax', 'Bio cannot exceed 300 characters.');
    }

    const validateUrl = (url: string, field: string) => {
      if (url.trim()) {
        try {
          const parsed = new URL(url.trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            errs[field] = t('profile.invalidUrlProtocol', 'URL must start with http:// or https://');
          }
        } catch {
          errs[field] = t('profile.invalidUrl', 'Please enter a valid URL.');
        }
      }
    };

    validateUrl(websiteUrl, 'websiteUrl');
    validateUrl(githubUrl, 'githubUrl');
    validateUrl(linkedinUrl, 'linkedinUrl');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      // 1. If avatar changed, upload or delete
      if (isAvatarMarkedForDeletion && user.avatar_url) {
        await api.delete('/profile/avatar');
      } else if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.post('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 2. Update profile fields
      const res = await api.put('/profile', {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website_url: websiteUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        favorite_languages: favoriteLanguages,
        is_activity_public: isActivityPublic,
      });

      const updatedUser = res.data.user;

      // 3. Refresh user state in AuthContext & TanStack Query cache
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
      queryClient.invalidateQueries({ queryKey: ['profile', username.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      setSuccessMessage(t('profile.saveSuccess', 'Profile updated successfully!'));
      if (onSaved) {
        onSaved(updatedUser);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([field, msgs]: [string, any]) => {
          backendErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        });
        setErrors(backendErrors);
        // Switch tab to the one containing the error if applicable
        if (backendErrors.name || backendErrors.username || backendErrors.tagline || backendErrors.bio) {
          setActiveTab('profile');
        } else if (backendErrors.website_url || backendErrors.github_url || backendErrors.linkedin_url || backendErrors.location) {
          setActiveTab('social');
        }
      } else {
        setGeneralError(
          err.response?.data?.message || t('profile.saveFailed', 'Failed to save profile.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAvatarDisplay = isAvatarMarkedForDeletion
    ? null
    : avatarPreview || user.avatar_url;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('profile.editTitle', 'Edit Profile')}
      description={t('profile.editSubtitle', 'Update your public persona and developer details')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Alerts */}
        {generalError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-2 flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-violet-500" />
            <span>Profile & Bio</span>
            {(errors.name || errors.username || errors.tagline || errors.bio) && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex items-center justify-center gap-2 flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'social'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>Social & Links</span>
            {(errors.websiteUrl || errors.website_url || errors.githubUrl || errors.github_url || errors.linkedinUrl || errors.linkedin_url) && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex items-center justify-center gap-2 flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Skills & Privacy</span>
          </button>
        </div>

        {/* Tab 1: Profile & Bio Content */}
        <div className="max-h-[52vh] sm:max-h-[58vh] overflow-y-auto no-scrollbar pr-1 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Avatar Uploader Section */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  <Avatar
                    src={currentAvatarDisplay}
                    name={name || user.name}
                    size="xl"
                    className="ring-2 ring-violet-500/20 shadow-xs"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      {t('profile.profilePhoto', 'Profile Picture')}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {t('profile.avatarGuidelines', 'Upload PNG, JPEG, or WebP. Max size: 2 MB.')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="avatar-upload-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5 text-violet-500" />}
                    >
                      {t('profile.changeAvatar', 'Upload Photo')}
                    </Button>

                    {(currentAvatarDisplay || avatarFile) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        {t('profile.removeAvatar', 'Remove')}
                      </Button>
                    )}
                  </div>

                  {errors.avatar && (
                    <p className="text-xs text-rose-500 font-medium">{errors.avatar}</p>
                  )}
                </div>
              </div>

              {/* Names: Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label={t('profile.displayName', 'Display Name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="e.g. Alex Chen"
                  required
                  maxLength={100}
                />

                <Input
                  label={t('profile.username', 'Username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={errors.username}
                  placeholder="e.g. alexchen"
                  required
                  maxLength={30}
                  helperText={t('profile.usernameNotice', 'Unique handle: letters, numbers, _, -')}
                />
              </div>

              {/* Developer Tagline */}
              <Input
                label={t('profile.tagline', 'Developer Tagline')}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                error={errors.tagline}
                placeholder="e.g. Full-Stack Engineer & Distributed Systems Enthusiast"
                maxLength={100}
                leftIcon={<Sparkles className="w-4 h-4 text-violet-500" />}
              />

              {/* Bio with live counter */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {t('profile.bio', 'Bio')}
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      bio.length > 280
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {bio.length} / 300
                  </span>
                </div>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder={t(
                    'profile.bioPlaceholder',
                    'Share a brief summary of what you are working on, your passions, or tech interests...'
                  )}
                  className={`w-full bg-white dark:bg-zinc-900/70 border text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm rounded-lg p-3 transition-colors focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/80 ${
                    errors.bio
                      ? 'border-rose-500/80'
                      : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                />
                {errors.bio && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {errors.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Social & Presence Content */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label={t('profile.location', 'Location')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  error={errors.location}
                  placeholder="e.g. San Francisco, CA / Paris, FR"
                  maxLength={100}
                  leftIcon={<MapPin className="w-4 h-4 text-zinc-400" />}
                />

                <Input
                  label={t('profile.website', 'Personal Website')}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  error={errors.websiteUrl || errors.website_url}
                  placeholder="https://yourdomain.com"
                  maxLength={255}
                  leftIcon={<Globe className="w-4 h-4 text-zinc-400" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label={t('profile.githubUrl', 'GitHub Profile URL')}
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  error={errors.githubUrl || errors.github_url}
                  placeholder="https://github.com/username"
                  maxLength={255}
                  leftIcon={<GithubIcon className="w-4 h-4 text-zinc-400" />}
                />

                <Input
                  label={t('profile.linkedinUrl', 'LinkedIn Profile URL')}
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  error={errors.linkedinUrl || errors.linkedin_url}
                  placeholder="https://linkedin.com/in/username"
                  maxLength={255}
                  leftIcon={<LinkedinIcon className="w-4 h-4 text-zinc-400" />}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
                <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-violet-500" />
                  Public Visibility
                </div>
                <p>
                  External social profiles and portfolio links will be displayed on your CodeArena public developer badge.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Skills & Privacy Content */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              {/* Favorite Programming Languages */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-500" />
                    {t('profile.favoriteLanguages', 'Favorite Programming Languages')}
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {favoriteLanguages.length}/8 {t('profile.selected', 'selected')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_LANGUAGES.map((lang) => {
                    const isSelected = favoriteLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-violet-600 text-white font-semibold shadow-xs ring-1 ring-violet-500'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
                        }`}
                      >
                        <span>{lang}</span>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Controls Card */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="public-activity-toggle"
                  checked={isActivityPublic}
                  onChange={(e) => setIsActivityPublic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="public-activity-toggle" className="text-xs cursor-pointer select-none">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    {isActivityPublic ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    {t('profile.publicActivityTitle', 'Public Activity & Solved Challenges')}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 block mt-1 leading-relaxed">
                    {t(
                      'profile.publicActivitySubtitle',
                      'Allow other competitive programmers to view your solved challenge badges and recent submission history on your public profile.'
                    )}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved edits
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono">No unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              {t('common.cancel', 'Cancel')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {t('common.saveChanges', 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
