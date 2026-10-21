# An Academic Website, A Personal Universe

A personal academic homepage and intellectual archive — research, writings, a
working notebook, and a CV — built to be added to for years, one file at a time.

Adding an essay, a project, or a note means **creating one Markdown file**.
Nothing in `app/` or `components/` has to be touched.

---

## Contents

1. [Running the site](#1-running-the-site)
2. [Project structure](#2-project-structure)
3. [Changing your name and academic information](#3-changing-your-name-and-academic-information)
4. [Adding a research project](#4-adding-a-research-project)
5. [Publishing an essay](#5-publishing-an-essay)
6. [Creating a notebook entry](#6-creating-a-notebook-entry)
7. [Linking related content](#7-linking-related-content)
8. [Writing with mathematics, figures and footnotes](#8-writing-with-mathematics-figures-and-footnotes)
9. [The CV, and adding a PDF](#9-the-cv-and-adding-a-pdf)
10. [Changing typography and colours](#10-changing-typography-and-colours)
11. [The mathematical visualisation](#11-the-mathematical-visualisation)
12. [Deploying to Vercel](#12-deploying-to-vercel)
13. [Design and architecture notes](#13-design-and-architecture-notes)

---

## 1. Running the site

```bash
npm install     # once
npm run dev     # http://localhost:3000
npm run build   # production build — run this before deploying
npm run start   # serve the production build locally
npm run lint
```

Requires Node 20 or newer.

---

## 2. Project structure

```
site.config.ts          ← your name, affiliation, intro, links, CV file
content/                ← EVERYTHING YOU WRITE LIVES HERE
  research/*.mdx          one file per project
  writings/*.mdx          one file per essay
  notebook/NNN-*.mdx      one file per note, numbered
  pages/about.mdx         the About page
  cv.ts                   CV data (structured, not prose)
  */_template.mdx         copy these to start something new

app/                    ← routes; you will rarely edit these
  page.tsx                /            home
  about/                  /about
  research/               /research  + /research/[slug]
  writings/               /writings  + /writings/[slug]
  notebook/               /notebook  + /notebook/[slug]
  cv/ contact/ tags/      /cv /contact /tags + /tags/[tag]
  layout.tsx              fonts, metadata, header and footer
  globals.css             the whole design system
  sitemap.ts robots.ts    generated automatically from your content

components/
  site/                   Header, Footer
  content/                MDX renderer, Prose, Figure, Aside, Theorem, Ref
  ui/                     EntryRow, ConnectedIdeas, TableOfContents, …
  viz/                    WaveField (the homepage field), Mark

lib/
  content.ts              reads content/, builds the index and the relations
  types.ts                statuses, categories, collections
  toc.ts  links.ts  pages.ts

public/
  cv/                     put your CV PDF here
  figures/ papers/        images and attachments
```

The separation is deliberate: **content** in `content/`, **presentation** in
`app/globals.css`, **functionality** in `lib/` and `components/`.

---

## 3. Changing your name and academic information

Open [`site.config.ts`](site.config.ts). It is the only file with your identity in it.

```ts
name: "Iris [Surname]",
affiliation: "Rutgers University",
position: "Undergraduate, Mathematics & Physical Sciences",
url: "https://your-domain.com",      // used for metadata and the sitemap
headline: "Between the abstract and the tangible.",
intro: "Exploring mathematics and the physical sciences, …",
links: {
  email: "",      // "you@rutgers.edu"
  github: "",     // "https://github.com/you"
  scholar: "",
  orcid: "",
  linkedin: "",
},
```

**Any link left as `""` disappears completely** — from the contact page, the
footer and the CV. Nothing ever renders a dead link. Add extra channels with
`extraLinks: [{ label: "arXiv", href: "https://…" }]`.

Navigation order lives at the bottom of the same file (`navigation`).

---

## 4. Adding a research project

```bash
cp content/research/_template.mdx content/research/my-project.mdx
```

Edit the frontmatter, delete `draft: true`, and it appears at
`/research/my-project`.

```yaml
---
title: "Full project title"
subtitle: ""                     # optional, italic, under the title
summary: "One or two sentences."  # index pages and link previews
status: in-progress              # idea | in-progress | completed | publication
area: "Analytic Number Theory"
date: 2026-03-04
updated: 2026-05-20              # optional
keywords: [sieve methods, large sieve]
tags: [mathematics, number-theory]
related: [notebook/004-a-small-identity]
pdf: "/papers/preprint.pdf"      # optional; put the file in public/papers/
references:
  - "Author, A. (2020). *Title*. Journal 12(3), 1–20."
---
```

`status` controls which group the project appears under on `/research` —
publications first, then in progress, completed, and ideas. `*asterisks*` in a
reference line become italics.

---

## 5. Publishing an essay

```bash
cp content/writings/_template.mdx content/writings/an-essay.mdx
```

```yaml
---
title: "Essay title"
subtitle: ""
summary: ""
category: philosophy   # philosophy | literature | science-and-society | reflections
date: 2026-04-11
tags: [aesthetics]
related: []
references: []
---
```

Reading time is computed from the text. Categories with no essays in them are
not shown, so the filter row on `/writings` only ever offers real choices.

---

## 6. Creating a notebook entry

```bash
cp content/notebook/_template.mdx content/notebook/004-a-small-identity.mdx
```

The **numeric prefix is the entry number** shown on the site (`№ 004`), and it
is what other entries use to refer to it. Keep the numbers sequential; don't
renumber old notes.

Notes need nothing but a `title` and a `date`. They can be two sentences.

---

## 7. Linking related content

This is the part of the site designed to grow into a network.

Every entry has a reference of the form `collection/slug`:

```
research/perception-and-geometry
writings/on-the-silence-of-proofs
notebook/003-a-metric-on-attention
```

**Declare a relation once, in either entry's frontmatter:**

```yaml
related:
  - notebook/003-a-metric-on-attention
  - writings/on-the-silence-of-proofs
```

The reverse direction is derived automatically, so the note shows the project
too. There is nothing to keep in sync. Three kinds of connection are rendered
at the foot of every entry by `ConnectedIdeas`:

| Connection | Where it comes from |
| --- | --- |
| Related research / writings / notes | `related:`, in either direction (backlinks) |
| Elsewhere under the same tags | a shared `tags:` entry, when not already linked |
| Tag pages | `/tags/<tag>`, generated from every tag in use |

**Inside prose**, cross-reference with the `<Ref>` component, which prints the
target's real title — so renaming an entry never leaves a stale sentence behind:

```mdx
This continues the argument in <Ref to="notebook/003-a-metric-on-attention" />.
<Ref to="research/perception-and-geometry">the geometry project</Ref> says more.
```

An unresolved `<Ref>` degrades to plain grey text rather than a broken link.

> The architecture is ready for an interactive knowledge graph later:
> `lib/content.ts` already exposes the full node set (`allEntries`) and both
> edge sets (`outgoing`, `incoming`, `allTags`). No graph is drawn in v1 by
> design.

---

## 8. Writing with mathematics, figures and footnotes

All content files are MDX, so the following work everywhere.

**Mathematics** — KaTeX, inline and display:

```mdx
Inline $e^{i\pi} + 1 = 0$, and display:

$$
\int_{\partial M} \omega = \int_M \dd\omega \tag{1}
$$
```

Shorthands `\R \N \Z \C \abs{} \norm{} \inner{}{} \dd` are defined in
[`components/content/mdx.tsx`](components/content/mdx.tsx) — add your own there.
Display equations scroll horizontally on narrow screens instead of overflowing.

**Footnotes** — standard markdown; they are collected under *Notes* at the end
with return links:

```mdx
A claim worth qualifying.[^1]

[^1]: The qualification.
```

**Figures** — captioned, responsive, and printable. Inline SVG or an image:

```mdx
<Figure caption="A phase portrait." number="1">
  <svg viewBox="0 0 320 120">…</svg>
</Figure>

![Alt text for the image](/figures/diagram.svg "Caption shown under it")
```

Add `wide` to let a figure breathe past the text column on large screens.

**Mathematical environments**:

```mdx
<Theorem kind="definition" name="Perceptual metric" number="1">
  Let $(M,g)$ be …
</Theorem>
```

`kind` is one of `theorem, lemma, proposition, definition, conjecture, remark,
proof`.

**Asides**, tables, code blocks, blockquotes and lists are all styled:

```mdx
<Aside>A short note set apart from the argument.</Aside>
```

Entries with three or more `##` headings automatically get a table of contents —
in the right margin on wide screens, folded under the masthead on small ones.

---

## 9. The CV, and adding a PDF

The CV is structured data, not prose: [`content/cv.ts`](content/cv.ts). Add
items to any section:

```ts
{
  id: "education",
  label: "Education",
  kind: "items",
  items: [
    {
      title: "B.S. in Mathematics",
      organisation: "Rutgers University",
      location: "New Brunswick, NJ",
      period: "2025 – 2029",
      details: ["Thesis: …"],
    },
  ],
},
```

Empty sections render a quiet *Not yet listed.* Set
`cvConfig.showEmptySections = false` to hide them entirely once the CV fills up.
Sections render in the order they appear in the array; `kind: "groups"` renders
a Skills-style list.

**To add the PDF:**

1. Put the file in `public/cv/` — e.g. `public/cv/iris-cv.pdf`.
2. In `site.config.ts`: `cv: { pdf: "/cv/iris-cv.pdf", updated: "October 2026" }`.

The download button only exists once `pdf` is set; until then the page shows a
short note instead of a button that does nothing. The page also prints cleanly
on its own (`Print this page`), so a PDF is optional.

---

## 10. Changing typography and colours

**Colours** — the top of [`app/globals.css`](app/globals.css):

```css
@theme {
  --color-paper:     #f8f6f0;  /* page background        */
  --color-surface:   #f0ede5;  /* secondary surface      */
  --color-ink:       #242320;  /* primary text           */
  --color-ink-soft:  #6e6a62;  /* secondary text         */
  --color-ink-muted: #8c877e;  /* tertiary / decorative  */
  --color-accent:    #702f3b;  /* muted wine             */
  --color-rule:      #d9d4ca;  /* dividers               */
}
```

Nothing else hard-codes a colour. `ink-soft` is the lightest value still
passing WCAG AA on `paper` (5.0:1) — if you lighten it, check the contrast.

**Fonts** — [`app/layout.tsx`](app/layout.tsx) loads EB Garamond and Inter
through `next/font`. To change the serif:

```ts
import { Cormorant_Garamond } from "next/font/google";
const garamond = Cormorant_Garamond({ …, variable: "--font-garamond" });
```

Keep the CSS variable names (`--font-garamond`, `--font-inter`) and the rest of
the site follows. Cormorant Garamond is lighter and more display-like; it wants
a slightly larger body size in `.prose`.

**Scale and measure** — `--text-hero`, `--text-display` and `--measure` in the
same `@theme` block; long-form sizes live in the `.prose` section below it.

---

## 11. The mathematical visualisation

[`components/viz/WaveField.tsx`](components/viz/WaveField.tsx) draws the level
curves of

$$\psi(\mathbf p, t) = \frac1N \sum_{j<N} \cos(\mathbf k_j \cdot \mathbf p + \omega_j t)$$

for $N$ plane waves of equal magnitude, evenly spaced in direction over a half
turn. For $N = 5$ the wave vectors generate a rank-four module in the plane, so
the field is **quasiperiodic**: locally five-fold symmetric, invariant under no
translation at all — the plane-wave construction behind Penrose-like tilings.
Curves are extracted with marching squares on a coarse grid (a few thousand
cosines per frame, canvas 2D, no WebGL, capped at ~30fps) and drawn as
hairlines. The pointer leans the field's origin and rotates the wave vectors
slightly; the canvas never receives pointer events, so text above it stays
selectable.

It pauses when scrolled out of view or the tab is hidden, and under
`prefers-reduced-motion` it draws a single still frame — the same mathematics,
no motion.

Props: `waves`, `frequency`, `cell`, `opacity`. Use it anywhere:

```tsx
<div className="aspect-square"><WaveField waves={7} frequency={5} /></div>
```

`components/viz/Mark.tsx` is the static SVG of the same wave-vector star.

---

## 12. Deploying to Vercel

```bash
npm i -g vercel        # once
vercel                 # preview deployment
vercel --prod          # production
```

Or push to GitHub and import the repository at
[vercel.com/new](https://vercel.com/new) — the defaults are correct, there is
nothing to configure and no environment variables.

Before the first production deploy, set `url` in `site.config.ts` to the real
domain; `sitemap.xml`, `robots.txt`, canonical URLs and Open Graph tags are all
generated from it.

Every route is prerendered at build time except `/writings`, which reads
`?category=` on the server so the filter works without JavaScript. New content
appears after a rebuild, which a `git push` triggers automatically.

---

## 13. Design and architecture notes

**Stack** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
MDX via `next-mdx-remote/rsc`, KaTeX, Motion. No database, no CMS, no auth,
no paid services.

**Why these choices**

- *Content as files.* Frontmatter plus MDX means your archive is plain text you
  own, diffable in git, and readable in twenty years. Adding an entry touches no
  application code.
- *Relations declared once.* Backlinks are derived, not maintained.
- *Animation where it earns its place.* Page transitions are a CSS opacity
  fade — deliberately not a transform, which would create a containing block and
  break the sticky contents and the reading indicator. Motion is used only for
  the mobile menu, where an exit animation genuinely helps.
- *One light palette, committed to.* The site has no dark mode by design; it is
  art-directed for paper.
- *Reduced motion is a real alternative*, not a disabled feature.

**Accessibility** — semantic landmarks, a skip link, visible focus rings,
`aria-current` on the active navigation item, keyboard-operable mobile menu
(Escape closes it), decorative SVG hidden from assistive technology, and body
text at AA contrast or better.

**Print** — articles and the CV have their own print stylesheet: navigation,
footer, connected ideas and controls are dropped, external URLs are printed
after their link text, and headings avoid breaking away from their sections.

**Editing conventions**

- Files beginning with `_` in `content/` are ignored — that is how the templates
  stay out of the site.
- `draft: true` hides an entry in production but shows it in `npm run dev`.
- A missing `date` or an unknown `status`/`category` logs a warning in
  development naming the file, and falls back to something sensible rather than
  failing the build.
