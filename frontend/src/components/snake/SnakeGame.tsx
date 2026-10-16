import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  RotateCcw,
  Pause,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  Gamepad2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SnakePersonalStats } from '@/types';
import {
  Direction,
  Position,
  DIR_OFFSETS,
  isOppositeDirection,
  getNextHead,
  checkWallCollision,
  checkSelfCollision,
  calculateSpeed,
  spawnFood as spawnFoodUtil,
  calculateScore,
} from './snakeLogic';

const GRID_SIZE = 20; // 20x20 cells
const GUEST_STORAGE_KEY = 'codearena_guest_snake_best';

type GameStatus = 'idle' | 'playing' | 'paused' | 'game_over';

export const SnakeGame: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sound effects with Web Audio API (optional, can be muted)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('codearena_snake_muted') === 'true';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback(
    (freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'sine') => {
      if (isMuted) return;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Ignore audio errors in restricted environments
      }
    },
    [isMuted]
  );

  const toggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('codearena_snake_muted', String(next));
      return next;
    });
  };

  // Guest high score
  const [guestHighScore, setGuestHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(GUEST_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Authenticated stats query
  const { data: authStats } = useQuery<SnakePersonalStats>({
    queryKey: ['snake-stats'],
    queryFn: async () => {
      const res = await api.get('/snake/stats');
      return res.data;
    },
    enabled: Boolean(user),
  });

  // Game state
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [applesEaten, setApplesEaten] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Movement & Snake data (refs for requestAnimationFrame / interval synchronization)
  const snakeRef = useRef<Position[]>([
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 },
  ]);
  const foodRef = useRef<Position>({ x: 14, y: 10 });
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const movesCountRef = useRef<number>(0);
  const gameLoopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Determine current active best score
  const activeBestScore = user
    ? authStats?.high_score ?? 0
    : guestHighScore;

  // Helper to place food not on snake body
  const spawnFood = useCallback((snake: Position[]): Position => {
    return spawnFoodUtil(snake, GRID_SIZE);
  }, []);

  // Safe import of guest score to authenticated profile
  const handleImportGuestScore = async () => {
    if (!user || guestHighScore <= 0) return;
    try {
      setIsSubmittingScore(true);
      await api.post('/snake/import-guest-score', {
        score: guestHighScore,
        apples_eaten: Math.max(1, Math.floor(guestHighScore / 10)),
      });
      // Clear local guest score once imported
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setGuestHighScore(0);
      setImportNotice(t('snake.guestImportSuccess', 'Guest record successfully imported!'));
      queryClient.invalidateQueries({ queryKey: ['snake-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setImportNotice(null), 4000);
    } catch {
      // Ignore
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Start new game session
  // Render canvas frame
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Background
    ctx.fillStyle = isDark ? '#111116' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines / dots
    ctx.strokeStyle = isDark ? 'rgba(39, 39, 42, 0.45)' : 'rgba(228, 228, 231, 0.7)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food (Apple)
    const food = foodRef.current;
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.4;

    ctx.save();
    // Glow effect
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Stem / leaf
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(foodX + 2, foodY - foodRadius + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake
    const snake = snakeRef.current;
    // Use nextDirRef for instant visual feedback on direction change
    const headDir = nextDirRef.current || dirRef.current;

    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      const pad = 1.5;

      ctx.save();
      if (isHead) {
        ctx.fillStyle = '#8b5cf6'; // Violet-500
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 6;
      } else {
        // Gradient color along the body
        ctx.fillStyle = isDark ? '#7c3aed' : '#6d28d9';
      }

      // Rounded rectangle for segment
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, isHead ? 6 : 4);
        ctx.fill();
      } else {
        ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
      }
      ctx.restore();

      // Draw eyes on head
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        const eyeOffset = cellSize * 0.28;
        const eyeRadius = cellSize * 0.12;

        let eye1: Position;
        let eye2: Position;

        if (headDir === 'RIGHT') {
          eye1 = { x: x + cellSize - eyeOffset, y: y + eyeOffset };
          eye2 = { x: x + cellSize - eyeOffset, y: y + cellSize - eyeOffset };
        } else if (headDir === 'LEFT') {
          eye1 = { x: x + eyeOffset, y: y + eyeOffset };
          eye2 = { x: x + eyeOffset, y: y + cellSize - eyeOffset };
        } else if (headDir === 'UP') {
          eye1 = { x: x + eyeOffset, y: y + eyeOffset };
          eye2 = { x: x + cellSize - eyeOffset, y: y + eyeOffset };
        } else {
          eye1 = { x: x + eyeOffset, y: y + cellSize - eyeOffset };
          eye2 = { x: x + cellSize - eyeOffset, y: y + cellSize - eyeOffset };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  // Start new game session
  const startGame = useCallback(async (initialDir?: Direction) => {
    // Reset snake & food
    const initialSnake = [
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
    ];
    snakeRef.current = initialSnake;
    const startDir = initialDir && !isOppositeDirection('RIGHT', initialDir) ? initialDir : 'RIGHT';
    dirRef.current = startDir;
    nextDirRef.current = startDir;
    foodRef.current = spawnFood(initialSnake);
    movesCountRef.current = 0;

    setScore(0);
    setApplesEaten(0);
    setStatus('playing');
    playTone(320, 640, 0.12, 'triangle');
    drawGame();

    // If authenticated, initiate server session
    if (user) {
      try {
        const res = await api.post('/snake/start');
        setSessionId(res.data.session_id);
      } catch {
        setSessionId(null);
      }
    } else {
      setSessionId(null);
    }
  }, [user, spawnFood, playTone, drawGame]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'playing') return 'paused';
      if (prev === 'paused') return 'playing';
      return prev;
    });
  }, []);

  // Game Over handler
  const handleGameOver = useCallback(async () => {
    setStatus('game_over');
    drawGame();
    playTone(180, 70, 0.25, 'sawtooth');

    const finalScore = score;
    const finalApples = applesEaten;
    const finalMoves = movesCountRef.current;
    const currentSessionId = sessionId;

    // Guest score persistence
    if (!user) {
      if (finalScore > guestHighScore) {
        setGuestHighScore(finalScore);
        localStorage.setItem(GUEST_STORAGE_KEY, String(finalScore));
      }
    } else if (currentSessionId) {
      // Authenticated score submission to server
      try {
        setIsSubmittingScore(true);
        await api.post('/snake/finish', {
          session_id: currentSessionId,
          score: finalScore,
          apples_eaten: finalApples,
          moves_count: finalMoves,
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['snake-stats'] });
        queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      } catch {
        // Backend verification or conflict handled silently
      } finally {
        setIsSubmittingScore(false);
      }
    }
  }, [score, applesEaten, sessionId, user, guestHighScore, playTone, queryClient, drawGame]);

  // Handle direction change safely (disallow immediate 180° turnaround)
  const changeDirection = useCallback((newDir: Direction) => {
    if (status === 'idle') {
      startGame(newDir);
      return;
    }
    if (status === 'paused') {
      setStatus('playing');
    }
    if (status !== 'playing' && status !== 'paused') return;
    if (!isOppositeDirection(dirRef.current, newDir)) {
      nextDirRef.current = newDir;
      drawGame(); // Immediately orient eyes/head
    }
  }, [status, startGame, drawGame]);

  // Main game tick
  const gameTick = useCallback(() => {
    if (status !== 'playing') return;

    dirRef.current = nextDirRef.current;
    const currentSnake = snakeRef.current;
    const head = currentSnake[0];
    const nextHead = getNextHead(head, dirRef.current);

    movesCountRef.current += 1;

    // 1. Wall collision
    if (checkWallCollision(nextHead, GRID_SIZE)) {
      handleGameOver();
      return;
    }

    // 2. Self collision (excluding the tail segment that will move)
    if (checkSelfCollision(nextHead, currentSnake)) {
      handleGameOver();
      return;
    }

    // 3. Move snake
    const newSnake = [nextHead, ...currentSnake];

    // Check if food eaten
    if (nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y) {
      playTone(550, 880, 0.08, 'sine');
      setApplesEaten((prev) => {
        const nextApples = prev + 1;
        setScore(calculateScore(nextApples));
        return nextApples;
      });
      foodRef.current = spawnFood(newSnake);
    } else {
      newSnake.pop(); // Remove tail
    }

    snakeRef.current = newSnake;
    drawGame(); // Redraw canvas every single movement tick
  }, [status, spawnFood, handleGameOver, playTone, drawGame]);

  // Game loop interval based on score
  useEffect(() => {
    if (status === 'playing') {
      const speed = calculateSpeed(applesEaten);
      gameLoopTimerRef.current = setInterval(gameTick, speed);
    }

    return () => {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
    };
  }, [status, applesEaten, gameTick]);

  // Redraw canvas on mount, status change, or theme toggle
  useEffect(() => {
    drawGame();

    const observer = new MutationObserver(() => {
      drawGame();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [drawGame, status]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using arrow keys / space in the active browser window
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
        }
      }

      // Check key and code for broad keyboard layout support (Arrow keys, WASD, and French ZQSD)
      const key = e.key;
      const code = e.code;

      if (
        key === 'ArrowUp' ||
        key === 'w' ||
        key === 'W' ||
        key === 'z' ||
        key === 'Z' ||
        code === 'ArrowUp' ||
        code === 'KeyW' ||
        code === 'KeyZ'
      ) {
        changeDirection('UP');
      } else if (
        key === 'ArrowDown' ||
        key === 's' ||
        key === 'S' ||
        code === 'ArrowDown' ||
        code === 'KeyS'
      ) {
        changeDirection('DOWN');
      } else if (
        key === 'ArrowLeft' ||
        key === 'a' ||
        key === 'A' ||
        key === 'q' ||
        key === 'Q' ||
        code === 'ArrowLeft' ||
        code === 'KeyA' ||
        code === 'KeyQ'
      ) {
        changeDirection('LEFT');
      } else if (
        key === 'ArrowRight' ||
        key === 'd' ||
        key === 'D' ||
        code === 'ArrowRight' ||
        code === 'KeyD'
      ) {
        changeDirection('RIGHT');
      } else if (key === ' ' || key === 'p' || key === 'P' || code === 'Space') {
        if (status === 'playing' || status === 'paused') {
          togglePause();
        } else if (status === 'idle' || status === 'game_over') {
          startGame();
        }
      } else if (key === 'Enter' && (status === 'idle' || status === 'game_over')) {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, changeDirection, togglePause, startGame]);

  // Touch Swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStartPos.current = null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white/95 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl text-left">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
              <Gamepad2 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t('snake.title', 'Terminal Reflexes: Snake Arena')}
            </h2>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              {user ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  {t('snake.verifiedMode', 'Verified User')}
                </span>
              ) : (
                <span className="text-zinc-500">
                  {t('snake.guestMode', 'Guest Play')}
                </span>
              )}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('snake.subtitle', 'Sharpen your reaction speed between coding challenges. Fully playable before and after login.')}
          </p>
        </div>

        {/* Action controls / Mute toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-violet-500" />}
          </button>
        </div>
      </div>

      {/* Guest Import Banner if user logged in and has local guest score */}
      {user && guestHighScore > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-violet-900 dark:text-violet-200">
            <Info className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <span>
              {t('snake.guestImportPrompt', {
                score: guestHighScore,
                defaultValue: `You have an unlinked guest score of ${guestHighScore} pts. Would you like to import it to your profile as an unverified record?`,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmittingScore}
              onClick={handleImportGuestScore}
            >
              {t('snake.importRecord', 'Import Record')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem(GUEST_STORAGE_KEY);
                setGuestHighScore(0);
              }}
            >
              {t('common.dismiss', 'Dismiss')}
            </Button>
          </div>
        </div>
      )}

      {importNotice && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Main Game Arena Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
        {/* Canvas Display Column (Left / 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner bg-zinc-950"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-full block"
              aria-label="CodeArena Snake Game Canvas"
            />

            {/* Overlay: Idle State */}
            {status === 'idle' && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mb-3">
                  <Play className="w-6 h-6 text-violet-400 ml-0.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {t('snake.readyTitle', 'Ready to test your reflexes?')}
                </h3>
                <p className="text-xs text-zinc-400 mb-5 max-w-xs">
                  {t('snake.readyDesc', 'Use Arrow Keys, WASD, or the on-screen buttons below.')}
                </p>
                <Button variant="primary" size="md" onClick={() => startGame()}>
                  {t('snake.startGame', 'Start Game')}
                </Button>
              </div>
            )}

            {/* Overlay: Paused State */}
            {status === 'paused' && (
              <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
                  <Pause className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {t('snake.paused', 'Game Paused')}
                </h3>
                <p className="text-xs text-zinc-400 mb-5">
                  {t('snake.resumePrompt', 'Press Space or Resume to continue')}
                </p>
                <Button variant="primary" size="md" onClick={togglePause}>
                  {t('snake.resumeGame', 'Resume')}
                </Button>
              </div>
            )}

            {/* Overlay: Game Over State */}
            {status === 'game_over' && (
              <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-2">
                  <Flame className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {t('snake.gameOver', 'Game Over')}
                </h3>
                <div className="flex items-center gap-4 my-3 text-xs">
                  <div className="text-center">
                    <span className="text-zinc-400 block text-[10px]">{t('snake.finalScore', 'Score')}</span>
                    <span className="text-lg font-bold font-mono text-violet-400">{score}</span>
                  </div>
                  <div className="h-6 w-px bg-zinc-700" />
                  <div className="text-center">
                    <span className="text-zinc-400 block text-[10px]">{t('snake.apples', 'Apples')}</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{applesEaten}</span>
                  </div>
                </div>

                {score > 0 && score >= activeBestScore && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('snake.newBest', 'New Personal Best!')}</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => startGame()}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  {t('snake.playAgain', 'Play Again')}
                </Button>
              </div>
            )}
          </div>

          {/* On-Screen Mobile D-Pad Controls (Accessible & Touch friendly) */}
          <div className="mt-4 flex flex-col items-center gap-1.5 select-none sm:hidden">
            <button
              type="button"
              onClick={() => changeDirection('UP')}
              aria-label="Move Up"
              className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-violet-600 active:text-white transition-colors"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => changeDirection('LEFT')}
                aria-label="Move Left"
                className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-violet-600 active:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => changeDirection('RIGHT')}
                aria-label="Move Right"
                className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-violet-600 active:text-white transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => changeDirection('DOWN')}
              aria-label="Move Down"
              className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-violet-600 active:text-white transition-colors"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard & Scoreboard Column (Right / 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Game Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {t('snake.currentScore', 'Current Score')}
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {score}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {applesEaten} {t('snake.applesEaten', 'apples')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{t('snake.personalBest', 'Personal Best')}</span>
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400">
                {activeBestScore}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                {user ? t('snake.verifiedServer', 'Verified Account') : t('snake.localSession', 'Browser Local')}
              </div>
            </div>
          </div>

          {/* Authenticated Persistent Stats */}
          {user && authStats && (
            <div className="p-4 rounded-xl bg-violet-50/50 dark:bg-zinc-950/40 border border-violet-100 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span>{t('snake.arcadeStats', 'Your Arcade Stats')}</span>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                  {authStats.total_games} {t('snake.gamesPlayed', 'games')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-500 block">{t('snake.cumulativeScore', 'Total Score')}</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {authStats.cumulative_score.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">{t('snake.averageScore', 'Average')}</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {authStats.average_score}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Controls Info */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <span>{t('snake.controlsTitle', 'Controls & Keybindings')}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">WASD</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Arrows</kbd>
                <span className="ml-1 text-zinc-500">{t('snake.steer', 'Steer')}</span>
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Space</kbd>
                <span className="ml-1 text-zinc-500">{t('snake.pause', 'Pause')}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Play, Pause, Restart) */}
          <div className="flex items-center gap-2 pt-1">
            {status === 'playing' ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={togglePause}
                leftIcon={<Pause className="w-3.5 h-3.5" />}
              >
                {t('snake.pause', 'Pause')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={startGame}
                leftIcon={status === 'game_over' ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {status === 'game_over'
                  ? t('snake.restart', 'Restart')
                  : status === 'paused'
                  ? t('snake.resume', 'Resume')
                  : t('snake.play', 'Play Now')}
              </Button>
            )}

            {status !== 'idle' && (
              <Button
                variant="outline"
                size="sm"
                onClick={startGame}
                aria-label="Restart Game"
                title={t('snake.restart', 'Restart')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
