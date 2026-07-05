import { animate, inView, scroll } from 'motion';

/**
 * Behavior layer for the portfolio scroll stage:
 *   - replayable Motion reveals (scoped to the #jk-scroll container)
 *   - active-section tracking → bottom-bar dots
 *   - scroll-linked progress line
 *   - live Munich clock
 *
 * Everything is (re)initialised on `astro:page-load` and torn down on
 * `astro:before-swap`, so it survives client-side navigation without leaking
 * observers, timers or animations.
 */

type Cleanup = () => void;
let teardown: Cleanup[] = [];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(): void {
  const scroller = document.getElementById('jk-scroll');
  if (!scroller) return;

  // ---- Reveals (Motion, rooted in the scroll container) --------------------
  // Each element reveals once and stays put. The design originally called for
  // replay-on-re-entry, but on this scroll-snapped, full-viewport layout that
  // meant content faded/slid out and back in at every section boundary — heavy
  // double-motion that read as jank and left content displaced (translateY) when
  // a section was snapped mid-animation. Playing once keeps motion smooth and
  // lets content settle at its true centred position.
  if (!prefersReducedMotion()) {
    const MAX_STAGGER = 220; // cap so the last element never lags far behind
    const stopReveals = inView(
      '.reveal',
      (el) => {
        const target = el as HTMLElement;
        if (target.dataset.revealed) return; // guard: inView re-fires on re-entry
        target.dataset.revealed = '1';
        const delay = Math.min(Number(target.dataset.delay ?? 0), MAX_STAGGER) / 1000;
        animate(
          target,
          { opacity: [0, 1], y: [14, 0] },
          { duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] },
        );
      },
      { root: scroller, amount: 0.2 },
    );
    teardown.push(stopReveals);
  }

  // ---- Active-section → bottom-bar dots -------------------------------------
  const sections = [...scroller.querySelectorAll<HTMLElement>('[data-section]')];
  const dots = [...document.querySelectorAll<HTMLElement>('[data-dot]')];
  const ratios = new Map<Element, number>();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
      let best: HTMLElement | null = null;
      let bestRatio = -1;
      for (const section of sections) {
        const ratio = ratios.get(section) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = section;
        }
      }
      if (!best) return;
      const activeIndex = sections.indexOf(best);
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
    },
    { root: scroller, threshold: [0.12, 0.3, 0.5, 0.75] },
  );
  sections.forEach((section) => sectionObserver.observe(section));
  teardown.push(() => sectionObserver.disconnect());

  // ---- Scroll-linked progress line (scaleX 0 → 1) --------------------------
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  if (progress) {
    const stopScroll = scroll(
      (value: number) => {
        progress.style.transform = `scaleX(${value})`;
      },
      { container: scroller },
    );
    teardown.push(stopScroll);
  }

  // ---- Live Munich clock ---------------------------------------------------
  const clocks = [...document.querySelectorAll<HTMLElement>('[data-clock]')];
  if (clocks.length) {
    const tick = () => {
      let time: string;
      try {
        time = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Europe/Berlin',
          hour12: false,
        });
      } catch {
        time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      }
      for (const clock of clocks) clock.textContent = time;
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    teardown.push(() => window.clearInterval(timer));
  }
}

function cleanup(): void {
  for (const fn of teardown) {
    try {
      fn();
    } catch {
      /* best-effort teardown */
    }
  }
  teardown = [];
}

document.documentElement.classList.add('js');
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
