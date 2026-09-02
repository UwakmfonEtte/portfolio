# UwakmfonAbasi's Portfolio

A single page. Live products with working links, three interactive walkthroughs of systems that
are in private use, and the testing work.

## Layout

```
site/               the deployed site — this is what Vercel serves
  index.html        everything: markup, styles, and the demo engines
  img/              web-sized WebP screenshots
dist/               a single self-contained file, images inlined, for sharing as one document
raw/                source screenshots at 2880x1800 (gitignored — 5MB)
tools/              capture scripts: screenshots, and seeding a throwaway tracker instance
```

`site/index.html` is the source of truth. It is one file on purpose: the demos are tightly coupled
to the markup they drive, and splitting them across files made the merge step the place bugs hid.

## Working on it

```powershell
node serve.js            # http://localhost:4180
node build-art.js        # raw/ screenshots -> site/img WebP  (needs sharp)
node build-standalone.js # site/ -> dist/index.html with images inlined
```

**`site/img` is committed.** `raw/` is not, so Vercel could not regenerate the images even if it
tried — which is why the build commands are empty in `vercel.json` and the output is committed.

## The demos

Three walkthroughs of systems with no public URL, since they are in use by real businesses:

- **Fonz Naturals** — a WhatsApp shop assistant. Quotes from a catalogue, computes wholesale
  tiers, tells apart a shop policy from the owner's private note, and stands down when she
  starts typing.
- **Business Ops Tracker** — the real interface, rebuilt. Stock in, restock without duplicating,
  a sale drawing the count down, receipt, expenses, and the month that follows from all of it.
- **Enwongo-Abasi** — a medical centre front desk. FAQs, live slot calendar, booking capture,
  and refusing to answer a clinical question.

Each is chaptered and the chapter strip is clickable, so a visitor can sit on the one part that
matters to them rather than watching the whole run.

Every figure shown is computed, not written down — the tracker's margin is its prices multiplied
out. The conversations are invented and the page says so beneath each demo.

## Deploying

Pushing to `main` redeploys. Vercel builds nothing and installs nothing; it serves `site/`.

```powershell
git add -A; git commit -m "..."; git push
```
# portfolio
