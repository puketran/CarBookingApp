---
name: check-todo
description: Work through a day's todo file (todos/dNN.md) for the CarBooking project. Reads the day, plans it, asks the user which tasks to do, implements them, ticks the checkboxes, and writes a highlighted "USER ACTION REQUIRED" banner at the top. Use when asked to "check the todo", "do day 1", "work on d01", "start the next day", or "what's left in the todo".
---

# check-todo — drive the CarBooking day plans

The prototype is broken into day files: `todos/d01.md` … `todos/d04.md`. Each has a
**🎯 Goal**, a **✅ Task status** checklist (`- [ ]` / `- [x]`), and **🔧 Implementation details**.
This skill runs one day file through a fixed loop and keeps its status honest.

The harness is **`.claude/skills/check-todo/todo.mjs`** (Node, no deps). It reads/writes the
day file so you don't hand-parse checkboxes. **All paths below are relative to the repo root.**

## The loop (run in order)

1. **Read & report.** Parse the requested day file:
   ```bash
   node .claude/skills/check-todo/todo.mjs status todos/d01.md
   ```
   This prints JSON: `goal`, `progress` (`done/total`), every `task` with its done flag, and
   `userActions` (lines tagged for the human — see Conventions). Read the file's
   **🔧 Implementation details** too; the driver only extracts the checklist.

2. **Make a plan.** From the un-done tasks + the implementation details, write a short ordered
   plan: what you'll build, in what order, which tasks each step closes.

3. **Wait for the user's selection.** Use `AskUserQuestion` to ask which tasks/scope to do now
   (e.g. "all remaining", "just the DB migrations", "skip the Railway-dependent ones").
   **Do not implement before they choose.** 👤 user-action tasks (things only the human can do,
   like creating a Railway account) cannot be implemented by you — exclude them from your own work.

4. **Implement** the selected tasks. Real code, in the repo.

5. **Update status.** Tick each finished task:
   ```bash
   node .claude/skills/check-todo/todo.mjs check todos/d01.md "config/slots.js"
   ```
   The substring matches the task text (case-insensitive); it flips every matching `- [ ]` → `- [x]`.
   Use `uncheck` to reverse. Re-run `status` to confirm the new `progress`.

6. **Write the highlighted banner — always last.** Collect what still needs the human (un-done
   👤 tasks, plus anything you got blocked on), write one concise line each, and pipe them in:
   ```bash
   printf '%s\n' \
     'Create a Railway project and add the MySQL plugin' \
     'Paste the generated DATABASE_URL into server/.env' \
     | node .claude/skills/check-todo/todo.mjs banner todos/d01.md
   ```
   This rewrites a `🚨 USER ACTION REQUIRED` blockquote just under the H1 title. It's
   **idempotent** — re-running replaces the old banner. Piping **no lines removes the banner**
   (use this when nothing is left for the user):
   ```bash
   : | node .claude/skills/check-todo/todo.mjs banner todos/d01.md
   ```
   Finally, tell the user the new progress and point at the banner if one was written.

## Driver commands

| Command | Effect |
|---|---|
| `status <file>` | JSON: goal, `done/total`, tasks[], userActions[] |
| `check <file> "<substr>"` | matching tasks `[ ]` → `[x]`; prints count |
| `uncheck <file> "<substr>"` | matching tasks `[x]` → `[ ]` |
| `banner <file>` | rewrite the top banner from stdin (one item per line; empty stdin removes it) |

## Conventions

- **Tasks** are markdown checkboxes: `- [ ] text` / `- [x] text`.
- **User-action items** = lines the human must do. Mark them with the `👤` emoji (canonical) or
  `[USER]`; the driver also heuristically catches `(manual` and `you do this`. The banner items
  are sanitized (leading numbering and `👤` stripped, deduped) so you can pipe raw `userActions`
  straight through if you don't want to hand-write them.
- **Banner markers**: `<!-- USER-ACTION:START -->` … `<!-- USER-ACTION:END -->`. Don't delete these
  by hand — `banner` manages the block between them.

## Gotchas

- The driver **only** parses the checklist + the goal line. Implementation details (SQL, code
  blocks, sub-bullets) are for *you* to read — `status` won't surface them.
- `check`/`uncheck` match a **substring** of the task text, so a vague needle can tick more than
  one task. It prints how many it changed — verify the count is what you expected.
- `goal` is captured as the **first non-empty line after the first heading containing "Goal"** —
  keep one prose sentence directly under `## 🎯 Goal`, not a blank line or a code fence.
- Running `banner` then `status` re-detects the banner's own `👤` lines as userActions if you
  used `👤` inside it — that's why the loop puts the banner **last** and why banner items are
  written without the marker.

## Verify

```bash
# round-trip on a day file without leaving a mess
node .claude/skills/check-todo/todo.mjs status  todos/d01.md
node .claude/skills/check-todo/todo.mjs check    todos/d01.md "config/slots.js"   # 0->1 of N
node .claude/skills/check-todo/todo.mjs uncheck  todos/d01.md "config/slots.js"   # back to start
```
