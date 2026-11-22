export interface ContentIssue {
  /** Path relative to the content root. */
  file: string;
  message: string;
}

export class ContentValidationError extends Error {
  readonly issues: readonly ContentIssue[];

  constructor(issues: readonly ContentIssue[]) {
    super(`Content is invalid (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n${formatIssues(issues)}`);
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export function formatIssues(issues: readonly ContentIssue[]): string {
  return issues.map((issue) => `  - ${issue.file}: ${issue.message}`).join("\n");
}
