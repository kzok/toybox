---
name: update-pr-description
description: Draft a pull request description — and its title when stale — from the diff and apply
  it to GitHub after approval
argument-hint: [PR url or number — omit for the current branch's PR]
disable-model-invocation: true
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*)
---

Write the description for the pull request in `$ARGUMENTS` — or the current branch's pull request
when that is empty — and apply it once approved. Stop if there is none.

## Steps

1. **Read it.** `gh pr view <n> --json title,body,headRefName,baseRefName,commits` and
   `gh pr diff <n>`. Open the changed files wherever the diff alone doesn't say *why* something
   changed: a guard, a deleted handler, an added flag.
2. **Ask**, in one round, for what the repository can't answer: the related issue URL, what
   prompted the work, and whether anything that reads like a defect is deliberate. Draft with a
   placeholder rather than block when the user would rather fill it in themselves.
3. **Draft** the body to a scratch file in the scratchpad directory, following `## Format`. Draft a
   title as well when the existing one no longer says what the diff does; leave it alone otherwise.
4. **Get approval in plan mode.** `EnterPlanMode` only after the draft file is written. Put the
   drafted body verbatim, the title, and the existing body when there is one up for approval with
   `ExitPlanMode`. Apply nothing until that plan is approved.
5. **Apply** with `gh pr edit <n> --body-file <draft>`, adding `--title <title>` only when step 3
   drafted one, then read it back to confirm.

`allowed-tools` lists only the read-only `gh` calls on purpose: everything else — writing the
draft, asking the user, editing the pull request — is meant to go through a permission prompt.

Claim only what was checked.

## Format

Written in English, whatever language the conversation is in. These sections in order. Drop one
that has nothing to say, except `Related materials`, which always stays.

### Related materials

Bare URLs as a bullet list, starting with the issue the work came from. A single `- N/A` bullet
when there is nothing to link.

### Background

Two or three sentences: the state the code was in and what that cost. Not a summary of the
change.

### What's done

What changed, and why it had to change that way. Use `###` subsections when the pull request
spans concerns a reader wouldn't expect together.

Lead with what someone needs in order to review it — a table of the new keys, the new function,
the new flag — then the parts of the diff that look arbitrary without their reason.

### Special notes

Optional. Behaviour that looks like an oversight and isn't. Open with a line saying so — *"Both
of these are known and deliberate, not oversights"* — or the reviewer skims the section and files
the issue anyway.

### What's tested

- Which tests cover it, and where they live.
- Whether they were checked against a deliberately broken build, when that is known. A test never
  seen to fail is not yet evidence.
- What was **not** run, and why.
