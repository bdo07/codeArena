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
      const confirmDiscard = window.confirm(t('profile.confirmDiscard', 'You have unsaved changes. Discard them?'));
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
      errs.username = t('profile.usernameAlphaDash', 'Username can only contain letters, numbers, dashes, and underscores.');
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
      } else {
        setGeneralError(err.response?.data?.message || t('profile.saveFailed', 'Failed to save profile.'));
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
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* 1. Avatar Section */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group shrink-0">
            <Avatar
              src={currentAvatarDisplay}
              name={name || user.name}
              size="xl"
              className="ring-2 ring-violet-500/20"
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
                leftIcon={<Upload className="w-3.5 h-3.5" />}
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

        {/* 2. Identity & Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* 3. Developer Tagline */}
        <Input
          label={t('profile.tagline', 'Developer Tagline')}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          error={errors.tagline}
          placeholder="e.g. Full-Stack Engineer & Distributed Systems Enthusiast"
          maxLength={100}
          leftIcon={<Sparkles className="w-4 h-4 text-violet-500" />}
        />

        {/* 4. Bio with live counter */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('profile.bio', 'Bio')}
            </label>
            <span
              className={`text-[10px] font-mono ${
                bio.length > 280
                  ? 'text-amber-500 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400'
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

        {/* 5. Location and Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('profile.githubUrl', 'GitHub Profile URL')}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            error={errors.githubUrl || errors.github_url}
            placeholder="https://github.com/username"
            maxLength={255}
          />

          <Input
            label={t('profile.linkedinUrl', 'LinkedIn Profile URL')}
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            error={errors.linkedinUrl || errors.linkedin_url}
            placeholder="https://linkedin.com/in/username"
            maxLength={255}
          />
        </div>

        {/* 6. Favorite Programming Languages */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('profile.favoriteLanguages', 'Favorite Programming Languages')}
            </label>
            <span className="text-[10px] text-zinc-500">
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
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600 text-white font-semibold shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Privacy Controls */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/30 flex items-start gap-3">
          <input
            type="checkbox"
            id="public-activity-toggle"
            checked={isActivityPublic}
            onChange={(e) => setIsActivityPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
          />
          <label htmlFor="public-activity-toggle" className="text-xs cursor-pointer select-none">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">
              {t('profile.publicActivityTitle', 'Public Activity & Solved Challenges')}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 block mt-0.5">
              {t(
                'profile.publicActivitySubtitle',
                'Allow other competitive programmers to view your solved challenge badges and recent submission history on your public profile.'
              )}
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            leftIcon={<X className="w-4 h-4" />}
          >
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
