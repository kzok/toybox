---
name: write-pr-description
description: Draft a pull request description from the diff, and a new title when the old one is
  outdated. Apply them to GitHub directly.
argument-hint: "[PR URL or number]"
disable-model-invocation: true
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr edit:*)
---

Write the description for the pull request in `$ARGUMENTS`.
Stop if `$ARGUMENTS` is empty.
Apply the description to GitHub without asking for approval first.

## Steps

1. **Check that the pull request is open.**
  Run `gh pr view <n> --json state,isDraft`.
  If `state` is not `OPEN`, stop and tell the user why.
  Do not change a merged or closed pull request.
  A draft is `OPEN` with `isDraft: true`, so you can edit it.
2. **Read the pull request.**
  Run `gh pr view <n> --json title,body,headRefName,baseRefName,commits` and `gh pr diff <n>`.
  If the diff alone does not show *why* something changed,
  read the changed files until the reason is clear.
  Examples: a guard, a deleted handler, an added flag.
3. **Ask** what the repository cannot answer.
  Examples: the related issue URL, why the work started, what the user checked beyond CI,
  whether an apparent defect is intentional.
  Ask as many rounds as necessary.
  If an answer raises a new question, ask it.
  If the user wants to write a part themselves, put a placeholder there and continue.
4. **Draft** the body in a file in the scratchpad directory.
  Follow `## Format`.
  If the current title is outdated, also draft a new title.
  Otherwise, keep the current title.
  A title is outdated if it does not describe everything that the diff does.
5. **Apply** the draft with `gh pr edit <n> --body-file <draft>`.
  Add `--title <title>` only if step 4 drafted a title.
  Then read the pull request again to confirm the change.
6. **Report** the result:
  the pull request URL, the new title if it changed, and the applied body.
  The user reviews the pull request on GitHub later.
  Give enough detail for the user to see what the new text replaced.

`gh pr edit` overwrites the body.
Anything that is only in the previous body is lost.
Keep every part of the previous body that is still true.

State only facts that you verified.

## Format

Write the description in English, even if the conversation uses another language.
Use the headings of `.github/pull_request_template.md` in the same order.
Follow the hint comment under each heading.
Remove all hint comments from the body.
Omit an optional section that has no content.

Add length to a section only for information that the diff cannot show.

- **Remove what a reviewer can find elsewhere**: the diff, the list of changed files,
  or the text of a changed doc.
- **One home per fact.**
  A table and the prose under it must not state the same fact.

### Background

Never invent the reason.

### What's changed

Start with what a reviewer needs.
Examples: a table of the new keys, the new function, the new flag.
Then explain the parts of the diff that look arbitrary without their reason.

### What's tested locally

Keep this section as short as the evidence.

- Checks beyond CI, such as manual checks in the app.
- Whether a test failed against an intentionally broken build, if that is known.
  A test that nobody saw fail is not evidence yet.
- A check that the change needed but nobody ran, and the reason.
