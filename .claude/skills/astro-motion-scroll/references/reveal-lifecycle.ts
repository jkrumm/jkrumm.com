/**
 * Reveal + behavior lifecycle under Astro <ClientRouter />.
 * ----------------------------------------------------------------------------
 * Distilled from the WORKING pattern in this repo: src/scripts/portfolio.ts.
 * This is the reference shape for ANY scroll/animation behavior on the site.
 *
 * The one rule the whole stack hangs on:
 *   With <ClientRouter />, module scripts run ONCE. IntersectionObserver
 *   observers and Motion inView/scroll callbacks set up at import time are lost
 *   on the next soft-swap navigation. So we (re)initialise on `astro:page-load`
 *   and tear everything down on `astro:before-swap`. Every side effect pushes a
 *   cleanup fn onto `teardown`; cleanup() drains it. No leaks, no double-binding.
 *
 * The second rule: the page uses DOCUMENT scroll. There is no inner scroll
 * container — the old `#jk-scroll` is deleted — so observers take no `root` and
 * Motion `scroll()` takes no `container`. Passing one gives you an observer that
 * never fires, with no error.
 */

import { animate, inView, scroll } from 'motion';

type Cleanup = () => void;
let teardown: Cleanup[] = [];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(): void {
  // ---- Reveals: ONCE-ONLY, not replay ---------------------------------------
  // Replay-on-re-entry was removed: it faded content out/in at every section
  // boundary (double-motion jank) and left content displaced (translateY) when
  // re-triggering mid-scroll. Reveal once, let it settle at its true position.
  //
  // Hidden state is applied in CSS (`html.js .reveal`), NOT here — that avoids
  // FOUC. This code only animates FROM hidden TO shown. Motion writes inline
  // opacity/transform, which wins over the CSS hidden state. The 8px travel must
  // match `translateY(8px)` in global.css.
  if (!prefersReducedMotion()) {
    const MAX_STAGGER = 220; // ms cap so the last element never lags far behind
    const stopReveals = inView(
      '.reveal',
      (el) => {
        const target = el as HTMLElement;
        if (target.dataset.revealed) return; // guard: inView re-fires on re-entry
        target.dataset.revealed = '1';
        const delay =
          Math.min(Number(target.dataset.delay ?? 0), MAX_STAGGER) / 1000;
        animate(
          target,
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] },
        );
      },
      // No `root` — document scroll. (`root: null` is equivalent and explicit.)
      { amount: 0.2 },
    );
    // inView returns a stop() function — register it for teardown.
    teardown.push(stopReveals);
  }

  // ---- Scroll-linked value via Motion `scroll()` ----------------------------
  // NOTE: nothing on the site currently uses this — the only scroll-linked
  // effect is the CSS-only article progress line (`animation-timeline:
  // scroll(root block)`). Prefer CSS-only; reach for `scroll()` only for a
  // pinned/scrubbed section (SKILL.md §6). No `container` option: document
  // scroll is the default.
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  if (progress) {
    const stopScroll = scroll((value: number) => {
      // Animate transform only. scaleX(0..1) is compositor-friendly.
      progress.style.transform = `scaleX(${value})`;
    });
    teardown.push(stopScroll);
  }

  // ---- Plain IntersectionObserver (when you need raw threshold control) ------
  // Motion's inView is a thin IO wrapper; hand-roll IO only when you need custom
  // threshold arrays / rootMargin it doesn't expose — the scroll-spy does,
  // because "active" is the section with the highest intersectionRatio and that
  // comparison needs several crossings per section. Same rule: `root: null`, and
  // register disconnect() for teardown.
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  if (sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        // ... update active-section UI from entries ...
      },
      { root: null, threshold: [0.12, 0.3, 0.5, 0.75] },
    );
    sections.forEach((s) => io.observe(s));
    teardown.push(() => io.disconnect());
  }

  // ---- Timers, listeners, etc. all follow the same register-for-teardown rule.
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

// `.js` is added in the <head> inline script (BaseLayout.astro) BEFORE first
// paint so the CSS hidden state applies without FOUC. Adding it here too is a
// harmless belt-and-braces for non-swap loads.
document.documentElement.classList.add('js');
document.addEventListener('astro:page-load', init); // (re)init every navigation
document.addEventListener('astro:before-swap', cleanup); // tear down before swap
// Need to fix scroll position after a swap? Use `astro:after-swap`.
