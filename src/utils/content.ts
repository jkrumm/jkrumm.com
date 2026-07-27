/**
 * Shared helpers for the guide/blog reading surface: reading-time estimation
 * and a git-derived "last modified" fallback for entries without an explicit
 * `updatedDate` in frontmatter.
 */
import { execSync } from 'node:child_process';

/** Rough reading time in whole minutes, ~200 words/minute, minimum 1. */
export function getReadingTime(body: string): number {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * The build's git commit — short SHA plus its date, or `null` outside a repo.
 * Read once at build time and printed in the footer spec sheet.
 */
export function getBuildCommit(): { sha: string; date: Date } | null {
  try {
    const output = execSync('git log -1 --pretty=%h%x09%cI').toString().trim();
    const [sha, iso] = output.split('\t');
    if (!sha || !iso) return null;
    return { sha, date: new Date(iso) };
  } catch {
    return null;
  }
}

/** Last git commit date touching `filePath`, or `null` if unavailable. */
export function getGitLastModified(filePath: string | undefined): Date | null {
  if (!filePath) return null;
  try {
    const output = execSync(`git log -1 --pretty=%cI -- "${filePath}"`).toString().trim();
    if (!output) return null;
    return new Date(output);
  } catch {
    return null;
  }
}
