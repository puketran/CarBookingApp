# Feedback → Triage → Update Loop

How feedback gets collected, reviewed, and turned into work. Same day-file loop we use to build the app.

---

## 1. Collect (in-app)

Any logged-in user clicks **Feedback** in the header → picks a type (🐞 bug / 💡 idea / ❓ question / other) → writes a message. It's stored in the `feedback` table with who sent it and which page they were on.

- Submit: `POST /api/v1/feedback` (any authenticated user)
- Review: `GET /api/v1/feedback?status=new` (admin / super_admin) — also in the UI at **/admin/feedback**
- Update status: `PATCH /api/v1/feedback/:id` with `{status}` (admin)

Statuses: `new` → `triaged` → `done` (or `wontfix`).

---

## 2. Triage (admin, periodically)

Open **/admin/feedback** (or `GET /feedback?status=new`). For each `new` item, decide:

| Decision | Meaning | Next step |
|---|---|---|
| **Bug** | something is broken vs. a requirement | add a task to the next day file; link a test case in [test-cases.md](test-cases.md) |
| **Change** | tweak to existing behavior | add a task to the next day file |
| **New feature** | net-new scope | add to the MVP/backlog; create a day file when scheduled |
| **Question / dup / noise** | no code change | answer the user; mark `wontfix` or `done` |

Mark each item `triaged` once decided, `done` when shipped.

---

## 3. Turn it into work (new day file)

Bugs and changes become tasks in a **new `todos/dNN.md`** (continue the numbering — the prototype used d01–d04, so feedback rounds start at **d05**). Use the same three-part shape the build days use, then drive it with `/check-todo`:

```markdown
# Day 5 — Feedback round 1 (YYYY-MM-DD)

## 🎯 Goal (achieve by end of day)
Resolve the triaged bugs/changes from feedback round 1.

## ✅ Task status
- [ ] FB#12 (bug): availability shows a taken slot after cancel — fix BOOK-19 (delete-on-cancel)
- [ ] FB#15 (change): show driver phone on My Bookings
- [ ] 👤 Confirm with requester that FB#18 is out of scope

## 🔧 Implementation details
- FB#12 → ... (files, approach), add/Update test case BOOK-xx
- FB#15 → ...
```

Then:
```bash
node .claude/skills/check-todo/todo.mjs status todos/d05.md   # or just: /check-todo on d05
```
`/check-todo` reads the day, plans, asks what to implement, does it, ticks status, and surfaces a 👤 banner for anything needing you. When an item ships, set its feedback row to `done` (PATCH or the UI dropdown).

---

## 4. Close the loop

- Every shipped fix gets (or updates) a row in [test-cases.md](test-cases.md) so the regression is covered.
- The feedback item's status reaches `done`; the requester can see it's handled.

---

### Quick reference

```
in-app Feedback button → feedback table
        → admin reviews at /admin/feedback (status=new)
        → triage: bug/change → tasks in todos/dNN.md ; feature → backlog ; noise → wontfix
        → /check-todo drives the day file
        → ship → mark feedback done + add test case
```
