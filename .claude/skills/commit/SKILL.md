---
name: commit
description: Inspect the working tree, resolve open questions, then commit
argument-hint: "[how to commit — optional]"
disable-model-invocation: true
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git add:*)
  - Bash(git reset)
  - Bash(git apply:*)
  - Bash(git hash-object:*)
  - Bash(git update-index:*)
  - Bash(git ls-files:*)
  - Bash(git commit:*)
---

Commit the current work.
If `$ARGUMENTS` gives instructions, follow them.
Every change in the working tree is a candidate: staged, unstaged and untracked.
The state of the index at the start does not matter.
Make every planned commit before you stop.

## Context

- Status: !`git status --short`
- Unstaged: !`git diff --stat`
- Staged: !`git diff --cached --stat`

## Steps

1. **Read every change.**
  Run `git diff HEAD` for tracked files.
  Open each `??` path from the status above.
  If the diff alone does not show *why* something changed,
  read the surrounding code until the reason is clear.
  Examples: a guard, a deleted branch, a new flag.
2. **Ask, one question at a time.**
  Send one question and wait for the answer.
  Use that answer to choose the next question.
  Continue until no open question remains.
  Ask in plain text, not with `AskUserQuestion`, and end your turn.
  The next dialog hides any text that you write right after an `AskUserQuestion` answer.
  Ask only what the repository cannot answer.
  Examples: why the work started, whether an apparent defect is intentional,
  whether to exclude a leftover debug change.
  Never ask what reading the code can answer.
  Also propose a split in this step.
  See `## Splitting`.
3. **Confirm the body.**
  Before you commit, show each planned commit to the user.
  The user decides the body of each commit.
  See `### Confirming the body`.
4. **Commit** what steps 2 and 3 decided.
  Follow `## Splitting` for the procedure and `## Message format` for the text.
5. **Declare the workflow finished.**
  List each commit with its hash and subject.
  Then report what remains in the working tree.

Don't run `make check`, the tests or the type checker.
The user runs them separately.
Never use `--no-verify` or `--amend` unless the user asks.
Never push.

## Splitting

If the diff mixes concerns that a reader would not expect together, propose one commit per concern.
Show the plan as an ordered list.
For each commit, give its subject and its paths or hunks.
Commit only what the user approves.

1. Save the original index: `git diff --cached > <scratchpad>/index-backup.patch`.
  If you abandon the run, restore the index with `git apply --cached` and this patch.
2. Run `git reset`.
  This empties the index and does not change the working tree.
3. For each planned commit, in order:
   - For whole files, including untracked files, run `git add <paths>`.
   - For part of a file:
     1. Copy the file into the scratchpad directory.
     2. Edit the copy to the state that this commit needs.
     3. Run `git update-index --add --cacheinfo <mode>,$(git hash-object -w <copy>),<path>`.
        Get `<mode>` from `git ls-files -s <path>`.
        For an untracked file, use `100644`.
   - Compare `git diff --cached --stat` with the plan.
     Then run `git commit -F <message-file>`.
4. Run `git status --short`.
  Every change that you intentionally did not commit must still be in the working tree.

## Message format

Write the message in English, even if the conversation uses another language.
Always write a subject line.
Write a body only when there is something to say.

### Subject

Write the subject in the imperative mood and in lower case.
Use 64 characters or fewer.

Add a prefix only when app users see no change.
Use one of `fix:`, `refactor:`, `perf:`, `test:`, `docs:` or `chore:`.
Use `chore(deps):` for dependency updates.
Use no prefix for work that adds or changes behaviour.
Examples: `add Escape hotkey to clear mode`, `render ArrowItem in canvas`.
This repository does not use `feat:`.

### Body

Wrap the body at 75 columns.
Include only the *why* that nothing else records.
For example:

- The constraint that required this design.
- A rejected alternative and its cost.
- Code that looks like an oversight but is intentional.

**Omit the body when there is no such point.** Most commits have none.
The diff already shows what changed.
A body that repeats the subject is worse than no body.
A subject and the trailer alone make a complete message.

State only facts that you verified.

### Confirming the body

The user decides the body, so never decide it alone.
For each planned commit, show the subject.
Then show the draft body exactly as you would commit it, already wrapped.
If the diff needs no body, say so instead.
Number the draft points in their order in the body.
For each point, say in one line why it is necessary.
If there is no draft, say in one line why the diff is enough.
Write each point so that it makes sense without the others.
The user can keep any subset.
Then ask which numbers to keep, if any, and end your turn.
The body is the chosen points, joined in their original order.
Handle one commit at a time, as in step 2.
Commit only what the user confirmed.
