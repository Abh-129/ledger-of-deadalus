# Builder rules (every builder reads this first; reviewers check against it)

Repo (absolute): C:/Users/abhin/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/87181ba2-e332-42bd-ba77-f8459bc56d2f/88a86d48-7720-4064-ac13-22740346927a/scratch-2026-11-01-ceb595/ledger-of-daedalus
Branch: build/daedalus-v2. Read plan/decisions.md (never do anything REJECTED), your task in plan/plan.md (Global Constraints, Interfaces, Off-limits, your task), and the last 40 lines of plan/board.md.

## Coding guidelines (Karpathy-style, anti-slop)
1. Think before coding. State your assumptions in the report. If the task is ambiguous, ask via status needs_context instead of guessing.
2. Simplicity first. Write the minimum code that meets the done criteria. No speculative features, no abstraction with one user, no config objects, no "for later". If 200 lines could be 50, write 50.
3. Surgical changes. Touch only the files your task lists. Do not reformat, rename or "improve" code you were not asked to change. Remove only what your change made unused (and what the task tells you to delete).
4. Goal-driven. Turn the done criteria into checks, run them, and report the evidence (command + result). No claim without a check.

## Parallel safety
- Other builders work in this same checkout at the same time on other files. Never edit a file outside your task's file list. Never run git stash, git reset, git checkout of files, or git add -A / git add . (add only your own paths).
- Commit only your files: `git add <your paths> && git commit -m "<task id>: <summary>"` ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. If git reports index.lock, wait a few seconds and retry.
- `npx tsc --noEmit` may show errors from other lanes' in-progress files; you are responsible only for errors in your files and for not breaking the shared Interfaces.
- Never npm install, never deploy, never push.
- Dev server: do not start one on 5173; if you need to look at the page, use port 5180 + your lane number and stop it when done.

## Style
- Match surrounding code: terse, comments only where intent is non-obvious, `ponytail:` comment on deliberate simplifications.
- Myth text only from src/content/copy.ts. Ochre only for "solved", red only for "cost".
- No em dashes or en dashes in anything you write.

## Report (end of task)
status: done | done_with_concerns | blocked | needs_context; files changed; commits (SHA); checks run with results; concerns; one BOARD line `- [HH:MM] <lane>/<task>: ... | @asks`.
