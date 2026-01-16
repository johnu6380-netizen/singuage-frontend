import { useRef, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  spin: number;
}

const Premium = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Server-backed premium count (authoritative). Fetch on mount; fallback to 6011.
  const [premiumCount, setPremiumCount] = useState<number>(6011);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/premium-count', { signal: controller.signal });
        if (!res.ok) throw new Error('fetch failed');
        const body = await res.json();
        if (mounted && body && typeof body.count === 'number') {
          setPremiumCount(body.count);
        }
      } catch (e) {
        // keep baseline on error
        if (mounted) setPremiumCount(6011);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Keep canvas sized correctly for devicePixelRatio and on resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      // Reset transform and scale to avoid cumulative scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Clear any previous drawing so scaled canvas doesn't show artifacts
      ctx.clearRect(0, 0, cssW, cssH);
    };

    window.addEventListener('resize', handleResize);
    // initialize on mount
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      // cleanup any pending animation or timeout
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any running animation before starting a new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth; // css pixels
    const h = window.innerHeight; // css pixels

    // Set high-DPI backing store and CSS size
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ['#f59e0b', '#fbbf24', '#facc15', '#fde68a', '#fef3c7'];
    const particles: Particle[] = [];

    // Reduce particle count on smaller screens
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 100 : 200;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        // start around middle (40% - 60%)
        y: Math.random() * (h * 0.2) + h * 0.4,
        vx: (Math.random() - 0.5) * 20,
        vy: Math.random() * -12 - 4,
        size: Math.random() * 10 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
      });
    }

    let last = performance.now();
    const duration = 2500; // ms
    const start = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Clear using CSS pixel dimensions
      ctx.clearRect(0, 0, w, h);

      const t = now - start;
      particles.forEach((p) => {
        p.vy += 0.3 * (dt / 16); // gravity
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.rot += p.spin * (dt / 16);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (t < duration) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        // simple fade-out delay then clear canvas and cleanup refs
        timeoutRef.current = window.setTimeout(() => {
          ctx.clearRect(0, 0, w, h);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          timeoutRef.current = null;
        }, 400) as unknown as number;
      }
    };

    // start animation
    animationRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="rounded-full bg-yellow-100 p-6 text-yellow-500">
          <Star className="h-12 w-12" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('pages.premium.title')}</h1>

        <div className="space-y-4 text-center text-gray-700 dark:text-gray-300">
          <p className="font-medium">{t('pages.premium.subtitle')}</p>
          <h3 className="font-medium mt-2">{t('pages.premium.benefits_heading')}</h3>
          <ul className="list-inside list-disc">
            <li>{t('pages.premium.benefits.1')}</li>
            <li>{t('pages.premium.benefits.2')}</li>
            <li>{t('pages.premium.benefits.3')}</li>
          </ul>

          {/* Added sub-header */}
          <h2 className="mt-4 text-lg font-semibold text-black dark:text-white">{t('pages.premium.message_heading', 'A message from Singuage:')}</h2>

          <p className="mt-4">{t('pages.premium.message')}</p>

          {/* New dynamic social proof line (i18n key) */}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('pages.premium.social_proof', {
              count: premiumCount,
              defaultValue: `${premiumCount.toLocaleString()} other people are taking their learning to the next level!`,
            })}
          </p>
        </div>

        {/* Celebrate button */}
        <div className="w-full max-w-xs mt-6">
          <button
            onClick={launchConfetti}
            className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-bold transition-colors shadow-lg"
          >
            {t('pages.premium.celebrate_button', 'Congratulations!')}
          </button>
        </div>
      </div>

      {/* Fullscreen canvas for confetti */}
      <canvas ref={canvasRef} style={{ position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 999 }} />
    </div>
  );
};

export default Premium;
