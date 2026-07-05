import { animate, inView, scroll } from 'motion';

/**
 * Behavior layer for the portfolio scroll stage:
 *   - replayable Motion reveals (scoped to the #jk-scroll container)
 *   - active-section tracking → bottom-bar dots
 *   - scroll-linked progress line
 *
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

  // ---- Bottom navigation: input-aware section navigator --------------------
  // The pill row is ALWAYS shown. One active-section IntersectionObserver keeps
  // the active pill "open" (its label revealed) and the compact top-bar label
  // fresh, updating only when the active section actually changes. Interaction
  // splits by INPUT MODALITY, not screen size:
  //   • Mouse / pen (hover): hovering or focusing a pill opens it (preview) and
  //     closes the rest — one open at a time, gliding to the newly-active
  //     section on scroll; clicking navigates.
  //   • Touch (no hover): tapping the pill row opens an upward popover of every
  //     section (there is no hover to preview with); selecting one navigates.
  // Labels soft-refresh (fade in from a small rise). Transform + opacity only,
  // EXCEPT the pill `width` (a scoped, documented exception — collapse-to-dots +
  // reflow can't run on the compositor alone). Reduced motion → instant, no tweens.
  const sections = [...scroller.querySelectorAll<HTMLElement>('[data-section]')];
  const activeLabel = document.querySelector<HTMLElement>('[data-active-label]');
  const rmNav = prefersReducedMotion();

  // Soft text refresh: swap the label, then fade the new text in from a small
  // rise. The elements are flex items, so `y` (translateY) applies.
  const softSwap = (el: HTMLElement | null, text: string): void => {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (!rmNav) animate(el, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.24, ease: [0.2, 0.7, 0.2, 1] });
  };

  // The most recent pointer type lets a pill click distinguish a touch tap
  // (→ popover) from a mouse click (→ navigate). `pointerdown` fires with the
  // type before the click, so this is set in time. A keyboard-activated click
  // (Enter/Space) must still navigate even if the last pointer was touch, so
  // track that separately and clear it on any real pointer input.
  let lastPointerType = 'mouse';
  let keyActivating = false;
  const onPointerType = (e: PointerEvent): void => {
    lastPointerType = e.pointerType || 'mouse';
    keyActivating = false;
  };
  document.addEventListener('pointerdown', onPointerType, true);
  teardown.push(() => document.removeEventListener('pointerdown', onPointerType, true));

  // -- Pill row --------------------------------------------------------------
  const pillNav = document.querySelector<HTMLElement>('[data-pillnav]');
  const pillParts = pillNav
    ? [...pillNav.querySelectorAll<HTMLElement>('[data-pill]')].map((pill) => ({
        pill,
        reveal: pill.querySelector<HTMLElement>('.pill__reveal')!,
        label: pill.querySelector<HTMLElement>('.pill__label')!,
      }))
    : [];

  let activeIndex = 0;
  let openIndex = -1;
  let hoverIndex: number | null = null;

  // One duration + one symmetric ease for BOTH open and close, so a change of
  // the open pill reads as a single handoff — the closing label collapses in
  // exact lockstep with the opening one expanding, rather than two separate
  // motions. Smooth ease-in-out, no overshoot (a pop reads as a discrete event).
  const NAV_DUR = 0.4;
  const NAV_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

  const openPill = (i: number, animated: boolean): void => {
    const part = pillParts[i];
    if (!part) return;
    part.pill.classList.add('is-open');
    // Intrinsic width — the label is flex:none + nowrap, so offsetWidth is its
    // full content width even while the reveal wrapper clips it at width 0.
    const width = part.label.offsetWidth;
    if (!animated || rmNav) {
      part.reveal.style.width = `${width}px`;
      part.label.style.opacity = '1';
      return;
    }
    animate(part.reveal, { width: `${width}px` }, { duration: NAV_DUR, ease: NAV_EASE });
    animate(part.label, { opacity: 1 }, { duration: NAV_DUR, ease: NAV_EASE });
  };

  const closePill = (i: number, animated: boolean): void => {
    const part = pillParts[i];
    if (!part) return;
    part.pill.classList.remove('is-open');
    if (!animated || rmNav) {
      part.reveal.style.width = '0px';
      part.label.style.opacity = '0';
      return;
    }
    animate(part.reveal, { width: 0 }, { duration: NAV_DUR, ease: NAV_EASE });
    animate(part.label, { opacity: 0 }, { duration: NAV_DUR, ease: NAV_EASE });
  };

  // The open pill follows the hovered one, falling back to the active section.
  const resolveOpen = (animated: boolean): void => {
    const next = hoverIndex ?? activeIndex;
    if (next === openIndex) return;
    if (openIndex >= 0) closePill(openIndex, animated);
    openIndex = next;
    openPill(next, animated);
  };

  if (pillNav) {
    const onOver = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return; // touch has no hover-preview
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-pill]');
      if (!el) return;
      hoverIndex = Number(el.dataset.pill);
      resolveOpen(true);
    };
    const onLeave = (): void => {
      hoverIndex = null;
      resolveOpen(true);
    };
    const onFocusIn = (e: FocusEvent): void => {
      if (lastPointerType === 'touch') return; // a touch tap opens the popover, not a preview
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-pill]');
      if (!el) return;
      hoverIndex = Number(el.dataset.pill);
      resolveOpen(true);
    };
    const onFocusOut = (e: FocusEvent): void => {
      if (!pillNav.contains(e.relatedTarget as Node)) onLeave();
    };
    // Re-measure the open pill's label if a resize changed its intrinsic width.
    const onNavResize = (): void => {
      const part = pillParts[openIndex];
      if (part) part.reveal.style.width = `${part.label.offsetWidth}px`;
    };
    pillNav.addEventListener('pointerover', onOver);
    pillNav.addEventListener('pointerleave', onLeave);
    pillNav.addEventListener('focusin', onFocusIn);
    pillNav.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', onNavResize);
    teardown.push(() => {
      pillNav.removeEventListener('pointerover', onOver);
      pillNav.removeEventListener('pointerleave', onLeave);
      pillNav.removeEventListener('focusin', onFocusIn);
      pillNav.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', onNavResize);
    });
  }

  // -- Touch popover: tapping the pill row opens an upward menu of sections ---
  const panel = document.querySelector<HTMLElement>('[data-navpop]');
  const popItems = panel ? [...panel.querySelectorAll<HTMLElement>('[data-navpop-item]')] : [];

  if (panel && pillNav) {
    let menuOpen = false;

    const focusItem = (i: number): void => {
      if (i < 0) {
        pillParts[activeIndex]?.pill.focus(); // "up" past the first item → back to the row
        return;
      }
      (popItems[i] ?? popItems[0])?.focus();
    };

    const openMenu = (): void => {
      if (menuOpen) return;
      menuOpen = true;
      panel.removeAttribute('inert');
      pillNav.setAttribute('aria-expanded', 'true');
      if (rmNav) {
        panel.style.opacity = '1';
        panel.style.transform = 'none';
      } else {
        animate(panel, { opacity: [0, 1], y: [10, 0], scale: [0.96, 1] }, { duration: 0.34, ease: [0.2, 0.85, 0.25, 1] });
        popItems.forEach((it, i) =>
          animate(it, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, delay: 0.05 + i * 0.03, ease: [0.2, 0.7, 0.2, 1] }),
        );
      }
      // Deliberately DON'T move focus to the first item. The popover is
      // touch-only (keyboard navigates the pills directly and never opens it),
      // so a programmatic focus just paints an ugly ring/highlight on "Overview".
      // SR-on-touch users still reach the items by swiping — the panel isn't
      // inert while open.
    };

    const closeMenu = (returnFocus = false): void => {
      if (!menuOpen) return;
      menuOpen = false;
      panel.setAttribute('inert', '');
      pillNav.setAttribute('aria-expanded', 'false');
      if (rmNav) {
        panel.style.opacity = '0';
      } else {
        animate(panel, { opacity: 0, y: 8, scale: 0.98 }, { duration: 0.2, ease: [0.4, 0, 1, 1] });
      }
      if (returnFocus) pillParts[activeIndex]?.pill.focus();
    };

    // Touch tap on the pill row toggles the popover (there's no hover to preview
    // with). Mouse clicks and keyboard activation fall through to navigate.
    // NB: `click.detail` is NOT a reliable touch signal — it's 0 for
    // touch-synthesized clicks on some mobile browsers — so decide by the
    // tracked pointer type plus an explicit keyboard-activation flag.
    const onNavKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') keyActivating = true;
    };
    const onNavTap = (e: MouseEvent): void => {
      if (!keyActivating && lastPointerType === 'touch') {
        e.preventDefault();
        void (menuOpen ? closeMenu() : openMenu());
      }
      keyActivating = false;
    };
    const onPanelClick = (e: Event): void => {
      // Selecting an item lets the anchor navigate, then closes the menu.
      if ((e.target as HTMLElement).closest('[data-navpop-item]')) closeMenu();
    };
    const onPanelKey = (e: KeyboardEvent): void => {
      const idx = popItems.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusItem(Math.min(idx + 1, popItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusItem(idx <= 0 ? -1 : idx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusItem(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusItem(popItems.length - 1);
      }
    };
    const onDocKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && menuOpen) {
        e.preventDefault();
        closeMenu(true);
      }
    };
    const onDocPointer = (e: Event): void => {
      const t = e.target as Node;
      if (menuOpen && !panel.contains(t) && !pillNav.contains(t)) closeMenu();
    };

    pillNav.addEventListener('click', onNavTap);
    pillNav.addEventListener('keydown', onNavKeydown);
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('keydown', onPanelKey);
    document.addEventListener('keydown', onDocKey);
    document.addEventListener('pointerdown', onDocPointer);
    teardown.push(() => {
      pillNav.removeEventListener('click', onNavTap);
      pillNav.removeEventListener('keydown', onNavKeydown);
      panel.removeEventListener('click', onPanelClick);
      panel.removeEventListener('keydown', onPanelKey);
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('pointerdown', onDocPointer);
    });
  }

  // -- Fan-out: one call refreshes every surface on section change -----------
  const setActive = (index: number, animated: boolean): void => {
    activeIndex = index;
    const name = sections[index]?.dataset.name ?? '';
    pillParts.forEach((part, i) => {
      const on = i === index;
      part.pill.classList.toggle('is-active', on);
      part.pill.setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (hoverIndex === null) resolveOpen(animated); // don't fight an active hover
    popItems.forEach((item, i) => {
      const on = i === index;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-current', on ? 'true' : 'false');
    });
    softSwap(activeLabel, name);
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
      if (index !== activeIndex) setActive(index, true);
    },
    { root: scroller, threshold: [0.12, 0.3, 0.5, 0.75] },
  );
  sections.forEach((section) => sectionObserver.observe(section));
  teardown.push(() => sectionObserver.disconnect());

  // Set the initial state instantly (before the first scroll event) so the
  // active pill is open on load with no flash.
  setActive(0, false);

  // ---- Experience: sticky rail pinned under the bar → scrub roles + beam ----
  // .role-split is a wrapper taller than its sticky child, so scrolling through
  // the surplus height keeps the rail + pane PINNED (the page appears to "pause"
  // on Experience). We map scroll progress across that pinned runway 0→1 to:
  // active role index, accent highlight, detail crossfade, and the side-beam
  // fill. Continuous scroll-math — no IntersectionObserver thresholds, no
  // scroll-hijacking. Desktop + motion only; reduced-motion and <900px get the
  // plain stacked column (CSS), so the scrub never runs there.
  const roleSplit = scroller.querySelector<HTMLElement>('.role-split');
  const roleSticky = scroller.querySelector<HTMLElement>('.role-sticky');
  const roleRows = [...scroller.querySelectorAll<HTMLElement>('[data-role-row]')];
  const roleDetails = [...scroller.querySelectorAll<HTMLElement>('[data-role-detail]')];
  const roleBeam = scroller.querySelector<HTMLElement>('[data-role-beam-fill]');

  if (
    roleSplit &&
    roleSticky &&
    roleRows.length &&
    roleDetails.length &&
    window.matchMedia('(min-width: 900px)').matches &&
    !prefersReducedMotion()
  ) {
    // Per-role scroll distance as a fraction of the viewport — the ONE knob for
    // how long Experience "holds" the page. 0.5 = half a screen of scroll per role.
    const PER_ROLE_VH = 0.5;
    const STEPS = roleRows.length;
    let pinStart = 0;
    let track = 0;
    let activeRole = -1;

    const setActiveRole = (index: number, animated: boolean): void => {
      const prevIndex = activeRole;
      activeRole = index;
      roleRows.forEach((row, i) => row.classList.toggle('is-active', i === index));

      if (!animated) {
        roleDetails.forEach((d, i) => { d.style.opacity = i === index ? '1' : '0'; });
        return;
      }
      const prevDetail = roleDetails[prevIndex];
      const nextDetail = roleDetails[index];
      if (prevDetail && prevDetail !== nextDetail) {
        animate(prevDetail, { opacity: 0 }, { duration: 0.28, ease: [0.4, 0, 1, 1] });
      }
      animate(nextDetail, { opacity: [0, 1], y: [8, 0] }, { duration: 0.36, ease: [0.2, 0.7, 0.2, 1] });
    };

    const updateRole = (): void => {
      if (track <= 0) return;
      const raw = (scroller.scrollTop - pinStart) / track;
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      const index = Math.min(Math.floor(p * STEPS), STEPS - 1);
      if (index !== activeRole) setActiveRole(index, true);
      if (roleBeam) roleBeam.style.transform = `scaleY(${p})`;
    };

    // Chrome-bar insets, read once per measure from the design tokens (simple px
    // values, so getPropertyValue parses cleanly — unlike the calc() customs).
    const rootStyle = getComputedStyle(document.documentElement);
    const barTop = parseFloat(rootStyle.getPropertyValue('--bar-top')) || 60;
    const barBottom = parseFloat(rootStyle.getPropertyValue('--bar-bottom')) || 56;
    const pinTopBase = 10 + barTop + 16; // fixed bar clearance (mirrors --pin-top)
    const pinBottom = barBottom + 10 + 16; // sticky footer clearance (--pin-bottom)

    // Measured once (init + resize). The card is a substantial band; we CENTER it
    // vertically in the stage (between the two bars) via `top`, then build the
    // runway beneath it: wrapper height = card height + surplus, where the surplus
    // (= track, the pinned scroll distance) scales to the viewport. Below 900px,
    // hand layout back to the stacked CSS (drop the inline height/top/opacities).
    const measureRole = (): void => {
      if (!window.matchMedia('(min-width: 900px)').matches) {
        roleSplit.style.height = '';
        roleSticky.style.top = '';
        roleDetails.forEach((d) => { d.style.opacity = ''; });
        if (roleBeam) roleBeam.style.transform = '';
        track = 0;
        activeRole = -1;
        return;
      }
      const cardH = roleSticky.offsetHeight;
      const stage = scroller.clientHeight - pinTopBase - pinBottom;
      // Centered pin position — never above the bar (short-viewport guard).
      const topOffset = Math.max(pinTopBase, pinTopBase + (stage - cardH) / 2);
      roleSticky.style.top = `${topOffset}px`;

      const surplus = Math.round(STEPS * PER_ROLE_VH * scroller.clientHeight);
      roleSplit.style.height = `${cardH + surplus}px`;
      track = surplus;

      const sr = scroller.getBoundingClientRect();
      const wr = roleSplit.getBoundingClientRect();
      pinStart = wr.top - sr.top + scroller.scrollTop - topOffset;
      updateRole(); // re-sync active role + beam to the new geometry
    };

    setActiveRole(0, false); // flash-free initial state (matches server-side CSS)
    measureRole();
    window.addEventListener('resize', measureRole);
    teardown.push(() => window.removeEventListener('resize', measureRole));

    const stopRoleScroll = scroll(updateRole, { container: scroller });
    teardown.push(stopRoleScroll);
  }

  // ---- Scroll-driven: progress line + hero collapse + compact-bar reveal ----
  // Progress line scales with whole-page scroll. Over the first hero-height of
  // scroll (progress 0→1): the hero content fades/lifts out (inside its opaque
  // cell), and once the hero is mostly past, the compact bar reveals as a whole —
  // so the bar is ABSENT on load (it reserves no space) and slides/fades in on
  // scroll. Transform + opacity only. Under reduced motion the hero collapse is
  // skipped and the bar reveals via a plain opacity fade (no slide).
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const heroCollapse = document.querySelector<HTMLElement>('[data-hero-collapse]');
  const bar = document.querySelector<HTMLElement>('[data-bar]');
  const heroMeasure = document.querySelector<HTMLElement>('[data-hero-measure]');
  const rm = prefersReducedMotion();
  const driveActive = !!heroCollapse || !!bar;

  const MIN_ZONE = 220; // floor so a short hero still gives a usable scrub range
  let zone = MIN_ZONE;
  const measureZone = () => {
    zone = Math.max(heroMeasure?.offsetHeight ?? MIN_ZONE, MIN_ZONE);
  };

  const applyDrive = () => {
    const p = Math.min(Math.max(scroller.scrollTop / zone, 0), 1);
    // Hero content fades + lifts out inside its opaque cell — motion, so skipped
    // under reduced motion (the hero just scrolls away unchanged).
    if (heroCollapse && !rm) {
      const heroP = Math.min(p / 0.72, 1); // hero fully gone by 72% of the zone
      heroCollapse.style.opacity = `${1 - heroP}`;
      heroCollapse.style.transform = `translateY(${-22 * heroP}px)`;
    }
    // Compact bar reveals as a whole once the hero starts scrolling past
    // (30%→60% — early and quick). Opacity fade for everyone; slide motion-gated.
    if (bar) {
      const barP = Math.min(Math.max((p - 0.3) / 0.3, 0), 1);
      bar.style.opacity = `${barP}`;
      bar.style.transform = rm ? 'none' : `translateY(${-10 * (1 - barP)}px)`;
      bar.style.pointerEvents = barP > 0.02 ? 'auto' : 'none';
    }
  };

  if (driveActive) {
    measureZone();
    applyDrive(); // set the scroll-0 state before the first scroll event (no flash)
    const onResize = () => {
      measureZone();
      applyDrive();
    };
    window.addEventListener('resize', onResize);
    teardown.push(() => window.removeEventListener('resize', onResize));
  }

  if (progress || driveActive) {
    const stopScroll = scroll(
      (value: number) => {
        if (progress) progress.style.transform = `scaleX(${value})`;
        if (driveActive) applyDrive();
      },
      { container: scroller },
    );
    teardown.push(stopScroll);
  }

  // ---- Live Munich clock ---------------------------------------------------


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
