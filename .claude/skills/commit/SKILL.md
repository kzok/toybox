---
name: commit
description: Inspect the working tree, settle open questions one at a time, then commit — splitting
  the work into several commits when the diff spans unrelated concerns
argument-hint: [how to commit — omit to leave it open]
disable-model-invocation: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git add:*)
  - Bash(git reset)
  - Bash(git apply:*)
  - Bash(git commit:*)
---

Commit the current work, following `$ARGUMENTS` where it says anything. Every change in the tree is
a candidate — staged, unstaged and untracked alike — whatever happened to sit in the index when
this started. Don't stop until every planned commit is made.

## Context

- Status: !`git status --short`
- Unstaged: !`git diff --stat`
- Staged: !`git diff --cached --stat`

## Steps

1. **Read every change.** `git diff HEAD` for what is tracked, and open each `??` path from the
   status above. Where the diff alone doesn't say *why* something changed — a guard, a deleted
   branch, a new flag — open the surrounding code until it does.
2. **Ask, one question at a time.** Send one question, wait for the answer, and let that answer
   decide the next one. Keep going until nothing is open. Use `AskUserQuestion` for closed
   questions and return the turn for open ones. Ask only what the repository cannot answer: what
   prompted the work, whether something that reads like a defect is deliberate, whether a leftover
   meant for debugging should be left out. Never ask what reading the code would settle. Propose a
   split here too — see `## Splitting`.
3. **Commit** what step 2 settled, by the mechanics in `## Splitting` and the wording in
   `## Message format`.
4. **Declare the workflow finished.** List each commit made, hash and subject, and say what is
   still left in the working tree.

Don't run `make check`, the tests or the type checker; the user runs those separately. Never use
`--no-verify` or `--amend` unless asked, and never push.

## Splitting

Propose one commit per concern whenever the diff spans concerns a reader wouldn't expect together.
Show the plan as an ordered list — subject, plus the paths or hunks each commit takes — and commit
only what the user agreed to.

`git add -p` can't run here, so stage by patch instead:

1. Save the index as it arrived: `git diff --cached > <scratchpad>/index-backup.patch`. Applying
   that with `git apply --cached` is the way back if the run is abandoned.
2. `git reset`. This empties the index and touches no file in the working tree.
3. For each planned commit, in order:
   - Whole files, untracked ones included: `git add <paths>`.
   - Part of a file: write just those hunks to a patch in the scratchpad directory, keeping the
     `diff --git` and `@@` headers, then `git apply --cached <patch>`. The line counts in an `@@`
     header must match the hunk body or `git apply` refuses the patch; correct the counts rather
     than working around the refusal.
   - Check `git diff --cached --stat` against the plan, then `git commit -F <message-file>`.
4. `git status --short`. Everything not committed on purpose must still be there.

## Message format

Written in English, whatever language the conversation is in. A subject line always; a body only
when there is something to say.

### Subject

Imperative, lower case, 64 characters at most.

Prefix it only when nothing a user of the app can see changes: `fix:`, `refactor:`, `perf:`,
`test:`, `docs:`, `chore:`, with `chore(deps):` for dependency bumps. Work that adds or changes
behaviour takes no prefix at all — `add Escape hotkey to clear mode`, `render ArrowItem in canvas`.
This repository has no `feat:`.

### Body

Wrapped at 75 columns. Carry only the *why* that would otherwise be lost: the constraint that
forced this shape, the alternative that was rejected and what it cost, the thing that reads like an
oversight and isn't.

**Leave the body out entirely when there is no such point**, and most commits have none. The diff
already says what changed, so a paragraph that paraphrases the subject is worse than silence. A
subject and the trailer alone is a finished message.

Claim only what was checked.
