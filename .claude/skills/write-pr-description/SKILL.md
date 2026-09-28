---
name: write-pr-description
description: Draft a pull request description — and its title when stale — from the diff and apply
  it to GitHub directly
argument-hint: "[PR url or number — omit for the current branch's PR]"
disable-model-invocation: true
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr edit:*)
---

Write the description for the pull request in `$ARGUMENTS` —
or the current branch's pull request when that is empty —
and apply it to GitHub without asking for approval first.
Stop if there is none.

## Steps

1. **Check it is still writable.**
  `gh pr view <n> --json state,isDraft`.
  Abort — change nothing, say why — unless `state` is `OPEN`;
  a merged or closed pull request is left alone.
  A draft is `OPEN` with `isDraft: true` and is fair game.
2. **Read it.**
  `gh pr view <n> --json title,body,headRefName,baseRefName,commits` and `gh pr diff <n>`.
  Open the changed files wherever the diff alone doesn't say *why* something changed: a guard,
  a deleted handler, an added flag.
3. **Ask** for what the repository can't answer:
  the related issue URL, what prompted the work, what was checked beyond CI,
  and whether anything that reads like a defect is deliberate.
  Ask as many rounds as the answers warrant —
  a reply that opens a new question is worth following up on.
  Draft with a placeholder rather than block when the user would rather fill it in themselves.
4. **Draft** the body to a scratch file in the scratchpad directory, following `## Format`.
  Draft a title as well when the existing one no longer says what the diff does;
  leave it alone otherwise.
  A title that names only part of what the diff does is stale too.
5. **Apply** with `gh pr edit <n> --body-file <draft>`,
  adding `--title <title>` only when step 4 drafted one, then read it back to confirm.
6. **Report** what landed:
  the pull request URL, the new title when it changed, and the body as applied.
  The user reviews it on GitHub afterwards, so leave them enough to see what replaced what.

The pull request body is overwritten in place,
so anything the previous body said and the new one doesn't is gone.
Carry over whatever of it still holds.

Claim only what was checked.

## Format

Written in English, whatever language the conversation is in.
Use the headings of `.github/pull_request_template.md` in order,
and follow the hint comment under each.
Leave no hint comment in the body.
Drop an optional section that has nothing to say.

A section earns its length from what the diff cannot say.

- **Cut what a reader gets elsewhere**: the diff, the changed-file list,
  or a changed doc's own text.
- **One home per fact.**
  A table and the prose under it must not say the same thing twice.

### Background

Never invent the reason.

### What's changed

Lead with what someone needs in order to review it — a table of the new keys, the new function,
the new flag — then the parts of the diff that look arbitrary without their reason.

### What's tested locally

As short as the evidence is.

- What was run beyond CI, such as manual checks in the app.
- Whether a test was checked against a deliberately broken build, when that is known.
  A test never seen to fail is not yet evidence.
- A check the change called for but that was skipped, and why.
