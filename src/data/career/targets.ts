/**
 * Generic, PUBLIC renderings of the fact base. `default` is the résumé linked
 * from the site. Job-specific targets are private — see the `career` skill.
 */
import type { Target } from './types';

export const targets: Target[] = [
  {
    id: 'default',
    label: 'Tech Lead — architecture, leadership, agentic engineering',
    headline: 'Tech Lead · Software Architecture · Agentic Engineering',
    summary: {
      cv: "Tech lead on the in-house student ERP of Germany's largest university: technical owner of three domains and five services, from the ministry rule to the domain model. Leads by building, teaching and challenging; builds agents that triage production bugs and prepare the fix. Strong opinions, open to the better argument, no shortcuts.",
      web: "I lead one of five teams building the in-house student ERP of Germany's largest university. We own three domains and five services, and I'm the one people ask how they work and why — from the ministry rule to the business process to the domain model. Alongside, I build agents that triage production bugs and prepare the fix.",
    },
    focus: ['architecture', 'leadership', 'domain', 'agentic', 'backend', 'platform', 'quality', 'frontend'],
    bullets: { iu: 9, squaretrade: 2 },
    projects: 4,
    skills: ['architecture', 'backend', 'agentic', 'platform', 'frontend'],
  },
  {
    id: 'architect',
    label: 'Software Architect',
    headline: 'Software Architect · Domain-Driven Design · Event-Driven Systems',
    summary: {
      cv: 'Architect-minded tech lead: DDD, event-driven integration and the long maintenance tail that tests every design decision.',
    },
    focus: ['architecture', 'domain', 'platform', 'leadership', 'quality', 'backend', 'agentic', 'frontend'],
    bullets: { iu: 9, squaretrade: 2 },
    projects: 4,
    skills: ['architecture', 'backend', 'platform', 'agentic'],
  },
  {
    id: 'agentic',
    label: 'Agentic engineering / AI platform',
    headline: 'Tech Lead · Agentic Engineering · Distributed Systems',
    summary: {
      cv: 'Builds and runs agentic engineering systems daily, on top of years of production distributed systems.',
    },
    focus: ['agentic', 'architecture', 'platform', 'leadership', 'backend', 'domain', 'quality', 'frontend'],
    bullets: { iu: 9, squaretrade: 2 },
    projects: 4,
    skills: ['agentic', 'architecture', 'backend', 'platform'],
  },
];
