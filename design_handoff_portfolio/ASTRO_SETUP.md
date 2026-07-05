# Astro Setup — recommended stack & starter code

Researched current as of **mid-2026**. This design maps almost 1:1 onto Astro because it's already plain HTML + inline styles + a small vanilla-JS behavior layer. You do **not** need React/Vue.

## TL;DR recommendation

- **Framework:** Astro 6 (latest), no UI-framework integration needed — the whole page is static HTML + one client script.
- **Page transitions:** Astro's **`<ClientRouter />`** (from `astro:transitions`; this is the renamed `<ViewTransitions />`). It's powered by the native **View Transitions API**, adds ~no JS, and auto-handles `prefers-reduced-motion` and browser fallback. This gives you the "entire UI transitions" feel between the homepage and any sub-pages (`/blog`, `/resume`, `/photos`).
- **Scroll reveals:** keep the **IntersectionObserver** approach from the prototype, but wire init to the **`astro:page-load`** lifecycle event (and clean up on `astro:before-swap`) so it survives client-side navigation. This is the resilient, no-dependency pattern.
- **Fonts:** self-host with **`@fontsource/jetbrains-mono`** and **`@fontsource/nunito-sans`** (faster + no layout shift vs. Google CDN).
- **Styling:** the design uses only inline styles + 3 global rules. You can keep inline styles, or lift the repeated bits into a `global.css` with CSS custom properties (tokens). Tailwind is optional and not required.

### When to reach for a motion library
- **Not needed** for this design's reveals/transitions — native + IO covers it.
- If you later want **richer, JS-driven** stagger/spring/scroll-scrubbing: add **Motion** (`motion` / motion.dev) — small, modern API: `animate`, `stagger`, `inView`, `scroll`.
- If you go **heavy/creative** (scroll-scrubbed timelines, FLIP, WebGL): **GSAP + ScrollTrigger + Lenis** (smooth scroll). Overkill here; note it for future.
- **AstroAnimate** (2026) is a newer Astro-native component wrapper for reveals/entries — nice DX if you want declarative `<Reveal>`-style components, but the hand-rolled IO below is zero-dependency and fully in your control.

---

## Scaffold

```bash
npm create astro@latest johannes-portfolio -- --template minimal --typescript strict
cd johannes-portfolio
npm i @fontsource/jetbrains-mono @fontsource/nunito-sans
# optional, only if you add JS-driven motion later:
# npm i motion
npm run dev
```

Suggested structure:

```
src/
  layouts/BaseLayout.astro      # <head>, fonts, ClientRouter, global tokens, bars
  pages/index.astro             # the homepage (sections)
  components/
    TopBar.astro
    BottomBar.astro
    sections/Home.astro
    sections/Writing.astro
    sections/Experience.astro
    sections/Stack.astro
    sections/Projects.astro
    sections/Photography.astro
    sections/Contact.astro
    Plus.astro                  # the "+" corner mark, reused everywhere
    Cell.astro                  # a bento cell wrapper (bg + relative + 2 Plus marks)
  scripts/portfolio.js          # IntersectionObserver reveals + active section + clock + progress
  styles/global.css             # tokens + reveal states + resets
  data/                         # articles.ts, roles.ts, stack.ts, photos.ts  (replace placeholders)
```

Split each prototype `<section>` into its own `.astro` component and feed it from a typed data file in `src/data/` so content edits never touch layout.

---

## `src/styles/global.css`

Lift the design tokens to custom properties and define the reveal states here (the one thing worth centralizing):

```css
:root {
  --bg:#EFEEEB; --panel:#F4F2EF; --panel-hover:#FBFAF8;
  --line:#D6D3D1; --hairline:#E4E0DB;
  --ink:#1c1917; --ink-2:#57534e; --muted:#78716C; --faint:#a8a29e;
  --accent:#2F5BFF; --accent-hover:#244cf0; --dot-idle:#cfcac4;
  --mono:'JetBrains Mono',ui-monospace,monospace;
  --sans:'Nunito Sans',system-ui,sans-serif;
}
*{box-sizing:border-box;}
html,body{margin:0;height:100%;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
a{color:inherit;}
#jk-scroll{scrollbar-width:none;}
#jk-scroll::-webkit-scrollbar{width:0;height:0;}

/* scroll-reveal state (progressive enhancement: visible by default, JS opts in to hidden) */
.js .reveal{opacity:0;transform:translateY(20px);
  transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);}
.reveal.is-visible{opacity:1;transform:none;}

@media (prefers-reduced-motion: reduce){
  .reveal, .js .reveal{opacity:1 !important;transform:none !important;transition:none !important;}
}
```

> Note the `.js` guard: add `document.documentElement.classList.add('js')` at the top of your script so content is never stuck hidden if JS fails.

In the prototype the reveal styles are inline; moving them to `.reveal` / `.is-visible` classes is the one refactor that pays off. Everything else can stay inline.

---

## `src/layouts/BaseLayout.astro`

```astro
---
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/600.css';
import '@fontsource/nunito-sans/700.css';
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
const { title = 'Johannes Krumm — Tech Lead & Senior Full-Stack Developer' } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <ClientRouter />
  </head>
  <body>
    <slot />
    <script>
      import '../scripts/portfolio.js';
    </script>
  </body>
</html>
```

For **native cross-document** transitions instead of the router (even lighter, no JS shim), drop `<ClientRouter />` and add `@view-transition { navigation: auto; }` to `global.css` — both pages must share the rule. The `<ClientRouter />` route is recommended here because it gives you the `astro:page-load` hooks the reveal script relies on.

---

## `src/scripts/portfolio.js`

This is the prototype's behavior layer, adapted to Astro's lifecycle (re-inits on every navigation, cleans up observers to avoid leaks):

```js
let ro, so, clockTimer, scroller, onScroll;

function initPortfolio() {
  document.documentElement.classList.add('js');
  cleanup(); // idempotent across navigations

  scroller = document.getElementById('jk-scroll');
  if (!scroller) return;

  const show = (el) => {
    el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
    el.classList.add('is-visible');
  };
  const hide = (el) => { el.style.transitionDelay = '0ms'; el.classList.remove('is-visible'); };

  const revs = [...scroller.querySelectorAll('.reveal')];
  const secs = [...scroller.querySelectorAll('[data-section]')];

  // replayable reveals
  ro = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio > 0.1) show(e.target);
      else if (e.intersectionRatio === 0) hide(e.target);
    });
  }, { root: scroller, threshold: [0, 0.12] });
  revs.forEach((el) => ro.observe(el));

  // active-section → top label + footer dots
  const ratios = new Map();
  so = new IntersectionObserver((entries) => {
    entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
    let best = null, br = -1;
    secs.forEach((s) => { const r = ratios.get(s) || 0; if (r > br) { br = r; best = s; } });
    if (!best) return;
    const idx = secs.indexOf(best);
    const label = document.querySelector('[data-active-label]');
    if (label) label.textContent = (best.dataset.name || '').toUpperCase();
    document.querySelectorAll('[data-dot]').forEach((d) => {
      const on = +d.dataset.dot === idx;
      d.style.background = on ? 'var(--accent)' : 'var(--dot-idle)';
      d.style.width = on ? '22px' : '10px';
    });
  }, { root: scroller, threshold: [0.12, 0.3, 0.5, 0.75] });
  secs.forEach((s) => so.observe(s));

  // progress line
  const bar = document.querySelector('[data-progress]');
  onScroll = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (scroller.scrollTop / max) * 100 : 0) + '%';
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Munich clock
  const tick = () => {
    let t;
    try { t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Berlin', hour12: false }); }
    catch { t = new Date().toLocaleTimeString('en-GB', { hour12: false }); }
    document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = t));
  };
  tick();
  clockTimer = setInterval(tick, 1000);
}

function cleanup() {
  ro?.disconnect(); so?.disconnect();
  clearInterval(clockTimer);
  if (scroller && onScroll) scroller.removeEventListener('scroll', onScroll);
}

document.addEventListener('astro:page-load', initPortfolio);
document.addEventListener('astro:before-swap', cleanup);
```

Mark elements with `class="reveal"` + optional `data-delay="120"`; sections with `data-section data-name="Writing"`; top-bar label `[data-active-label]`; progress line `[data-progress]`; footer dots `[data-dot="0..6"]`. (These are the same hooks already in the prototype markup — just swap the inline `data-reveal` for the `reveal` class.)

---

## Migration checklist
1. Scaffold Astro, install fontsource packages, add `BaseLayout.astro` + `global.css` + `portfolio.js`.
2. Paste the prototype markup into `index.astro`, then extract each `<section>` into `components/sections/*.astro`. Extract the repeated `<i>+</i>` into `Plus.astro` and the cell wrapper into `Cell.astro`.
3. Replace inline reveal styles with `class="reveal"` (+ `data-delay`); leave all other inline styles as-is.
4. Move placeholder content into `src/data/*.ts` and loop with `.map()`.
5. Swap striped placeholders for `<Image>` (hero portrait + photography tiles).
6. Build `/blog`, `/resume`, `/photos` pages using the same `BaseLayout` so `<ClientRouter />` transitions between them; point the stub hrefs at them.
7. Verify `prefers-reduced-motion` disables motion; run Lighthouse.

## Sources (for the developer)
- Astro View Transitions / `<ClientRouter />` — docs.astro.build/en/guides/view-transitions
- Zero-JS native view transitions — astro.build/blog/future-of-astro-zero-js-view-transitions
- Scroll reveal + `astro:page-load` pattern — the IntersectionObserver-on-lifecycle approach
- Motion (motion.dev) `animate`/`stagger`/`inView`; GSAP + ScrollTrigger + Lenis for heavy creative work
