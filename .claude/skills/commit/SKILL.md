---
name: commit
description: Inspect the working tree, settle open questions one at a time, then commit
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

Commit the current work, following `$ARGUMENTS` where it says anything.
Every change in the tree is a candidate — staged, unstaged and untracked alike —
whatever happened to sit in the index when this started.
Don't stop until every planned commit is made.

## Context

- Status: !`git status --short`
- Unstaged: !`git diff --stat`
- Staged: !`git diff --cached --stat`

## Steps

1. **Read every change.**
  `git diff HEAD` for what is tracked, and open each `??` path from the status above.
  Where the diff alone doesn't say *why* something changed — a guard, a deleted branch, a new flag —
  open the surrounding code until it does.
2. **Ask, one question at a time.**
  Send one question, wait for the answer, and let that answer decide the next one.
  Keep going until nothing is open.
  Use `AskUserQuestion` for closed questions or when the answer can be predicted.
  Return the turn for the others.
  Ask only what the repository cannot answer: what prompted the work,
  whether something that reads like a defect is deliberate,
  whether a leftover meant for debugging should be left out.
  Never ask what reading the code would settle.
  Propose a split here too — see `## Splitting`.
3. **Confirm the body.**
  Before committing anything, go through the planned commits
  and let the user decide what goes into each body — see `## Message format`.
4. **Commit** what steps 2 and 3 settled,
  by the mechanics in `## Splitting` and the wording in `## Message format`.
5. **Declare the workflow finished.**
  List each commit made, hash and subject, and say what is still left in the working tree.

Don't run `make check`, the tests or the type checker; the user runs those separately.
Never use `--no-verify` or `--amend` unless asked, and never push.

## Splitting

Propose one commit per concern whenever the diff spans concerns a reader wouldn't expect together.
Show the plan as an ordered list — subject, plus the paths or hunks each commit takes —
and commit only what the user agreed to.

`git add -p` can't run here, so stage by patch instead:

1. Save the index as it arrived: `git diff --cached > <scratchpad>/index-backup.patch`.
  Applying that with `git apply --cached` is the way back if the run is abandoned.
2. `git reset`.
  This empties the index and touches no file in the working tree.
3. For each planned commit, in order:
   - Whole files, untracked ones included: `git add <paths>`.
   - Part of a file: write just those hunks to a patch in the scratchpad directory,
     keeping the `diff --git` and `@@` headers, then `git apply --cached <patch>`.
     The line counts in an `@@` header must match the hunk body or `git apply` refuses the patch;
     correct the counts rather than working around the refusal.
   - Check `git diff --cached --stat` against the plan, then `git commit -F <message-file>`.
4. `git status --short`.
  Everything not committed on purpose must still be there.

## Message format

Written in English, whatever language the conversation is in.
A subject line always; a body only when there is something to say.

### Subject

Imperative, lower case, 64 characters at most.

Prefix it only when nothing a user of the app can see changes: `fix:`, `refactor:`, `perf:`,
`test:`, `docs:`, `chore:`, with `chore(deps):` for dependency bumps.
Work that adds or changes behaviour takes no prefix at all — `add Escape hotkey to clear mode`,
`render ArrowItem in canvas`.
This repository has no `feat:`.

### Body

Wrapped at 75 columns.
Carry only the *why* that would otherwise be lost: the constraint that forced this shape,
the alternative that was rejected and what it cost,
the thing that reads like an oversight and isn't.

**Leave the body out entirely when there is no such point**, and most commits have none.
The diff already says what changed,
so a paragraph that paraphrases the subject is worse than silence.
A subject and the trailer alone is a finished message.

Claim only what was checked.

### Confirming the body

The body is the user's call, so never decide it alone.
For each planned commit, show the subject and then either the body drafted for it,
verbatim and already wrapped, or a statement that nothing in the diff calls for one.
Say in one line why each point earns its place — or why the diff speaks for itself.
Then ask with a multi-select `AskUserQuestion`: one option per drafted point,
in the order they would appear, plus a final option for no body at all.
Draft each point so that it stands alone, since any subset may come back.
The answer is the body: the chosen points, concatenated in that order.
Spell the points out in the message first — `preview` does not render on a multi-select,
so the options carry only their labels.
Handle one commit at a time, the same way as step 2's questions.
Commit only what came back confirmed.
