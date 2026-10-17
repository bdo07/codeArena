import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  Globe,
  Sliders,
  Image,
  ExternalLink,
  AlertCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  shareCardApi,
  ShareableCardSettings,
  ShareableCardStats,
  CardTemplate,
  CardTheme,
  CardLayout,
  CardField,
} from '@/services/shareCardApi';
import { ProgressCardPreview } from './ProgressCardPreview';

export interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url?: string | null;
    xp: number;
    level: number;
  };
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { t } = useTranslation();
  const cardElementRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedText, setIsCopiedText] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card state
  const [card, setCard] = useState<ShareableCardSettings | null>(null);
  const [stats, setStats] = useState<ShareableCardStats | null>(null);

  // Customization controls
  const [template, setTemplate] = useState<CardTemplate>('modern');
  const [cardTheme, setCardTheme] = useState<CardTheme>('dark');
  const [layout, setLayout] = useState<CardLayout>('horizontal');
  const [selectedFields, setSelectedFields] = useState<CardField[]>([
    'avatar',
    'tagline',
    'solved',
    'xp_level',
    'streak',
    'badges',
    'skills',
    'git',
    'interviews',
  ]);
  const [customTagline, setCustomTagline] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // Fetch settings on open
  const loadCardSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await shareCardApi.getSettings();
      setCard(data.card);
      setStats(data.stats);
      setTemplate(data.card.template || 'modern');
      setCardTheme(data.card.card_theme || 'dark');
      setLayout(data.card.layout || 'horizontal');
      setSelectedFields(data.card.selected_fields || [
        'avatar',
        'tagline',
        'solved',
        'xp_level',
        'streak',
        'badges',
        'skills',
      ]);
      setCustomTagline(data.card.custom_tagline || '');
      setIsPublic(data.card.is_public);
    } catch (err: unknown) {
      console.error('Failed to load card settings:', err);
      setErrorMessage(t('shareCard.errorLoading', 'Failed to load card settings.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      loadCardSettings();
    }
  }, [isOpen, loadCardSettings]);

  // Persist settings changes
  const saveChanges = async (updates: Partial<{
    is_public: boolean;
    template: CardTemplate;
    card_theme: CardTheme;
    layout: CardLayout;
    selected_fields: CardField[];
    custom_tagline: string;
  }>) => {
    try {
      const updated = await shareCardApi.updateSettings(updates);
      setCard(updated.card);
      setStats(updated.stats);
    } catch (e) {
      console.warn('Failed to autosave card settings:', e);
    }
  };

  const handleFieldToggle = (field: CardField) => {
    const updated = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field];
    setSelectedFields(updated);
    saveChanges({ selected_fields: updated });
  };

  const handleTemplateChange = (tmpl: CardTemplate) => {
    setTemplate(tmpl);
    saveChanges({ template: tmpl });
  };

  const handleThemeChange = (th: CardTheme) => {
    setCardTheme(th);
    saveChanges({ card_theme: th });
  };

  const handleLayoutChange = (lay: CardLayout) => {
    setLayout(lay);
    saveChanges({ layout: lay });
  };

  const handlePublicToggle = async () => {
    const newStatus = !isPublic;
    setIsPublic(newStatus);
    await saveChanges({ is_public: newStatus });
    setStatusMessage(
      newStatus
        ? t('shareCard.publicEnabled', 'Public link activated. Anyone with this link can view your card.')
        : t('shareCard.publicDisabled', 'Card is now private. Public link disabled.')
    );
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRegenerateToken = async () => {
    if (!window.confirm(t('shareCard.confirmRegenerate', 'Regenerate public share link? Previous links will immediately stop working.'))) {
      return;
    }
    try {
      const res = await shareCardApi.regenerateToken();
      if (card) {
        setCard({ ...card, share_token: res.share_token });
      }
      setStatusMessage(t('shareCard.tokenRegenerated', 'New unguessable public link generated.'));
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e) {
      console.error(e);
      setErrorMessage(t('shareCard.errorRegenerating', 'Failed to regenerate share token.'));
    }
  };

  // Download high-resolution PNG
  const handleDownloadImage = async () => {
    if (!cardElementRef.current) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const dataUrl = await toPng(cardElementRef.current, {
        pixelRatio: 2, // High-DPI crystal clear export
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `codearena-${user.username}-achievement-card.png`;
      link.href = dataUrl;
      link.click();

      setStatusMessage(t('shareCard.downloadSuccess', 'Achievement card downloaded successfully!'));
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to export card image:', err);
      setErrorMessage(t('shareCard.downloadFailed', 'Could not render image. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  // Copy image to clipboard where browser supports it
  const handleCopyImage = async () => {
    if (!cardElementRef.current) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const blob = await toBlob(cardElementRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) throw new Error('Blob conversion failed');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopiedImage(true);
        setTimeout(() => setIsCopiedImage(false), 2500);
      } else {
        // Fallback to downloading
        handleDownloadImage();
      }
    } catch (e) {
      console.warn('Clipboard image copy not supported, falling back to download:', e);
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // Copy or native share text summary
  const handleShareSummary = async () => {
    const solved = stats?.solved_challenges || 0;
    const streak = stats?.current_streak || 0;
    const publicUrl = card ? `${window.location.origin}/share/${card.share_token}` : `${window.location.origin}/profile/${user.username}`;
    
    const summaryText = `⚡ Level ${user.level} Developer on CodeArena! Solved ${solved} challenges with a ${streak}-day streak. Explore my progress: ${publicUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name}'s CodeArena Progress`,
          text: summaryText,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(summaryText);
    setIsCopiedText(true);
    setTimeout(() => setIsCopiedText(false), 2500);
  };

  const publicLink = card ? `${window.location.origin}/share/${card.share_token}` : '';

  const handleCopyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('shareCard.modalTitle', 'Shareable Developer Progress Card')}
      className="max-w-4xl w-full"
    >
      <div className="space-y-6">
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading || !stats ? (
          <div className="p-12 text-center text-sm text-zinc-500 animate-pulse">
            {t('shareCard.loading', 'Loading your real statistics and rendering preview...')}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ========================================================= */}
            {/* LIVE CARD PREVIEW AREA */}
            {/* ========================================================= */}
            <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-x-auto">
              <ProgressCardPreview
                user={user}
                stats={stats}
                template={template}
                cardTheme={cardTheme}
                layout={layout}
                selectedFields={selectedFields}
                customTagline={customTagline}
                cardRef={cardElementRef}
              />
            </div>

            {/* ========================================================= */}
            {/* CUSTOMIZATION OPTIONS ACCORDION / TOOLBAR */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Col 1: Template & Theme */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {t('shareCard.templateLabel', 'Card Template')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', name: 'Modern' },
                      { id: 'terminal', name: 'Terminal' },
                      { id: 'minimal', name: 'Minimal' },
                      { id: 'badge_spotlight', name: 'Spotlight' },
                    ].map((tItem) => (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => handleTemplateChange(tItem.id as CardTemplate)}
                        className={`px-3 py-2 rounded-xl border text-center transition-all ${
                          template === tItem.id
                            ? 'border-violet-500 bg-violet-500/10 text-violet-500 font-bold ring-1 ring-violet-500'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {tItem.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {t('shareCard.themeLabel', 'Card Style')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dark', name: 'Deep Dark' },
                      { id: 'light', name: 'Pure Light' },
                      { id: 'obsidian', name: 'Obsidian' },
                      { id: 'violet', name: 'Violet Neon' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleThemeChange(th.id as CardTheme)}
                        className={`px-3 py-2 rounded-xl border text-center transition-all ${
                          cardTheme === th.id
                            ? 'border-violet-500 bg-violet-500/10 text-violet-500 font-bold ring-1 ring-violet-500'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {th.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 2: Layout & Custom Tagline */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {t('shareCard.layoutLabel', 'Aspect Ratio / Layout')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('horizontal')}
                      className={`px-3 py-2 rounded-xl border text-center transition-all ${
                        layout === 'horizontal'
                          ? 'border-violet-500 bg-violet-500/10 text-violet-500 font-bold ring-1 ring-violet-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Social Banner (1.9:1)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('square')}
                      className={`px-3 py-2 rounded-xl border text-center transition-all ${
                        layout === 'square'
                          ? 'border-violet-500 bg-violet-500/10 text-violet-500 font-bold ring-1 ring-violet-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Square Card (1:1)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {t('shareCard.taglineLabel', 'Custom Headline / Tagline')}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={customTagline}
                    onChange={(e) => {
                      setCustomTagline(e.target.value);
                      saveChanges({ custom_tagline: e.target.value });
                    }}
                    placeholder="Software Engineer & CodeArena Competitor"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="text-[10px] text-zinc-400 text-right mt-1 font-mono">
                    {customTagline.length}/100
                  </div>
                </div>
              </div>

              {/* Col 3: Field Visibility Toggles */}
              <div className="space-y-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  {t('shareCard.fieldsLabel', 'Include on Card')}
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    { id: 'avatar', label: 'Avatar Picture' },
                    { id: 'tagline', label: 'Tagline Quote' },
                    { id: 'solved', label: 'Solved Challenges' },
                    { id: 'xp_level', label: 'XP & Level Badge' },
                    { id: 'streak', label: 'Active Streak' },
                    { id: 'skills', label: 'Top Languages & Stack' },
                    { id: 'badges', label: 'Earned Badges' },
                    { id: 'git', label: 'Git Playground Missions' },
                    { id: 'interviews', label: 'Mock Interview Record' },
                  ].map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id as CardField)}
                        onChange={() => handleFieldToggle(field.id as CardField)}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PUBLIC LINK & PRIVACY CONTROLS */}
            {/* ========================================================= */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-zinc-400" />
                  )}
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {isPublic
                        ? t('shareCard.publicActive', 'Public Web Link Active')
                        : t('shareCard.privateOnly', 'Private (Download Only)')}
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      {isPublic
                        ? t('shareCard.publicDesc', 'Anyone with this secure unguessable link can view your sanitized card.')
                        : t('shareCard.privateDesc', 'Card is private. Enable sharing to create a public web link.')}
                    </p>
                  </div>
                </div>

                <Button
                  variant={isPublic ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={handlePublicToggle}
                  className="text-xs"
                >
                  {isPublic
                    ? t('shareCard.disablePublic', 'Make Private')
                    : t('shareCard.enablePublic', 'Enable Public Link')}
                </Button>
              </div>

              {isPublic && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicLink}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="text-xs flex items-center gap-1"
                    >
                      {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedLink ? t('shareCard.copied', 'Copied!') : t('shareCard.copyLink', 'Copy Link')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateToken}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title={t('shareCard.revokeToken', 'Regenerate link to revoke old URL')}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* EXPORT & SHARING ACTIONS */}
            {/* ========================================================= */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadImage}
                  isLoading={isExporting}
                  className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-sm text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('shareCard.downloadPng', 'Download PNG Card')}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyImage}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 text-xs"
                >
                  {isCopiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Image className="w-3.5 h-3.5" />}
                  <span>{isCopiedImage ? t('shareCard.imageCopied', 'Image Copied!') : t('shareCard.copyImage', 'Copy Image')}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareSummary}
                  className="flex items-center gap-1.5 text-xs"
                >
                  {isCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{isCopiedText ? t('shareCard.summaryCopied', 'Summary Copied!') : t('shareCard.shareSummary', 'Share Summary')}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
