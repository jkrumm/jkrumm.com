/// <reference path="../.astro/types.d.ts" />

interface Window {
  /** Injected by the self-hosted Umami script (src/components/seo/BaseHead.astro). */
  umami?: {
    track: (eventName: string, eventData?: Record<string, unknown>) => void;
  };
}
