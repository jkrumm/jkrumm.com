/**
 * The fact base. Everything here is PUBLIC — this repo is public and the
 * résumé PDF is served from the site. The only contact details here are the
 * public ones (site, GitHub, LinkedIn, hello@); phone and address never go
 * in this file — private renders inject them through a gitignored target
 * (see the `career` skill).
 *
 * Every number here is backed by evidence in the brain dossier
 * (wiki/career/) — git history, npm, the product's own analytics. Claims that
 * git cannot show (mentoring, regulatory work) are his testimony and are
 * phrased as responsibilities, never as metrics.
 *
 * Order is narrative order: the resolver cuts by score but prints in the
 * order written here.
 */
import type { Copy, Education, Pillar, Principle, Project, Role, SkillGroup } from './types';

export const identity = {
  name: 'Johannes Krumm',
  location: 'Munich, Germany',
  website: { href: 'https://jkrumm.com', display: 'jkrumm.com' },
  github: { href: 'https://github.com/jkrumm', display: 'github.com/jkrumm' },
  linkedin: {
    href: 'https://www.linkedin.com/in/johannes-krumm/',
    display: 'linkedin.com/in/johannes-krumm',
  },
  /** Public role address — safe everywhere. A phone only ever comes from a private target's `contact`. */
  email: 'hello@jkrumm.com',
  languages: [
    { name: 'German', level: 'native' },
    { name: 'English', level: 'fluent' },
  ],
} as const;

export const pillars: Pillar[] = [
  {
    id: 'leadership',
    label: 'Technical leadership',
    text: {
      cv: 'Tech lead of one of five teams on a university ERP: owns three domains, sets the bar, mentored 10+ engineers.',
    },
    tags: ['leadership', 'domain'],
  },
  {
    id: 'architecture',
    label: 'Software architecture',
    text: {
      cv: 'Domain-driven services on Kafka that stayed changeable through five years of shifting ministry rules.',
    },
    tags: ['architecture', 'backend'],
  },
  {
    id: 'agentic',
    label: 'Agentic engineering',
    text: {
      cv: 'Agents that triage production bugs and propose fixes at work; a lights-out agent factory at home.',
    },
    tags: ['agentic'],
  },
];

/** How he works — the leadership line the pillars only name. */
export const principles: Principle[] = [
  {
    id: 'simple',
    lead: 'Simple, never a shortcut',
    text: {
      cv: 'The stable, simple solution that holds at scale — a shortcut is deferred cost.',
      web: "I look for the stable, simple solution that still holds at scale. A shortcut isn't simple — it's deferred cost.",
    },
  },
  {
    id: 'challenge',
    lead: 'Challenge and teach',
    text: {
      cv: 'Pushes engineers to their best work; strong opinions, open to the better argument.',
      web: 'I push engineers to their best work — in pairing, review and refinement. Strong opinions, but the better argument wins.',
    },
  },
  {
    id: 'speed',
    lead: 'Fast and careful',
    text: {
      cv: 'Speed from safety nets — monitoring, alerting, automated triage — not skipped steps.',
      web: 'Speed comes from safety nets, not from skipped steps: monitoring, alerting and automated triage catch what moves fast.',
    },
  },
  {
    id: 'loop',
    lead: 'Agents close the loop',
    text: {
      cv: 'Triage, fix, review, deploy, verify by agents — a human gate where the risk is.',
      web: 'At home, agents triage an issue, fix it, review it, deploy it and verify it. At work, they triage and classify bugs, then wait for a human before the fix. The gate sits where the risk is.',
    },
  },
];

/** Personality, one line. */
export const outside: Copy = {
  cv: 'Powerlifting, hiking, skiing and surfing — and long walks with the dog.',
  web: 'Powerlifting, hiking, skiing, surfing — and long walks with my dog.',
};

/** One line under the "Building in public" label. */
export const buildingInPublic: Copy = {
  cv: '5,200+ commits across 30+ repositories in the last twelve months — products, infrastructure and agent tooling.',
  web: 'Over 5,200 commits across 30+ repositories in the last twelve months — products, infrastructure and the agent tooling I work with every day.',
};

export const roles: Role[] = [
  {
    id: 'iu',
    company: 'IU International University',
    href: 'https://www.iu.org',
    location: 'Munich',
    start: '2021-04',
    positions: [
      { title: 'Tech Lead', since: '2024-01' },
      { title: 'Full-Stack Developer', since: '2021-04' },
    ],
    context: {
      cv: "In-house student ERP of Germany's largest university (~150k students), five teams: NestJS, Kafka, MySQL, Vue, AWS.",
      linkedin:
        "IU runs Germany's largest university (~150k students) on an in-house student ERP built by five teams: NestJS services on Kafka and MySQL, Vue micro-frontends, AWS. I lead one of those teams; we own three domains and five services.",
    },
    highlights: [
      {
        id: 'iu-ownership',
        lead: 'Domain owner',
        text: {
          cv: 'Tech lead of one of five teams; owner of and go-to person for 3 domains and 5 services.',
          linkedin:
            'Tech lead of one of the five teams and technical owner of three domains and five services — the person people ask first how they work and why, with the deepest understanding of the business behind them.',
        },
        tags: ['leadership', 'domain', 'architecture'],
        rank: 1,
      },
      {
        id: 'iu-regulatory',
        lead: 'Ministry rules',
        text: {
          cv: 'Guided ministry-driven rule changes into business processes, then into domain models.',
          linkedin:
            'Technical guide when the ministry changed the rules for enrolment and matriculation: worked them out with product managers and architects over several rounds, improved the business processes around them and built the domain that runs them.',
        },
        tags: ['domain', 'leadership'],
        rank: 1,
      },
      {
        id: 'iu-lifecycle',
        lead: 'Student lifecycle',
        text: {
          cv: 'Leave of absence, programme change, cancellation and their interplay, modelled in DDD.',
        },
        tags: ['domain', 'architecture', 'backend'],
        rank: 1,
      },
      {
        id: 'iu-integration',
        lead: 'Integration',
        text: {
          cv: 'Kafka + transactional outbox; SharePoint via his DAM service, Salesforce via the CRM bridge.',
          linkedin:
            'Event-driven integration on Kafka with a transactional outbox and idempotent handlers; SharePoint through a DAM service I built, Salesforce through the CRM bridge.',
        },
        tags: ['architecture', 'backend'],
        rank: 1,
      },
      {
        id: 'iu-quality',
        lead: 'NestJS foundation',
        text: {
          cv: 'Custom decorators, interceptors, guards; an ESLint plugin encoding domain rules; 300+ specs.',
        },
        tags: ['backend', 'quality'],
        rank: 2,
      },
      {
        id: 'iu-improvement',
        lead: 'Continuous improvement',
        text: {
          cv: 'Node 24, NestJS 11, Datadog monitoring, faster local dev — many small iterations.',
        },
        tags: ['platform', 'quality'],
        rank: 2,
      },
      {
        id: 'iu-mentoring',
        lead: 'Mentoring',
        text: {
          cv: 'Onboarded 10+ engineers and taught them DDD, NestJS and Kafka — in pairing, review, refinement.',
          linkedin:
            'Onboarded more than ten engineers and taught them DDD, NestJS and Kafka — in pairing, in code review and in refinement.',
        },
        tags: ['leadership'],
        rank: 1,
      },
      {
        id: 'iu-agent',
        lead: 'Bug-triage agent',
        text: {
          cv: 'Watches Datadog, classifies bugs, drafts root causes, opens fix MRs after human sign-off.',
          linkedin:
            'Built and run an agent that watches our core service in Datadog, classifies and groups production bugs, drafts root-cause analyses against the real codebase and — once a human signs off — opens the fix merge request. The team steers it from Teams threads.',
        },
        tags: ['agentic', 'platform'],
        rank: 1,
      },
      {
        id: 'iu-ai-workflow',
        lead: 'Agentic setup',
        text: {
          cv: "Spec-driven Claude Code; 7 MCP servers give the team's agents Datadog, Kafka, DB and Jira.",
          linkedin:
            "Built the team's agentic engineering setup: spec-driven Claude Code development and an MCP workbench of seven servers — Datadog, Kafka, the database, Jira, Confluence and more — so agents debug and work on issues with the same monitoring and infrastructure access we have.",
        },
        tags: ['agentic', 'leadership'],
        rank: 1,
      },
      {
        id: 'iu-frontend',
        lead: 'Micro-frontends',
        text: {
          cv: 'Vue micro-frontends for booking and the academic profile: leave-of-absence flows, programme-change checks, the original statistics view.',
        },
        tags: ['frontend'],
        rank: 3,
      },
    ],
  },
  {
    id: 'squaretrade',
    company: 'SquareTrade',
    href: 'https://www.squaretrade.com',
    location: 'San Francisco',
    start: '2018-10',
    end: '2020-07',
    positions: [{ title: 'Full-Stack Data Engineer', since: '2018-10' }],
    context: {
      cv: 'Device protection plans sold through retailers. ETL ingestion and analytics: Spring Boot, Informatica, Python, PostgreSQL.',
    },
    highlights: [
      {
        id: 'st-merchants',
        lead: 'Merchant onboarding',
        text: { cv: 'Integrated new retail partners into the ingestion pipeline for protection plans.' },
        tags: ['backend', 'platform'],
        rank: 2,
      },
      {
        id: 'st-iam',
        lead: 'Merchant access',
        text: { cv: "Contributed to the IAM service that let merchants manage their own users' access." },
        tags: ['backend', 'architecture'],
        rank: 2,
      },
      {
        id: 'st-analytics',
        lead: 'Device analytics',
        text: { cv: 'Captured anonymous device telemetry that fed customer profiling and dynamic pricing.' },
        tags: ['backend'],
        rank: 3,
      },
    ],
  },
  {
    id: 'agencies',
    company: 'Edelweiss72 & Sheraptec',
    location: 'Munich',
    start: '2015-08',
    end: '2018-09',
    positions: [{ title: 'Web Developer, part-time', since: '2015-08' }],
    context: {
      cv: 'Web agencies, alongside studies — TYPO3 and PHP sites for clients including dm, SWM and Deloitte.',
    },
    highlights: [],
  },
];

export const education: Education[] = [
  {
    id: 'hm',
    degree: 'B.Sc. Economics & Computer Science',
    institution: 'Munich University of Applied Sciences',
    location: 'Munich',
    start: '2015',
    end: '2020',
    note: 'Thesis project: a Bitcoin payment service validating transactions before block confirmation.',
  },
];

export const projects: Project[] = [
  {
    id: 'agent-factory',
    name: 'Agent factory',
    href: 'https://jkrumm.com/guide/personal-stack',
    year: '2026',
    stack: ['Claude Code', 'MCP', 'Bun', 'Python'],
    text: {
      cv: 'Self-hosted lights-out loop: agents triage, fix, review, deploy and verify; a 24/7 assistant; STT/TTS.',
      web: 'My agentic engineering setup. Issues go in, verified fixes come out — triaged, implemented, reviewed, deployed and checked by agents, with a human gate where the risk is.',
    },
    details:
      'Warden is the control plane: it turns a signal — a failing check, an error spike, a new issue — into an investigation, a verdict, an implementation, a review and a merge, then verifies the fix in production. Around it: Hermes, a 24/7 assistant in Slack; agent-gateway, which offloads checks, reviews and implementation to cheaper models; gateways for research, speech, email and image generation; and model choice from daily benchmarks, not habit. It runs on a Mac mini, a homelab and a VPS.',
    tags: ['agentic', 'platform', 'architecture'],
    rank: 1,
  },
  {
    id: 'basalt-ui',
    name: 'BasaltUI',
    href: 'https://github.com/jkrumm/basalt-ui',
    year: '2026',
    stack: ['React', 'Mantine', 'visx'],
    text: {
      cv: 'React design system on npm, built for agents to compose — charts, app shell, agent chat. 8k downloads a year.',
      web: 'A React design system optimised for agents — themed charts, app shell and a streaming agent chat.',
    },
    details:
      'Mantine v9 plus visx: themed charts, an app shell, data tables, forms and a streaming agent chat — each module documented so an agent composes it right on the first try. On npm with about 8k downloads a year, and the design system behind my own dashboards.',
    tags: ['frontend', 'agentic'],
    rank: 1,
  },
  {
    id: 'fpp',
    name: 'FreePlanningPoker',
    href: 'https://free-planning-poker.com',
    year: '2023',
    stack: ['Next.js', 'WebSocket', 'Postgres'],
    text: {
      cv: 'Real-time planning poker for agile teams — 10k users and 170k estimates, free and without signup.',
    },
    details:
      "Everyone estimates at once, hidden until the reveal, so the first number can't anchor the room. Real-time rooms over WebSocket, no accounts, no setup — 10k users and 170k estimates since 2023.",
    tags: ['frontend', 'backend'],
    rank: 1,
  },
  {
    id: 'rollhook',
    name: 'RollHook',
    href: 'https://rollhook.com',
    year: '2026',
    stack: ['Go', 'TypeScript', 'Docker Compose'],
    text: {
      cv: 'Zero-downtime rolling deploys for Docker Compose via webhook or GitHub Action — ships this site.',
      web: 'Zero-downtime rolling deployments for Docker Compose, triggered by webhook.',
    },
    details:
      'Push an image, call the webhook or the GitHub Action, and RollHook rolls the Compose service one container at a time behind health checks — no dropped requests. It deploys this site.',
    tags: ['platform'],
    rank: 2,
  },
  {
    id: 'weatherorb',
    name: 'WeatherOrb',
    href: 'https://weatherorb.com',
    year: '2026',
    stack: ['Python', 'TypeScript', 'WebGL'],
    text: {
      cv: 'One forecast for sky and sea, blended and calibrated from 35 weather and 8 marine models.',
      web: 'One forecast for sky and sea — 35 weather and 8 marine models, blended, calibrated and drawn on a WebGL map.',
    },
    details:
      'Built because Windy shows you the models and leaves the judging to you. WeatherOrb syncs 35 atmospheric and 8 marine Open-Meteo models, calibrates them against real observations from airports, buoys and the DWD, and serves one forecast as a point API and a rendered map.',
    tags: ['backend', 'frontend'],
    rank: 3,
  },
];

export const skills: SkillGroup[] = [
  {
    id: 'architecture',
    label: 'Architecture',
    items: ['Domain-driven design', 'Event-driven systems', 'Transactional outbox', 'Hexagonal', 'CQRS'],
    tags: ['architecture'],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: ['TypeScript', 'Python', 'Bun', 'Node.js', 'NestJS', 'Kafka', 'PostgreSQL', 'MySQL', 'Redis'],
    tags: ['backend'],
  },
  {
    id: 'agentic',
    label: 'Agentic',
    items: [
      'Claude Code',
      'Codex',
      'OpenCode',
      'Pi',
      'Hermes Agent',
      'MCP',
      'Agent orchestration',
      'Model routing',
      'STT / TTS',
    ],
    tags: ['agentic'],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: ['AWS', 'Docker', 'Terraform', 'Cloudflare', 'GitLab CI', 'GitHub Actions', 'Datadog', 'OpenTelemetry'],
    tags: ['platform'],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    items: ['React', 'Astro', 'Vue', 'TanStack', 'Mantine', 'D3 / visx', 'Micro-frontends'],
    tags: ['frontend'],
  },
];

/** Profile fields that only exist on LinkedIn. */
export const linkedin = {
  headline:
    'Tech Lead at IU International University · Software Architecture — DDD, event-driven systems, Kafka · Agentic Engineering: building and running AI agents in production',
  about: [
    "I'm a tech lead at IU International University, Germany's largest university. My team is one of five building its in-house student ERP; we own three domains and five services, and I'm the person people ask first how they work and why — from the ministry rule to the business process to the domain model.",
    'What I do:',
    '• Lead the domain: the technical voice in refinement with product managers and architects, and the one who turns changing government rules into business processes and working software.',
    '• Architect for the long tail: domain-driven design, event-driven NestJS services on Kafka with a transactional outbox, and the continuous improvement that keeps them healthy — runtime upgrades, monitoring, lint rules that encode the domain, hundreds of tests.',
    '• Grow engineers: I have onboarded more than ten, taught them DDD, NestJS and Kafka, and I push them to their best work.',
    "• Build with agents, seriously: I follow agentic engineering closely and build on it daily — Claude Code, Codex, OpenCode and Pi, Hermes Agent, MCP servers, model routing across providers, speech-to-text and text-to-speech pipelines. At work I built the team's agentic setup and an agent that triages production bugs and prepares fixes for human sign-off; at home a lights-out loop where agents triage, fix, review, deploy and verify.",
    'How I work: the stable, simple solution that still holds at scale — never a shortcut. Strong opinions, open to the better argument. Fast because of safety nets, not skipped steps.',
    'I build in public: FreePlanningPoker (10k users), BasaltUI (a design system on npm, built for agents), RollHook (zero-downtime Docker Compose deploys), WeatherOrb and the guides on jkrumm.com.',
    'Outside work: powerlifting, hiking, skiing, surfing — and long walks with my dog.',
  ].join('\n\n'),
  /** Descriptions for older titles within a company, keyed `roleId:title`. */
  earlierPositions: {
    'iu:Full-Stack Developer':
      'Joined as a full-stack developer: NestJS services on Kafka and MySQL, Vue micro-frontends, AWS. Built the SharePoint provisioning pipeline (DAM service) and the academic-profile statistics view, and grew into the technical owner of the domain.',
  } as Record<string, string>,
};

/** The committed default render (`bun run resume default`), served from public/. */
export const resumePdf = '/johannes-krumm-resume.pdf';
