/**
 * Skills — grouped stack, rendered as icon+name links.
 *
 * Icons come from `simple-icons` (build-time only, zero client JS): import the
 * named export, render its `path` in an inline `<svg>`. A `Skill` with no
 * `icon` (no real simple-icons brand mark, or the only match is a different
 * "same name" brand — e.g. `siHermes` is Hermès the fashion house, not Hermes
 * Agent) falls back to a hand-drawn generic outline glyph in Skills.astro, so
 * nothing ever renders as a missing-icon gap.
 *
 * The PDF's text skill groups (src/data/career/facts.ts `skills`) must keep
 * naming the same tools as these groups — they're two renderings of one stack,
 * not two lists to keep in sync by hand.
 */
import {
  siApachekafka,
  siAstro,
  siBun,
  siClaude,
  siCloudflare,
  siD3,
  siDatadog,
  siDocker,
  siMantine,
  siModelcontextprotocol,
  siNestjs,
  siNodedotjs,
  siOpencode,
  siOpentelemetry,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siTailscale,
  siTanstack,
  siTerraform,
  siTypescript,
  siVuedotjs,
  type SimpleIcon,
} from 'simple-icons';

export interface Skill {
  name: string;
  href: string;
  icon?: SimpleIcon;
}

export interface SkillGroup {
  label: string;
  items: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: 'Language',
    items: [
      { name: 'TypeScript', href: 'https://www.typescriptlang.org', icon: siTypescript },
      { name: 'Python', href: 'https://www.python.org', icon: siPython },
    ],
  },
  {
    label: 'Frontend',
    items: [
      { name: 'React', href: 'https://react.dev', icon: siReact },
      { name: 'Astro', href: 'https://astro.build', icon: siAstro },
      { name: 'Vue.js', href: 'https://vuejs.org', icon: siVuedotjs },
      { name: 'TanStack', href: 'https://tanstack.com', icon: siTanstack },
      { name: 'Mantine', href: 'https://mantine.dev', icon: siMantine },
      { name: 'D3 / visx', href: 'https://d3js.org', icon: siD3 },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'Bun', href: 'https://bun.sh', icon: siBun },
      { name: 'Node.js', href: 'https://nodejs.org', icon: siNodedotjs },
      { name: 'NestJS', href: 'https://nestjs.com', icon: siNestjs },
      { name: 'PostgreSQL', href: 'https://www.postgresql.org', icon: siPostgresql },
      { name: 'Apache Kafka', href: 'https://kafka.apache.org', icon: siApachekafka },
      { name: 'Redis', href: 'https://redis.io', icon: siRedis },
    ],
  },
  {
    label: 'Agentic',
    items: [
      { name: 'Claude Code', href: 'https://claude.com/claude-code', icon: siClaude },
      { name: 'Codex', href: 'https://openai.com/codex' },
      { name: 'OpenCode', href: 'https://opencode.ai', icon: siOpencode },
      { name: 'Hermes Agent', href: 'https://github.com/NousResearch/hermes-agent' },
      { name: 'MCP', href: 'https://modelcontextprotocol.io', icon: siModelcontextprotocol },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { name: 'Docker', href: 'https://www.docker.com', icon: siDocker },
      { name: 'Cloudflare', href: 'https://www.cloudflare.com', icon: siCloudflare },
      { name: 'AWS', href: 'https://aws.amazon.com' },
      { name: 'Terraform', href: 'https://www.terraform.io', icon: siTerraform },
      { name: 'Tailscale', href: 'https://tailscale.com', icon: siTailscale },
      { name: 'Datadog', href: 'https://www.datadoghq.com', icon: siDatadog },
      { name: 'OpenTelemetry', href: 'https://opentelemetry.io', icon: siOpentelemetry },
    ],
  },
];
