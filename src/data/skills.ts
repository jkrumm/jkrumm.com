/**
 * Skills — grouped stack, rendered as icon+name links.
 *
 * Icons come from `simple-icons` (build-time only, zero client JS): import the
 * named export, render its `path` in an inline `<svg>`. AWS has no simple-icons
 * mark, so its `Skill` omits `icon` and the component falls back to text-only.
 */
import {
  siApachekafka,
  siAstro,
  siBun,
  siClaude,
  siCloudflare,
  siDocker,
  siGithub,
  siGo,
  siMantine,
  siNestjs,
  siNodedotjs,
  siPostgresql,
  siPython,
  siReact,
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
      { name: 'Go', href: 'https://go.dev', icon: siGo },
      { name: 'Python', href: 'https://www.python.org', icon: siPython },
    ],
  },
  {
    label: 'Frontend',
    items: [
      { name: 'React', href: 'https://react.dev', icon: siReact },
      { name: 'Vue.js', href: 'https://vuejs.org', icon: siVuedotjs },
      { name: 'Astro', href: 'https://astro.build', icon: siAstro },
      { name: 'TanStack', href: 'https://tanstack.com', icon: siTanstack },
      { name: 'Mantine', href: 'https://mantine.dev', icon: siMantine },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'Node.js', href: 'https://nodejs.org', icon: siNodedotjs },
      { name: 'NestJS', href: 'https://nestjs.com', icon: siNestjs },
      { name: 'Bun', href: 'https://bun.sh', icon: siBun },
      { name: 'PostgreSQL', href: 'https://www.postgresql.org', icon: siPostgresql },
      { name: 'Apache Kafka', href: 'https://kafka.apache.org', icon: siApachekafka },
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
    ],
  },
  {
    label: 'Workflow',
    items: [
      { name: 'Claude Code', href: 'https://claude.com/claude-code', icon: siClaude },
      { name: 'GitHub', href: 'https://github.com', icon: siGithub },
    ],
  },
];
