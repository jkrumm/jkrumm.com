import { animate, inView } from 'motion';

/**
 * Behavior layer for the site. Two things only:
 *   - scroll reveals (Motion `inView`, once per element)
 *   - scroll-spy → `aria-current` on the sidebar nav links
 *
 * The page uses DOCUMENT scroll — there is no inner scroll container, so every
 * observer is rooted at the viewport (`root: null` / no `root` option).
 *
 * Everything is (re)initialised on `astro:page-load` and torn down on
 * `astro:before-swap`, so it survives client-side navigation without leaking
 * observers or animations. Each behavior no-ops when its own targets are
 * absent, so the script is harmless on article and index pages.
 */

type Cleanup = () => void;
let teardown: Cleanup[] = [];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(): void {
  // ---- Reveals (Motion, viewport-rooted) -----------------------------------
  // Each element reveals once and stays put. Replay-on-re-entry was tried and
  // deliberately removed: re-animating on every boundary crossing read as jank
  // and could leave content displaced (translateY) mid-animation. Playing once
  // keeps motion smooth and lets content settle at its true position.
  // The 8px travel must stay in sync with `html.js .reveal` in global.css —
  // that rule paints the hidden start state, this animates out of it.
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
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] },
        );
      },
      { amount: 0.2 },
    );
    teardown.push(stopReveals);
  }

  // ---- Scroll-spy: active section → sidebar nav ----------------------------
  // Hand-rolled IntersectionObserver rather than Motion's `inView`, because it
  // needs MULTIPLE thresholds: with several sections partly on screen at once,
  // "active" is the one with the highest intersectionRatio, and that comparison
  // is only possible if every section reports its ratio at several crossings.
  // `inView` is a binary enter/leave callback and can't express that.
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]')];
  if (!sections.length) return;

  let activeIndex = -1;

  const setActive = (index: number): void => {
    activeIndex = index;
    const id = sections[index]?.id;
    for (const link of navLinks) {
      if (id && link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };

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
      const index = sections.indexOf(best);
      if (index !== activeIndex) setActive(index);
    },
    { root: null, threshold: [0.12, 0.3, 0.5, 0.75] },
  );
  sections.forEach((section) => sectionObserver.observe(section));
  teardown.push(() => sectionObserver.disconnect());

  // Set the initial state synchronously (before the observer's first callback)
  // so there is no flash of "no active section" on load.
  setActive(0);
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
