/**
 * Shape of the site's list grammar, consumed by RowList.astro. Types live in a
 * plain module so pages can import them without importing the component.
 */
export interface Row {
  href: string;
  title: string;
  /** Mono prefix ahead of the title — a chapter number, never prose. */
  lead?: string;
  /** Right-hand meta: a date, a duration, a count. Rendered mono/tabular. */
  meta?: string;
}

export interface RowGroup {
  /** Group heading (a year). Omit for an ungrouped list — no label, no rule. */
  label?: string;
  rows: Row[];
}
