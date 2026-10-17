import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toPng } from 'html-to-image';
import {
  Terminal,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { shareCardApi, PublicShareCardData } from '@/services/shareCardApi';
import { ProgressCardPreview } from '@/components/share-card/ProgressCardPreview';

export const PublicShareCardPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cardElementRef = useRef<HTMLDivElement | null>(null);

  const [cardData, setCardData] = useState<PublicShareCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchPublicCard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await shareCardApi.getPublicCard(token);
        setCardData(data);
      } catch (err: unknown) {
        console.error('Failed to load public card:', err);
        setError(t('shareCard.privateOrNotFound', 'This achievement card is private or does not exist.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicCard();
  }, [token, t]);

  const handleDownload = async () => {
    if (!cardElementRef.current || !cardData) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardElementRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `codearena-${cardData.user.username}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              CodeArena
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs flex items-center gap-1.5"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? t('shareCard.copied', 'Copied Link') : t('shareCard.copyLink', 'Share Link')}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/challenges')}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
            >
              Explore Challenges
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-zinc-500 animate-pulse">
            Loading achievement card...
          </div>
        ) : error || !cardData ? (
          <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('shareCard.privateTitle', 'Private or Expired Card')}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {error || t('shareCard.privateOrNotFound', 'This achievement card is private or does not exist.')}
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => navigate('/')} className="text-xs">
                Return to CodeArena
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-8 animate-fade-in">
            {/* Tagline intro */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold uppercase tracking-wider border border-violet-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Verified Developer Achievement
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {cardData.user.name}&rsquo;s CodeArena Card
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Member of CodeArena developer arena • Level {cardData.user.level}
              </p>
            </div>

            {/* Rendered Card */}
            <div className="w-full flex justify-center">
              <ProgressCardPreview
                user={cardData.user}
                stats={cardData.stats}
                template={cardData.card.template}
                cardTheme={cardData.card.card_theme}
                layout={cardData.card.layout}
                selectedFields={cardData.card.selected_fields}
                customTagline={cardData.card.custom_tagline}
                cardRef={cardElementRef}
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={handleDownload}
                isLoading={isExporting}
                className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 text-xs shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG Card</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(`/profile/${cardData.user.username}`)}
                className="flex items-center gap-1.5 text-xs"
              >
                <User className="w-4 h-4" />
                <span>View Full Public Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>

            {/* CTA Join CodeArena banner */}
            <div className="w-full max-w-xl p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  Ready to level up your programming skills?
                </div>
                <div className="text-zinc-500">
                  Solve real algorithmic challenges, compete in contests, and master Git.
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
              >
                Start for Free
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        CodeArena · Verified Developer Progress & Achievement Platform
      </div>
    </div>
  );
};
