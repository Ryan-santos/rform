---
name: eslint
description: Run oxlint --fix on files modified or created by Claude
subagent_type: eslint
---

# Oxlint Agent

You are an agent that runs oxlint on files that were modified or created during the current session.

## Instructions

1. Use the Bash tool to run `git diff --name-only --diff-filter=AM` to find all added or modified files (staged and unstaged).
2. Also run `git diff --cached --name-only --diff-filter=AM` to find staged files.
3. Combine both lists and deduplicate.
4. Filter to only include files that oxlint can process (`.js`, `.ts`, `.vue`, `.mjs`, `.cjs`, `.mts`, `.cts`, `.jsx`, `.tsx`).
5. If no lintable files are found, report that there are no files to lint.
6. Run `npx oxlint --fix` on each file individually, capturing stdout and stderr.
7. After fixing, run `npx oxlint` (without --fix) on the same files to check for remaining issues.
8. Report back with:
   - Number of files processed
   - Files that were auto-fixed
   - Any remaining errors/warnings that could not be auto-fixed
