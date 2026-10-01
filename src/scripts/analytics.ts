/**
 * Measurement layer for the site — Umami custom events. A separate module
 * from portfolio.ts (behavior) on purpose: this one only measures, never
 * animates or mutates layout.
 *
 * Everything guards on `window.umami?.track`, so it's a silent no-op in dev
 * or when the script is blocked. Same lifecycle discipline as portfolio.ts:
 * (re)initialised on `astro:page-load`, torn down on `astro:before-swap`, so
 * nothing leaks or double-fires across a view-transition swap.
 */

type Cleanup = () => void;
let teardown: Cleanup[] = [];

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;
const HOVER_MS = 600;
const LABEL_MAX = 60;

function track(name: string, data?: Record<string, unknown>): void {
  window.umami?.track(name, data);
}

function trimLabel(text: string | null | undefined): string {
  return (text ?? '').trim().replace(/\s+/g, ' ').slice(0, LABEL_MAX);
}

// ---- Scroll depth: 25/50/75/100%, once per milestone per page view --------
function initScrollDepth(): void {
  const path = location.pathname;
  const seen = new Set<number>();
  let ticking = false;

  const check = (): void => {
    ticking = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    if (scrollable <= 0) return;
    const pct = (window.scrollY / scrollable) * 100;
    for (const milestone of SCROLL_MILESTONES) {
      if (pct >= milestone && !seen.has(milestone)) {
        seen.add(milestone);
        track('scroll-depth', { path, depth: milestone });
      }
    }
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(check);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  teardown.push(() => window.removeEventListener('scroll', onScroll));
  check(); // covers a page short enough to already be past a milestone on load
}

// ---- Section views: homepage `section[id]`s, ≥50% visible, once each ------
function initSectionViews(): void {
  const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
  if (!sections.length) return;
  const seen = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (entry.intersectionRatio >= 0.5 && id && !seen.has(id)) {
          seen.add(id);
          track('section-view', { id });
        }
      }
    },
    { root: null, threshold: [0.5] },
  );
  sections.forEach((section) => observer.observe(section));
  teardown.push(() => observer.disconnect());
}

// ---- Article read: reached the bottom of a guide/blog `<article>` ---------
// A scroll check, not IntersectionObserver: for an article taller than the
// viewport (the common case) its intersection ratio never reaches 1, so a
// threshold-based observer never fires again after the initial callback.
function initArticleRead(): void {
  const article = document.querySelector('article');
  if (!article) return;
  const path = location.pathname;
  let done = false;
  let ticking = false;

  const check = (): void => {
    ticking = false;
    if (done) return;
    if (article.getBoundingClientRect().bottom <= window.innerHeight + 2) {
      done = true;
      track('article-read', { path });
      window.removeEventListener('scroll', onScroll);
    }
  };

  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(check);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  teardown.push(() => window.removeEventListener('scroll', onScroll));
  check(); // covers an article short enough to already show its end on load
}

// ---- Delegated clicks: nav links, email, resume download, outbound --------
function initClicks(): void {
  const onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;

    const navLink = target.closest<HTMLAnchorElement>('[data-nav-link]');
    if (navLink) track('nav-click', { label: trimLabel(navLink.textContent) });

    const link = target.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') ?? '';

    if (href.startsWith('mailto:')) {
      track('email-click');
      return;
    }
    if (/\/johannes-krumm-resume\.pdf$/.test(href)) {
      track('resume-download');
      return;
    }
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) {
        track('outbound', { url: url.href, label: trimLabel(link.textContent) });
      }
    } catch {
      /* malformed href (e.g. `javascript:`) — ignore */
    }
  };

  document.addEventListener('click', onClick);
  teardown.push(() => document.removeEventListener('click', onClick));
}

// ---- Details opened: capture-phase `toggle`, works for any <details> ------
function initDetailsOpen(): void {
  const onToggle = (e: Event): void => {
    const details = e.target as HTMLElement;
    if (details.tagName !== 'DETAILS' || !(details as HTMLDetailsElement).open) return;
    const summary = details.querySelector('summary');
    const name = trimLabel(details.dataset.track ?? summary?.textContent);
    track('details-open', { name });
  };
  document.addEventListener('toggle', onToggle, true);
  teardown.push(() => document.removeEventListener('toggle', onToggle, true));
}

// ---- Preview hover: `[data-track-hover="<id>"]`, dwell ≥600ms -------------
function initPreviewHover(): void {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-track-hover]')];
  if (!targets.length) return;
  const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

  const onEnter = (e: PointerEvent): void => {
    const el = e.currentTarget as HTMLElement;
    const id = el.dataset.trackHover;
    if (!id) return;
    timers.set(
      el,
      setTimeout(() => track('preview-hover', { id }), HOVER_MS),
    );
  };
  const onLeave = (e: PointerEvent): void => {
    const el = e.currentTarget as HTMLElement;
    const timer = timers.get(el);
    if (timer) clearTimeout(timer);
  };

  targets.forEach((el) => {
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
  });
  teardown.push(() => {
    targets.forEach((el) => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      const timer = timers.get(el);
      if (timer) clearTimeout(timer);
    });
  });
}

// ---- Theme change: BaseLayout's inline script dispatches `themechange` ----
function initThemeChange(): void {
  const onThemeChange = (e: Event): void => {
    track('theme-change', { theme: (e as CustomEvent<string>).detail });
  };
  window.addEventListener('themechange', onThemeChange);
  teardown.push(() => window.removeEventListener('themechange', onThemeChange));
}

// ---- Contact form submit ----------------------------------------------------
function initContactSubmit(): void {
  const form = document.querySelector<HTMLFormElement>('#contact form');
  if (!form) return;
  const onSubmit = (): void => track('contact-submit');
  form.addEventListener('submit', onSubmit);
  teardown.push(() => form.removeEventListener('submit', onSubmit));
}

function init(): void {
  initScrollDepth();
  initSectionViews();
  initArticleRead();
  initClicks();
  initDetailsOpen();
  initPreviewHover();
  initThemeChange();
  initContactSubmit();
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

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
