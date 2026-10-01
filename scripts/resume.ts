/**
 * Render the résumé PDFs.
 *
 *   bun run resume                 # every target → public/ (default) + out/resume/
 *   bun run resume default         # just the listed targets
 *   SKIP_BUILD=1 bun run resume    # reuse the last print build in dist-print/
 *
 * Pipeline: `astro build` with RESUME_PRINT=1 (the only build that emits
 * /resume/print/*) into its own `dist-print/` — never `dist/`, because private
 * job targets carry contact details and `dist/` is what gets deployed. Then a
 * loopback-only static server over it (not `astro preview`: Astro 7's preview
 * refuses to start while any other Astro server — e.g. the dev server — is
 * running), then headless Chrome over CDP: navigate, wait for fonts, assert the
 * sheet fits ONE page, printToPDF. No PDF library, no Puppeteer — the same
 * raw-CDP approach as scripts/shots.ts.
 *
 * Outputs:
 *   default           → public/johannes-krumm-resume.pdf (committed, linked from /resume)
 *   every other one   → out/resume/<id>.pdf (gitignored)
 *   + out/resume/<id>.png, a 2× preview for eyeballing without a PDF viewer
 *
 * A PDF is only written when its checks pass, via temp file + rename, so a
 * failed run can never leave a clipped or wrong-font résumé in public/.
 *
 * The one-page check measures the sheet's content, not the PDF: `.sheet` is a
 * fixed 297mm box with overflow hidden, so a PDF would always be one page and
 * silently clip. We compare the last child's bottom edge against the sheet's
 * padding box instead and fail loudly, reporting the slack either way so copy
 * edits can be sized against it.
 */
import { mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resumePdf } from '../src/data/career/facts';

const ROOT = new URL('..', import.meta.url).pathname;
const CHROME =
  process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIST = `${ROOT}dist-print`;
const PUBLIC_PDF = `${ROOT}public${resumePdf}`;
const OUT = `${ROOT}out/resume`;
const PX_PER_MM = 96 / 25.4;
const A4_PX = { width: 794, height: 1123 };

if (!process.env.SKIP_BUILD) {
  console.log('Building with RESUME_PRINT=1 …');
  const build = await Bun.$`bun --bun node_modules/.bin/astro build --outDir ${DIST}`
    .cwd(ROOT)
    .env({ ...process.env, RESUME_PRINT: '1' })
    .quiet()
    .nothrow();
  if (build.exitCode !== 0) {
    console.error(build.stdout.toString(), build.stderr.toString());
    process.exit(1);
  }
}

const built = (await readdir(`${DIST}/resume/print`).catch(() => [])).map((f) =>
  f.replace(/\.html$/, ''),
);
const wanted = process.argv.slice(2);
const ids = wanted.length ? wanted : built;
const missing = ids.filter((id) => !built.includes(id));
if (missing.length) {
  console.error(`No print page for: ${missing.join(', ')} (built: ${built.join(', ') || 'none'})`);
  process.exit(1);
}

// ── Processes ────────────────────────────────────────────────────────────────
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname).replace(/\/$/, '');
    if (path.includes('..')) return new Response('bad path', { status: 400 });
    for (const candidate of [path, `${path}.html`, `${path}/index.html`]) {
      const file = Bun.file(`${DIST}${candidate}`);
      if (candidate && (await file.exists())) return new Response(file);
    }
    return new Response('not found', { status: 404 });
  },
});

// A fresh profile per run: a shared one lets an orphaned Chrome hold the
// SingletonLock, and the next launch hands off to it and never opens CDP.
const profile = await mkdtemp(join(tmpdir(), 'jk-resume-'));
const chrome = Bun.spawn(
  [
    CHROME,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdout: 'ignore', stderr: 'ignore' },
);

let ws: WebSocket | undefined;
async function cleanup() {
  ws?.close();
  chrome.kill();
  server.stop(true);
  await rm(profile, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => cleanup().finally(() => process.exit(130)));
}

// ── CDP ──────────────────────────────────────────────────────────────────────
/** Chrome writes the port it actually bound to (we asked for 0) into the profile. */
async function devtoolsUrl(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const file = Bun.file(join(profile, 'DevToolsActivePort'));
    if (await file.exists()) {
      const [port, path] = (await file.text()).trim().split('\n');
      if (port && path) return `ws://127.0.0.1:${port}${path}`;
    }
    await Bun.sleep(150);
  }
  throw new Error('Chrome did not expose a CDP endpoint');
}

interface CdpMessage {
  id?: number;
  result?: unknown;
  error?: { message: string; code: number };
}

let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function rejectAll(reason: string) {
  for (const waiter of pending.values()) waiter.reject(new Error(reason));
  pending.clear();
}

function send<T>(method: string, params: object = {}, sessionId?: string): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: (v) => resolve(v as T), reject });
    ws!.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

async function evaluate<T>(sessionId: string, expression: string): Promise<T> {
  const res = await send<{
    result?: { value?: T };
    exceptionDetails?: { text: string; exception?: { description?: string } };
  }>('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (res.exceptionDetails) {
    const detail = res.exceptionDetails.exception?.description ?? res.exceptionDetails.text;
    throw new Error(`In-page evaluation failed: ${detail}\n${expression.slice(0, 120)}…`);
  }
  return res.result?.value as T;
}

interface Fit {
  slackMm: number;
  serif: boolean;
}

function describeFit(fit: Fit): string {
  if (!fit.serif) return 'FAIL serif font did not load';
  if (fit.slackMm < 0) return `FAIL overflows by ${-fit.slackMm}mm`;
  return `fits, ${fit.slackMm}mm slack`;
}

/** Write via a temp file in the same dir, so the target is never half-written. */
async function writeAtomic(path: string, base64: string) {
  const tmp = `${path}.tmp`;
  await Bun.write(tmp, Buffer.from(base64, 'base64'));
  await rename(tmp, path);
}

async function render(sessionId: string, id: string): Promise<boolean> {
  await send('Page.navigate', { url: `${server.url}resume/print/${id}` }, sessionId);
  await evaluate(
    sessionId,
    `new Promise(r => {
      const go = () => document.fonts.ready.then(() => setTimeout(r, 150));
      document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
    })`,
  );

  const fit = await evaluate<Fit>(
    sessionId,
    `(() => {
      const sheet = document.querySelector('.sheet');
      const pad = parseFloat(getComputedStyle(sheet).paddingBottom);
      const limit = sheet.getBoundingClientRect().bottom - pad;
      const last = [...sheet.children].at(-1).getBoundingClientRect().bottom;
      return {
        slackMm: Math.round(((limit - last) / ${PX_PER_MM}) * 10) / 10,
        serif: document.fonts.check('9pt "Source Serif 4"'),
      };
    })()`,
  );
  const ok = fit.slackMm >= 0 && fit.serif;
  const pdf = id === 'default' ? PUBLIC_PDF : `${OUT}/${id}.pdf`;

  // The preview is written either way — it is how a failure gets diagnosed.
  await send('Emulation.setDeviceMetricsOverride', { ...A4_PX, deviceScaleFactor: 2, mobile: false }, sessionId);
  const shot = await send<{ data: string }>(
    'Page.captureScreenshot',
    { format: 'png', clip: { x: 0, y: 0, ...A4_PX, scale: 1 } },
    sessionId,
  );
  await send('Emulation.clearDeviceMetricsOverride', {}, sessionId);
  await writeAtomic(`${OUT}/${id}.png`, shot.data);

  if (ok) {
    const { data } = await send<{ data: string }>(
      'Page.printToPDF',
      {
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: false,
        generateTaggedPDF: true,
        generateDocumentOutline: true,
      },
      sessionId,
    );
    await writeAtomic(pdf, data);
  }

  console.log(`  ${id.padEnd(12)} ${describeFit(fit)}${ok ? ` → ${pdf.replace(ROOT, '')}` : ' (PDF not written)'}`);
  return ok;
}

// ── Run ──────────────────────────────────────────────────────────────────────
let failures = 0;
try {
  const socket = new WebSocket(await devtoolsUrl());
  ws = socket;
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener('open', () => resolve(), { once: true });
    socket.addEventListener('error', () => reject(new Error('CDP socket failed')), { once: true });
  });
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data)) as CdpMessage;
    const waiter = msg.id === undefined ? undefined : pending.get(msg.id);
    if (!waiter || msg.id === undefined) return;
    pending.delete(msg.id);
    if (msg.error) waiter.reject(new Error(`${msg.error.message} (${msg.error.code})`));
    else waiter.resolve(msg.result ?? {});
  });
  socket.addEventListener('close', () => rejectAll('CDP socket closed'));
  socket.addEventListener('error', () => rejectAll('CDP socket error'));

  const { targetId } = await send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send<{ sessionId: string }>('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setEmulatedMedia', { media: 'print' }, sessionId);
  await Bun.$`mkdir -p ${OUT}`.quiet();

  for (const id of ids) {
    if (!(await render(sessionId, id))) failures++;
  }
} finally {
  await cleanup();
}

process.exit(failures ? 1 : 0);
