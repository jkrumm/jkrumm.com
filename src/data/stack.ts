/**
 * Personal Stack section content — the three tool groups and their chips.
 */
export interface StackChip {
  label: string;
  accent?: boolean;
}

export interface StackGroup {
  label: string;
  description: string;
  chips: StackChip[];
}

export const groups: StackGroup[] = [
  {
    label: 'AI CODING',
    description: 'Agent-driven development with strong guardrails.',
    chips: [
      { label: 'Claude · agents' },
      { label: 'MCP tooling' },
      { label: 'Neovim / VS Code' },
      { label: 'Local + hosted models' },
      { label: 'Prompt workflows' },
    ],
  },
  {
    label: 'HOMELAB',
    description: 'Self-hosted, reproducible, quietly humming at home.',
    chips: [
      { label: 'Proxmox cluster' },
      { label: 'TrueNAS storage' },
      { label: 'Docker Compose' },
      { label: 'Self-hosted apps' },
      { label: 'WireGuard' },
    ],
  },
  {
    label: 'VPS / INFRA',
    description: 'Production stack — deployed with my own tooling.',
    chips: [
      { label: 'Hetzner VPS' },
      { label: 'Rollhook deploys', accent: true },
      { label: 'Traefik / Caddy' },
      { label: 'CI/CD webhooks' },
      { label: 'Grafana / Loki' },
    ],
  },
];
