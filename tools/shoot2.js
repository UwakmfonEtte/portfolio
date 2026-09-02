const { createRequire } = require('module');
const { chromium } = createRequire('c:/Users/Hp/Downloads/playwright-test/')('playwright');
const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'raw');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
  const p = await ctx.newPage();

  await p.goto('https://www.kinsman.live/', { waitUntil:'networkidle', timeout:45000 });
  await p.waitForTimeout(2500);

  // Walk the nav and shoot each section the site actually exposes.
  const items = await p.$$eval('a, button', els =>
    els.map(e => (e.textContent||'').trim()).filter(t => /^(bridge|whitepaper|about)$/i.test(t))
  );
  console.log('nav found:', items.join(', '));

  for (const label of ['Bridge']) {
    try {
      const el = await p.getByText(new RegExp('^'+label+'$','i')).first();
      await el.click({ timeout: 8000 });
      await p.waitForTimeout(3000);
      const f = path.join(OUT, 'kinsman-'+label.toLowerCase()+'.png');
      await p.screenshot({ path: f });
      console.log('  shot kinsman-'+label.toLowerCase()+'  '+(fs.statSync(f).size/1024).toFixed(0)+'KB');
    } catch(e) { console.log('  '+label+' failed:', e.message.split('\n')[0].slice(0,70)); }
  }

  await b.close();
})().catch(e=>console.error(e.message));
