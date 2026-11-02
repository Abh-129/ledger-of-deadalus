# Builder rules (every builder reads this first; reviewers check against it)

Repo (absolute): /home/user/ledger-of-deadalus
Branch: claude/practical-mendel-la0n8n (the cloud session branch; it replaces build/daedalus-v2 named in plan.md). Read plan/decisions.md (never do anything REJECTED), your task in plan/plan.md (Global Constraints, Interfaces, Off-limits, your task), and the last 40 lines of plan/board.md.

## Coding guidelines (Karpathy-style, anti-slop)
1. Think before coding. State your assumptions in the report. If the task is ambiguous, ask via status needs_context instead of guessing.
2. Simplicity first. Write the minimum code that meets the done criteria. No speculative features, no abstraction with one user, no config objects, no "for later". If 200 lines could be 50, write 50.
3. Surgical changes. Touch only the files your task lists. Do not reformat, rename or "improve" code you were not asked to change. Remove only what your change made unused (and what the task tells you to delete).
4. Goal-driven. Turn the done criteria into checks, run them, and report the evidence (command + result). No claim without a check.

## Parallel safety
- Other builders work in this same checkout at the same time on other files. Never edit a file outside your task's file list. Never run git stash, git reset, git checkout of files, or git add -A / git add . (add only your own paths).
- Commit only your files: `git add <your paths> && git commit -m "<task id>: <summary>"`. If git reports index.lock, wait a few seconds and retry.
- `npx tsc --noEmit` may show errors from other lanes' in-progress files; you are responsible only for errors in your files and for not breaking the shared Interfaces.
- Never npm install, never deploy, never push.
- Dev server: do not start one on 5173; use the port main gives you (`npx vite --port <port> --strictPort`) and kill it when done.
- Screenshots: `NODE_PATH=$(npm root -g) node /tmp/claude-0/-home-user-ledger-of-deadalus/91234581-2a83-50c9-ae3f-66d32e0ac6cd/scratchpad/shot.cjs <port> "at=<key>" <out.png> [enters] [waitMs] [keys]` (1280x720, headless swiftshader, about 2 fps so fps numbers from it are not real; Enter advances one caption; keys like "w:1500,ArrowLeft:400"). It prints console errors and the DOM text. Read the png to look at it.
- Commit message ends with a blank line then:
  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01HgZGDSDqA1vYXDUdhqfGPt

## Style
- Match surrounding code: terse, comments only where intent is non-obvious, `ponytail:` comment on deliberate simplifications.
- Myth text only from src/content/copy.ts. Ochre only for "solved", red only for "cost".
- No em dashes or en dashes in anything you write.

## Report (end of task)
status: done | done_with_concerns | blocked | needs_context; files changed; commits (SHA); checks run with results; concerns; one BOARD line `- [HH:MM] <lane>/<task>: ... | @asks`.
