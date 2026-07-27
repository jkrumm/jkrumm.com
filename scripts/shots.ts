/**
 * Design-iteration harness — desktop + mobile screenshots of the running dev
 * server, in both themes.
 *
 *   bun run shots                      # / at desktop+mobile, light+dark
 *   bun run shots / /blog /guide       # explicit routes
 *   OUT=/tmp/after bun run shots       # write somewhere else
 *
 * Why CDP and not `chrome --headless --screenshot`: headless Chrome clamps its
 * window to a 500px minimum and `--force-device-scale-factor` inflates the CSS
 * viewport on top of that (a requested 390 renders at 756). Mobile shots taken
 * that way are silently wrong — they show a desktop layout and invent overflow
 * that isn't there. `Emulation.setDeviceMetricsOverride` is the only way to get
 * an honest small viewport.
 *
 * Reveals: the page hides `.reveal` under `html.js` until Motion sees it
 * intersect, so a screenshot only shows what has been in view. We set a tall
 * viewport, scroll to the bottom and back, then wait — that trips every
 * observer before the capture.
 *
 * Theme is forced with `?__theme=`, which the pre-paint script in
 * BaseLayout.astro honors, so a run never depends on the machine's system
 * preference.
 *
 * Shoot `astro preview` (4321), not `astro dev` — the dev server injects the
 * Astro dev toolbar into the page, and Vite HMR can serve stale scoped styles
 * after a large multi-file edit (see CLAUDE.md § Validation). The production
 * build is what actually ships, so it is what gets reviewed.
 */
const BASE = process.env.BASE ?? 'http://localhost:4321';
const OUT = process.env.OUT ?? '/tmp/jk-shots';
const THEMES = (process.env.THEMES ?? 'light dark').split(/\s+/).filter(Boolean);
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];

const CHROME =
  process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const DEVICES = [
  { label: 'desktop', width: 1440, height: 1200, scale: 1, mobile: false },
  { label: 'mobile', width: 390, height: 900, scale: 2, mobile: true },
] as const;

const PORT = 9222 + (process.pid % 500);

const chrome = Bun.spawn(
  [
    CHROME,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    // A throwaway profile keeps this run out of the user's real Chrome.
    '--user-data-dir=/tmp/jk-shots-profile',
    'about:blank',
  ],
  { stdout: 'ignore', stderr: 'ignore' },
);

/** Poll the CDP endpoint until Chrome is listening. */
async function endpoint(): Promise<string> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = (await res.json()) as { webSocketDebuggerUrl: string };
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await Bun.sleep(150);
  }
  throw new Error(`Chrome did not expose a CDP endpoint on ${PORT}`);
}

const ws = new WebSocket(await endpoint());
await new Promise<void>((resolve, reject) => {
  ws.addEventListener('open', () => resolve(), { once: true });
  ws.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true });
});

let nextId = 1;
const pending = new Map<number, (value: any) => void>();

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(String(event.data));
  const resolve = pending.get(msg.id);
  if (resolve) {
    pending.delete(msg.id);
    resolve(msg.result ?? {});
  }
});

/** One CDP call. `sessionId` targets a page rather than the browser. */
function send(method: string, params: object = {}, sessionId?: string): Promise<any> {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);

async function evaluate(expression: string) {
  const res = await send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  return res?.result?.value;
}

await Bun.$`mkdir -p ${OUT}`.quiet();

let failures = 0;

console.log(`Shooting ${BASE} → ${OUT}`);

for (const route of ROUTES) {
  for (const device of DEVICES) {
    for (const theme of THEMES) {
      await send(
        'Emulation.setDeviceMetricsOverride',
        {
          width: device.width,
          height: device.height,
          deviceScaleFactor: device.scale,
          mobile: device.mobile,
        },
        sessionId,
      );

      const sep = route.includes('?') ? '&' : '?';
      const url = `${BASE}${route}${sep}__theme=${theme}`;

      const loaded = new Promise<void>((resolve) => {
        const onMessage = (event: MessageEvent) => {
          const msg = JSON.parse(String(event.data));
          if (msg.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', onMessage);
            resolve();
          }
        };
        ws.addEventListener('message', onMessage);
      });

      await send('Page.navigate', { url }, sessionId);
      await Promise.race([loaded, Bun.sleep(10_000)]);

      // Trip every scroll-reveal observer, then return to the top.
      // IntersectionObserver reports on a later frame and the reveal tween runs
      // 0.55s, so each step has to outlast both or the tail of the page shoots
      // blank.
      await evaluate(`(async () => {
        const step = innerHeight * 0.7;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise(r => setTimeout(r, 260));
        }
        scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 1200));
      })()`);

      const slug = route.replace(/^\//, '').replace(/\//g, '-') || 'home';
      const file = `${OUT}/${slug}-${device.label}-${theme}.png`;

      // `captureBeyondViewport` re-lays-out sticky/fixed elements against the
      // expanded viewport, so the progress line and the sticky rail can appear
      // at an odd height in the tall image. That is a capture artifact, not a
      // page bug — check the DOM before chasing one.
      const { data } = await send(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: true },
        sessionId,
      );
      await Bun.write(file, Buffer.from(data, 'base64'));
      console.log(`  ${file}`);

      // Horizontal overflow is the failure mode a screenshot hides — a clipped
      // page and a correct one look identical once the image is cropped. Assert
      // it here, while the mobile metrics override is definitely still active.
      if (device.mobile && theme === THEMES[0]) {
        // `captureBeyondViewport` leaves the metrics override clobbered, so the
        // check would silently run at the wrong width. Re-assert it first —
        // without this the second route onward reports ~705px and the assertion
        // means nothing.
        await send(
          'Emulation.setDeviceMetricsOverride',
          {
            width: device.width,
            height: device.height,
            deviceScaleFactor: device.scale,
            mobile: device.mobile,
          },
          sessionId,
        );
        const report = JSON.parse(
          await evaluate(`(() => {
            // An element may legitimately exceed the viewport if an ancestor
            // scrolls it horizontally — a code block and the nav rail both do.
            // Only flag elements that escape a NON-scrolling ancestor.
            const scrolls = (el) => {
              for (let n = el.parentElement; n; n = n.parentElement) {
                if (n.hasAttribute('data-allow-bleed')) return true;
                const ox = getComputedStyle(n).overflowX;
                if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
              }
              return false;
            };
            const bad = [];
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > innerWidth + 0.5 && !scrolls(el)) {
                bad.push(el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] + ' → ' + Math.round(r.right));
              }
            });
            return JSON.stringify({ w: document.documentElement.scrollWidth, vw: innerWidth, bad: bad.slice(0, 8) });
          })()`),
        );
        // `vw !== device.width` is the important assertion. Under mobile
        // emulation Chrome grows the layout viewport to fit overflowing
        // content, so `scrollWidth <= innerWidth` stays true while the page is
        // genuinely too wide — the check has to catch the grown viewport too.
        const ok =
          report.vw === device.width && report.w <= report.vw && report.bad.length === 0;
        console.log(
          `    overflow @${report.vw}: ${
            ok
              ? 'clean'
              : `FAIL expected ${device.width}px viewport, scrollWidth=${report.w} ${report.bad.join(', ')}`
          }`,
        );
        if (!ok) failures++;
      }
    }
  }
}

ws.close();
chrome.kill();
console.log(failures ? `done — ${failures} overflow failure(s)` : 'done');
process.exit(failures ? 1 : 0);
