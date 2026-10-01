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
 *
 * Scroll-spy is generic: it drives every `a[data-nav-link]` whose `href="#…"`
 * resolves to an element on the page, so the SAME implementation lights up
 * the homepage's section nav and an article's table-of-contents headings in
 * the Sidebar rail. There is no separate per-surface implementation.
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

  // ---- Scroll-spy: active heading → nav link --------------------------------
  // The nav links are the source of truth for what to observe (not a
  // `[data-section]` marker), so the same code drives both the homepage's
  // section nav and an article's h2/h3 table of contents.
  //
  // Active = the LAST target whose top has crossed a line near the top of the
  // viewport, in document order — not "highest intersection ratio". Ratio
  // comparison breaks on article headings, where a section can run far taller
  // than the viewport and never report a high ratio. Top-crossing naturally
  // gives "the last one wins" once the page is scrolled past every heading,
  // because every target's top has crossed by then and the last in document
  // order is picked.
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]')];
  const targets = navLinks
    .map((link) => {
      const href = link.getAttribute('href') ?? '';
      const target = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
      return target ? { link, target } : null;
    })
    .filter((entry): entry is { link: HTMLAnchorElement; target: HTMLElement } => entry !== null);
  if (!targets.length) return;

  const LINE = 0.2; // 20% down the viewport — "a line near the top"
  let activeTarget: HTMLElement | null = null;
  let atBottom = false;

  const recompute = (): void => {
    const lineY = window.innerHeight * LINE;
    let next: HTMLElement | null = null;
    for (const { target } of targets) {
      if (target.getBoundingClientRect().top <= lineY) next = target;
    }
    // Before the first heading has crossed the line, keep the first one
    // active rather than showing no active state at all.
    next ??= targets[0]?.target ?? null;
    if (atBottom) next = targets.at(-1)?.target ?? next;
    if (next === activeTarget) return;
    activeTarget = next;
    for (const { link, target } of targets) {
      if (target === activeTarget) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };

  // Fire exactly when a target's top crosses the line: the root is shrunk to
  // the band above it, so entering/leaving that band IS the crossing. Ratio
  // thresholds on the full viewport miss short targets (an h2 sits at ratio 1
  // the whole time it moves past the line).
  const spyObserver = new IntersectionObserver(recompute, {
    root: null,
    rootMargin: `0px 0px -${(1 - LINE) * 100}% 0px`,
    threshold: 0,
  });
  targets.forEach(({ target }) => spyObserver.observe(target));
  teardown.push(() => spyObserver.disconnect());

  // A last target too close to the page end never reaches the line — once the
  // document bottom is in view, it wins.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.height = '1px';
  document.body.append(sentinel);
  const bottomObserver = new IntersectionObserver(([entry]) => {
    atBottom = entry?.isIntersecting ?? false;
    recompute();
  });
  bottomObserver.observe(sentinel);
  teardown.push(() => {
    bottomObserver.disconnect();
    sentinel.remove();
  });

  // Set the initial state synchronously (before the observer's first callback)
  // so there is no flash of "no active section" on load.
  recompute();
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
