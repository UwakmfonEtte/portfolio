/**
 * Screenshots the seeded, isolated Business Tracker instance.
 *
 * Password is passed in at runtime so a credential never lands in a committed file. The instance
 * this talks to is a throwaway on :3011 with its own database — the real install is never opened.
 *
 *   node shoot-tracker.js <owner-password>
 */
const { createRequire } = require('module');
const { chromium } = createRequire('c:/Users/Hp/Downloads/playwright-test/')('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'raw');
const BASE = 'http://localhost:3011';
const PW = process.argv[2];

(async () => {
  if (!PW) throw new Error('Pass the owner password as the first argument.');

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);

  const shot = async (name) => {
    const f = path.join(OUT, name + '.png');
    await p.screenshot({ path: f });
    console.log('  ' + name.padEnd(18) + (fs.statSync(f).size / 1024).toFixed(0) + 'KB');
  };

  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p.waitForTimeout(1500);

  // Target #login-password specifically. The setup screen, login screen, main layout and three
  // modals all live in the DOM at once and are toggled with .hidden, so a bare
  // input[type=password] matches a 0x0 hidden setup field and every interaction times out.
  await p.fill('#login-password', PW);
  await p.click('#login-form button[type=submit]');
  await p.waitForTimeout(4500);

  if (await p.isVisible('#login-screen')) {
    const err = await p.textContent('#login-error').catch(() => '');
    throw new Error('Still on the login screen. ' + (err || 'password rejected?'));
  }
  console.log('signed in');

  await shot('tracker');

  const labels = await p.$$eval('button, a, [role=tab], nav *', (els) =>
    [...new Set(
      els
        .map((e) => (e.textContent || '').trim())
        .filter((t) => t && t.length < 20 && /report|inventory|sales|expense|dashboard|receipt|stock|month|year/i.test(t))
    )].slice(0, 8)
  );
  console.log('nav:', labels.join(' | ') || '(none)');

  let n = 2;
  for (const label of labels) {
    try {
      const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await p.getByText(new RegExp('^' + safe + '$', 'i')).first().click({ timeout: 4000 });
      await p.waitForTimeout(2200);
      await shot('tracker-' + n++);
    } catch (e) {
      console.log('  (skipped ' + label + ')');
    }
  }

  await b.close();
  console.log('done');
})().catch((e) => {
  console.error('FAILED: ' + e.message.split('\n')[0]);
  process.exitCode = 1;
});
