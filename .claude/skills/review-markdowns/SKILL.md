---
name: review-markdowns
description: Review every markdown file tracked in this repository for accuracy and staleness (outdated commands, stale file/dir references, mismatched conventions vs. the current code), then walk the user through proposed fixes one by one for approval before editing.
disable-model-invocation: true
---

# Review Markdown Docs

Audit all git-tracked markdown files in this repository, propose fixes for anything
inaccurate or stale, and get the user's sign-off on each fix individually before applying it.

## Why confirm one by one

Documentation fixes are cheap to propose but easy to get subtly wrong (a command that
looks outdated might still be intentional, a path might be about to change in other work).
Applying them silently risks introducing new inaccuracies. Confirming each fix individually
keeps the user in control and lets them reject or amend proposals without derailing the rest
of the review.

## Workflow

### 1. Collect the markdown files

List every markdown file tracked by git (not just what's on disk, to avoid picking up
ignored/generated files):

```bash
git ls-files '*.md' '*.markdown'
```

Read each file in full. If there are more than a handful of files, read them in
parallel (multiple `Read` calls in the same turn) rather than one at a time.

### 2. Cross-check content against the current repo state

For each file, do a light-weight sanity check — this is not a deep audit, just enough to
catch obvious drift. For each claim the file makes, verify it against the current state of
the repo rather than trusting the doc:

- **Commands** (e.g. `npx vitest run ...`, `make check`, npm scripts): confirm the referenced
  script/target/binary still exists (check `package.json` scripts, `Makefile` targets, etc.).
- **File and directory references** (e.g. links to other `README.md` files, paths like
  `app/ss-edit/`): confirm the path still exists.
- **Workspace/package names** (e.g. `@~/ui`): confirm they match the current
  `package.json` `name` fields.
- **Conventions described in prose** (e.g. "tests live in `__tests__/*.test.*.ts{,x}`",
  "styles use CSS Modules"): spot-check against a couple of real examples in the codebase.
- **Cross-file consistency**: root `CLAUDE.md` and `README.md` point readers to
  per-workspace `README.md` files — confirm those files still exist and still contain the
  kind of information the root docs imply they contain.
- **Internal links**: relative markdown links (`[text](path)`) resolve to real files.
  For links with an anchor (`path#section`), confirm the anchor matches an actual
  heading in the target file (compare against the heading's GitHub-style slug:
  lowercased, spaces replaced with hyphens, punctuation stripped).

Don't try to verify subjective or aspirational statements — focus on concrete, checkable
claims. If something is ambiguous or you're not sure it's actually wrong, treat it as
lower-confidence and say so when presenting it rather than dropping it silently — append
"(low confidence)" to the item in the numbered list so it's visually distinguishable from
clear-cut issues.

### 3. Present findings as a numbered list

Compile every discrepancy you found across all files into a single flat, numbered list
(don't group silently by file in a way that hides the numbering — the user will refer to
these findings by number). For each item, include:

1. The file and line (or section)
2. What's wrong (quote the current text briefly)
3. The proposed fix (concrete replacement text, not just a description)

If you found nothing wrong in a file, don't list it — only surface actionable items.
If you found zero issues across every file, tell the user the docs look accurate and stop
here (no need to run the confirmation loop below).

### 4. Confirm fixes one by one

Go through the numbered findings **one at a time**, in order. For each one, ask the user
whether to apply it (use AskUserQuestion with options like "Apply", "Skip", or let them
propose a different wording). Do not batch multiple findings into a single question — the
point is per-item control.

Apply each approved fix immediately with Edit before moving to the next item, so approved
changes aren't lost if the session is interrupted partway through.

### 5. Wrap up

Once every finding has been confirmed (applied or skipped), summarize what changed in one
or two sentences and stop. Don't run `make check` or commit unless the user asks — this
skill's job ends at getting the docs correct, not at shipping the change.
