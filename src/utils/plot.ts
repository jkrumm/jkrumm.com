/**
 * Render an Observable Plot spec to a self-contained inline SVG string at build
 * time (zero client JS), using linkedom as a lightweight DOM.
 *
 * linkedom has no font-metrics engine, so Plot's text-measurement-driven
 * auto-layout (axis sizing, auto-margins, getBBox) falls back to zero — callers
 * MUST pass explicit `margin*` values and, where labels are long, explicit
 * `ticks`. Avoid title/subtitle/caption/legend options: those make Plot return
 * a <figure> wrapper; this helper expects a bare <svg>.
 */
import * as Plot from '@observablehq/plot';
import { parseHTML } from 'linkedom';

type PlotOptions = Parameters<typeof Plot.plot>[0];

export function renderPlotToSvg(options: PlotOptions): string {
  const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
  const node = Plot.plot({ ...options, document }) as unknown as Element;
  const svg = node.tagName?.toLowerCase() === 'svg' ? node : node.querySelector('svg');
  if (!svg) {
    throw new Error('renderPlotToSvg: Plot did not return an <svg> — avoid title/caption/legend options.');
  }

  // Make the inline SVG scale responsively: preserve the aspect ratio via a
  // viewBox and let CSS drive the rendered size (width:100%, height:auto).
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');
  if (width && height && !svg.getAttribute('viewBox')) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
  }
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  return svg.outerHTML;
}
