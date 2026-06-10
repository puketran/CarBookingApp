#!/usr/bin/env node
// todo.mjs — driver for the check-todo skill.
// Parses a todos/dNN.md day file and reports goal / task status / user-action
// items, ticks checkboxes, and (re)generates the highlighted banner at the top.
//
// Usage:
//   node todo.mjs status  <file>                 print goal, progress, tasks, user-actions (JSON)
//   node todo.mjs check    <file> "<substring>"  set matching task(s) [ ] -> [x]
//   node todo.mjs uncheck  <file> "<substring>"  set matching task(s) [x] -> [ ]
//   node todo.mjs banner   <file> < items.txt    rewrite the USER-ACTION banner (one item per stdin line; empty = remove)
//
// Conventions:
//   - Task lines:  "- [ ] ..."  or  "- [x] ..."   (under any "Task status" heading, but matched repo-wide)
//   - User-action: a task/detail line containing the 👤 marker, the token [USER],
//     or the heuristic phrase "(manual" / "you do this".
//   - Banner is delimited by HTML markers so regeneration is idempotent:
//       <!-- USER-ACTION:START --> ... <!-- USER-ACTION:END -->

import { readFileSync, writeFileSync } from 'node:fs';

const BANNER_START = '<!-- USER-ACTION:START -->';
const BANNER_END = '<!-- USER-ACTION:END -->';
const TASK_RE = /^(\s*[-*]\s*)\[( |x|X)\]\s+(.*)$/;
const USER_MARKERS = ['👤', '[USER]'];
const USER_HEURISTICS = ['(manual', 'you do this'];

function isUserAction(text) {
  const low = text.toLowerCase();
  return (
    USER_MARKERS.some((m) => text.includes(m)) ||
    USER_HEURISTICS.some((h) => low.includes(h))
  );
}

function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split('\n');
  const tasks = [];
  const userActions = [];
  let goal = null;
  let inGoal = false;

  for (const line of lines) {
    if (/^#+\s/.test(line)) {
      inGoal = /goal/i.test(line); // capture first non-empty line after a Goal heading
      continue;
    }
    if (inGoal && goal === null && line.trim()) goal = line.trim();

    const m = line.match(TASK_RE);
    if (m) {
      const done = m[2].toLowerCase() === 'x';
      const text = m[3].trim();
      tasks.push({ done, text });
      if (isUserAction(text)) userActions.push(text);
    } else if (isUserAction(line) && line.trim() && !line.includes('USER-ACTION:')) {
      // detail lines (not checkboxes) that call for user action
      userActions.push(line.replace(/^[\s>*-]+/, '').trim());
    }
  }

  const done = tasks.filter((t) => t.done).length;
  return { file, goal, total: tasks.length, done, tasks, userActions: [...new Set(userActions)], raw, lines };
}

function setChecks(file, substr, value) {
  const { lines } = parse(file);
  const needle = substr.toLowerCase();
  let n = 0;
  const out = lines.map((line) => {
    const m = line.match(TASK_RE);
    if (m && m[3].toLowerCase().includes(needle)) {
      n++;
      return `${m[1]}[${value ? 'x' : ' '}] ${m[3]}`;
    }
    return line;
  });
  writeFileSync(file, out.join('\n'));
  return n;
}

function rewriteBanner(file, items) {
  let { raw } = parse(file);
  // strip an existing banner (and a trailing blank line) if present
  const re = new RegExp(`${BANNER_START}[\\s\\S]*?${BANNER_END}\\n?`, 'g');
  raw = raw.replace(re, '');

  // sanitize: drop leading list numbering and the 👤 marker, trim, dedupe
  const clean = [
    ...new Set(items.map((i) => i.replace(/^\d+[.)]\s*/, '').replace(/^👤\s*/, '').trim()).filter(Boolean)),
  ];

  if (clean.length) {
    const block =
      `${BANNER_START}\n` +
      `> 🚨 **USER ACTION REQUIRED**\n` +
      clean.map((i) => `> - ${i}`).join('\n') +
      `\n${BANNER_END}\n\n`;
    // insert after the first H1 title line if there is one, else at very top
    const lines = raw.split('\n');
    const h1 = lines.findIndex((l) => /^#\s/.test(l));
    if (h1 >= 0) {
      lines.splice(h1 + 1, 0, '', block.trimEnd());
      raw = lines.join('\n');
    } else {
      raw = block + raw;
    }
  }
  writeFileSync(file, raw);
  return clean.length;
}

const [, , cmd, file, arg] = process.argv;
if (!cmd || !file) {
  console.error('usage: node todo.mjs <status|check|uncheck|banner> <file> [substring]');
  process.exit(2);
}

switch (cmd) {
  case 'status': {
    const r = parse(file);
    console.log(
      JSON.stringify(
        { file: r.file, goal: r.goal, progress: `${r.done}/${r.total}`, tasks: r.tasks, userActions: r.userActions },
        null,
        2,
      ),
    );
    break;
  }
  case 'check': {
    if (!arg) { console.error('check needs a substring'); process.exit(2); }
    console.log(`checked ${setChecks(file, arg, true)} task(s) matching "${arg}"`);
    break;
  }
  case 'uncheck': {
    if (!arg) { console.error('uncheck needs a substring'); process.exit(2); }
    console.log(`unchecked ${setChecks(file, arg, false)} task(s) matching "${arg}"`);
    break;
  }
  case 'banner': {
    const items = readFileSync(0, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
    const n = rewriteBanner(file, items);
    console.log(n ? `wrote banner with ${n} item(s)` : 'removed banner (no user actions)');
    break;
  }
  default:
    console.error(`unknown command: ${cmd}`);
    process.exit(2);
}
