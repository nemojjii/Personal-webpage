# An Academic Website, A Personal Universe

The personal academic homepage and intellectual archive of **Iris (Jieun) Kim** —
research, projects, a collection of books and films, and a CV — built to be added
to for years, one file at a time.

Adding a research project, an exploration, a book or a film means **creating one Markdown file**.
Nothing in `app/` or `components/` has to be touched.

---

## Contents

1. [Running the site](#1-running-the-site)
2. [Project structure](#2-project-structure)
3. [Changing your name and academic information](#3-changing-your-name-and-academic-information)
4. [Adding a research project](#4-adding-a-research-project)
5. [Adding a project](#5-adding-a-project)
6. [The Collection — the Bookshelf and the Screening Room](#6-the-collection-the-bookshelf-and-the-screening-room)
7. [Linking related content](#7-linking-related-content)
8. [Writing with mathematics, figures and footnotes](#8-writing-with-mathematics-figures-and-footnotes)
9. [The CV, and adding a PDF](#9-the-cv-and-adding-a-pdf)
10. [Changing typography and colours](#10-changing-typography-and-colours)
11. [The mathematical visualisation](#11-the-mathematical-visualisation)
12. [The Little Laboratory](#12-the-little-laboratory)
13. [Deploying to Vercel](#13-deploying-to-vercel)
14. [Design and architecture notes](#14-design-and-architecture-notes)

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
  research/*.mdx          one file per research project
  projects/*.mdx          one file per exploration
  books/*.mdx             the Bookshelf — one file per book
  films/*.mdx             the Screening Room — one file per film
  collections/*.mdx       thematic collections across books and films
  pages/about.mdx         the About page
  cv.ts                   CV data (structured, not prose)
  */_template.mdx         copy these to start something new

app/                    ← routes; you will rarely edit these
  page.tsx                /            home
  about/                  /about
  research/               /research  + /research/[slug]
  projects/               /projects  + /projects/[slug]
  collection/             /collection + /collection/[slug]  (thematic collections)
  laboratory/             /laboratory + /laboratory/<experiment>
  bookshelf/              /bookshelf + /bookshelf/[slug]
  films/                  /films     + /films/[slug]
  cv/ contact/ tags/      /cv /contact /tags + /tags/[tag]
  layout.tsx              fonts, metadata, header and footer
  globals.css             the whole design system
  sitemap.ts robots.ts    generated automatically from your content

components/
  site/                   Header, Footer
  content/                MDX renderer, Prose, Figure, Aside, Theorem, Ref, Reflection
  collection/             WorkCover, WorkCard, WorkArchive (search), WorkHeader, WorkPage
  ui/                     EntryRow, ConnectedIdeas, TableOfContents, …
  viz/                    WaveField (the homepage field), Mark

lib/
  content.ts              reads content/, builds the index and the relations
  works.ts                the Collection's search, filter and sort — pure, runs in the browser too
  types.ts                statuses, categories, collections
  toc.ts  links.ts  pages.ts

public/
  cv/                     put your CV PDF here
  covers/ posters/        book covers and film posters, once you have them
  figures/ papers/        images and attachments
```

The separation is deliberate: **content** in `content/`, **presentation** in
`app/globals.css`, **functionality** in `lib/` and `components/`.

---

## 3. Changing your name and academic information

Open [`site.config.ts`](site.config.ts). It is the only file with your identity in it.

```ts
name: "Iris (Jieun) Kim",
affiliation: "Rutgers University",
position: "Undergraduate, Chemical Physics & Mathematics",
url: "https://your-domain.com",      // used for metadata and the sitemap
headline: "Between the abstract and the tangible.",
intro: "I study chemical physics and mathematics at Rutgers, …",
links: {
  email: "",      // "jk2575@scarletmail.rutgers.edu"
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
subtitle: ""                      # optional, italic, under the title
summary: "One or two sentences."  # index pages and link previews
status: completed                 # idea | in-progress | completed | publication
area: "Computational Physics"
date: 2025-06-01                  # may be left as "" until you know it
updated: 2026-05-20               # optional
featured: true                    # Featured research, rather than Additional
order: 1                          # position within the group, ascending
keywords: [power spectral density, EEG]
tags: [signal-processing]
related: [projects/mathematics-perception-and-expression]
pdf: "/papers/write-up.pdf"       # optional; put the file in public/papers/
references:
  - "Author, A. (2020). *Title*. Journal 12(3), 1–20."
---
```

The research index has two groups: **Featured research** (`featured: true`) and
**Additional research**. Within each, entries are ordered by `order` ascending
if present, and otherwise by date, newest first — so you can arrange the
featured list by hand without inventing dates.

`status` sets the badge on the entry (completed, in progress, and so on).
`*asterisks*` in a reference line become italics. An entry with `date: ""` is
listed without a date rather than being hidden — useful while the details of
older work are still being recovered.

The five entries currently in `content/research/` hold titles only. Fill in the
summary, area, dates and body of each from your original materials.

---

## 5. Adding a project

Projects are the interdisciplinary and personal explorations — the things that
are not research yet, and may never be.

```bash
cp content/projects/_template.mdx content/projects/my-exploration.mdx
```

```yaml
---
title: "Project title"
stage: exploration   # exploration | ongoing | set-aside | finished
area: "Mathematics & Perception"
date: 2026-10-21
featured: true       # appears under "Current" and on the homepage
tags: [perception]
---
```

`stage` is deliberately a different vocabulary from research `status`: an
exploration is labelled as one, so nothing on the site reads as a finding before
it is one.

---

## 6. The Collection — the Bookshelf and the Screening Room

The Collection is the personal cultural archive: **the Bookshelf** at
`/bookshelf` (books) and **the Screening Room** at `/films` (films), introduced
together at `/collection`. In the header it is one item, *Collection*; the two
spaces are listed beneath it in the mobile menu and the footer.

Books and films are entries like everything else — one MDX file each, in
`content/books/` and `content/films/` — so tags, `related:` links, `<Ref>`
cross-references and the Connected Ideas panel all work for them unchanged.

### Adding a book

```bash
cp content/books/_template.mdx content/books/the-plague.mdx
```

```yaml
---
title: "페스트"                 # the display title — the Korean title as you keep it
titleOriginal: "La Peste"       # original-language title, when different
titleEn: "The Plague"           # English title, when the original is not English
author: "Albert Camus"
authorOriginal: ""              # the name in its own script, e.g. "村上春樹"
year: 1947
language: fr                    # ISO 639-1 code of the original
edition: ""
isbn: ""
genres: [Novel]
themes: []                      # yours to assign — never automatic
collections: []                 # slugs from content/collections/
readingStatus: unspecified      # unspecified | reading | finished | to-read | abandoned
dateFinished: ""
image: ""                       # "/covers/the-plague.jpg", once you have one
imageCredit: ""
tags: []
related: []
added: "2026-10-21"             # the day it joined the archive
featured: false                 # lifts it to the front of /collection and the homepage
visibility: public              # public | draft | private
verified: false                 # true once you have checked the metadata yourself
verifyNote: ""                  # what still needs checking; never published
---
```

**Leave a field out rather than guess it.** The page shows what is known and
nothing else: a book with no year has no year line, a film whose director is
not yet confirmed has no director. Dates may be written quoted or bare.

### Adding a film

```bash
cp content/films/_template.mdx content/films/happy-hour.mdx
```

The film template has `director`, `directorOriginal`, `country`,
`viewingStatus` (`unspecified | watched | rewatched | to-watch`) and
`dateWatched` in place of the book-specific fields. Everything else is shared.

### Correcting bibliographic metadata

Every entry in the initial catalogue starts with `verified: false`. The ones
that genuinely need your eye carry a `verifyNote` — a title shared by two
works, a year taken from a premiere rather than a release, a book that could
not be identified from its Korean title alone. In `npm run dev` the note is
shown beneath the masthead of the entry, marked *Development only*; in
production it does not exist. Fix the fields, set `verified: true`, delete the
note.

### Covers and posters

Put the file in `public/covers/` or `public/posters/` and point `image` at it.
Add `imageCredit` when the source asks for attribution. Until then the shelf
sets a typographic cover — a spine and a title for a book, a dark title card
for a film — so nothing is ever shown that could be mistaken for an official
cover. Only use images you have the right to publish; nothing on the site
fetches imagery from anywhere.

> Everything under `public/` is served to anyone who knows the URL, whatever
> the entry's visibility. Keep the covers of private entries out of `public/`;
> the loader warns in development if one is named.

### Visibility

```yaml
visibility: public    # built, listed, searchable, in the sitemap
visibility: draft     # exists only in `npm run dev`
visibility: private   # as draft; kept distinct so the file records your intent
```

The filter runs once, in `lib/content.ts`, at build time. A non-public entry
produces no page, no route, no search data, no related-content link and no
sitemap line — there is nothing to hide in the browser because nothing was
built. The older `draft: true` still works and means `visibility: draft`.

### Reflections

The body of the file, below the frontmatter, is set as prose beneath the
masthead — notes, in whatever form. Three titled sections are available as
components and appear only when they contain something:

```mdx
<StayedWithMe>          {/* books */}
Prose, with everything MDX allows.
</StayedWithMe>

<OnForm>                {/* films: cinematography, colour, composition, editing, sound */}
…
</OnForm>

<OnPeople>              {/* films: character, relationships, identity, moral ambiguity */}
…
</OnPeople>
```

The templates carry them commented out. A file with an empty body ends at its
masthead; nothing invites you to fill a section you have not written.

### Thematic collections

```bash
cp content/collections/_template.mdx content/collections/on-solitude.mdx
```

```yaml
---
title: "On Solitude"
subtitle: ""
items:                  # books and films, in the order you want them shown
  - books/demian
  - films/magnolia
visibility: draft
---
An optional introduction, set above the works.
```

The file's name is its address, `/collection/on-solitude`. A work may also
declare itself a member with `collections: [on-solitude]`; the two directions
are merged, and collections appear on `/collection` and on every member's page.
Nothing is ever placed in a collection automatically.

### Connecting books, films and research

Use `related:` exactly as elsewhere on the site — `films/magnolia`,
`books/demian`, `research/consensus-dynamics-in-networks` — in either entry.
The reverse direction is derived. Shared `tags:` give the weaker, automatic
"elsewhere under the same tags" connection; `themes:` and `collections:` are
the Collection's own, and are never inferred.

### Searching, filtering and sorting

`/bookshelf` and `/films` search every title (display, original, English),
the creator in either script, year, genres and themes — Korean with or without
spaces, Latin with or without accents. Filters are offered only for values
actually in use; sorting is by date added, date updated, title, creator or
year; *By author* and *By director* group the results. The view is kept in the
address bar, so a filtered shelf can be linked to. Without JavaScript the full
shelf is shown.

---

## 7. Linking related content

This is the part of the site designed to grow into a network.

Every entry has a reference of the form `collection/slug`:

```
research/perception-and-geometry
projects/mathematics-perception-and-expression
books/demian
```

**Declare a relation once, in either entry's frontmatter:**

```yaml
related:
  - projects/mathematics-perception-and-expression
  - books/demian
```

The reverse direction is derived automatically, so the book shows the research
project too. There is nothing to keep in sync. Three kinds of connection are rendered
at the foot of every entry by `ConnectedIdeas`:

| Connection | Where it comes from |
| --- | --- |
| Related research / projects / books / films | `related:`, in either direction (backlinks) |
| Elsewhere under the same tags | a shared `tags:` entry, when not already linked |
| Tag pages | `/tags/<tag>`, generated from every tag in use |

**Inside prose**, cross-reference with the `<Ref>` component, which prints the
target's real title — so renaming an entry never leaves a stale sentence behind:

```mdx
This continues the argument in <Ref to="books/demian" />.
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

[`components/viz/WaveField.tsx`](components/viz/WaveField.tsx) draws the
interference pattern of two coherent circular sources. At a point $p$ at
distances $r_1, r_2$ from the sources,

$$\psi(p,t) = \cos(kr_1 - \omega t) + \cos(kr_2 - \omega t)
            = 2\cos\!\Big(\tfrac{k(r_1+r_2)}{2} - \omega t\Big)
              \cos\!\Big(\tfrac{k(r_1-r_2)}{2}\Big).$$

The second factor has no $t$ in it. The field therefore vanishes permanently
wherever $r_1 - r_2$ is an odd multiple of half a wavelength — the points whose
distances to the two sources differ by a constant, which is a family of confocal
**hyperbolas** with the sources as foci. Those are the charcoal curves, and they
never move; the only thing travelling is the crest pattern sweeping across them
along the confocal ellipses. It is Young's two-slit geometry, drawn rather than
measured.

The level curves are extracted with marching squares on a coarse grid (a few
thousand cosines per frame, canvas 2D, no WebGL, capped at ~30fps) and stroked
as hairlines — the nodal set in charcoal, the levels either side of it in muted
burgundy. The pointer displaces one source, which bends the whole family; the
canvas never receives pointer events, so text above it stays selectable.

It pauses when scrolled out of view or the tab is hidden, and under
`prefers-reduced-motion` it draws a single still frame — the same mathematics,
no motion.

Props: `separation`, `frequency`, `cell`, `opacity`. Use it anywhere:

```tsx
<div className="aspect-square"><WaveField frequency={9} separation={0.25} /></div>
```

[`components/viz/Mark.tsx`](components/viz/Mark.tsx) is the same geometry
reduced to a static SVG skeleton: two sources, the straight nodal line between
them, and the first hyperbola either side.

---

## 12. The Little Laboratory

`/laboratory` holds three small interactive experiments — wave superposition,
gradient descent on a quadratic bowl, and first-order reaction kinetics — each
at its own route. They are deliberately independent of the content system:
there are no MDX files to add, and nothing here links to research.

```
lib/laboratory.ts           the three experiments: titles, descriptions, model notes (MDX)
lib/laboratory/wave.ts      y = A₁ sin(k₁x − ω₁t) + A₂ sin(k₂x − ω₂t + Δφ), with ω = v·k
lib/laboratory/gradient.ts  f = ½(ax² + by²), p ← p − η∇f, and the η < 2/max(a,b) condition
lib/laboratory/kinetics.ts  [A] = [A]₀ e^(−kt), t½ = ln 2 / k
components/laboratory/      the instruments (client components), shared controls, the clock
app/laboratory/             the landing page and one page per experiment
```

The mathematics lives in `lib/laboratory/*.ts` as pure functions with no
rendering in them, so it can be checked on its own.

An experiment can be connected to an entry. Write the relation once, on the
experiment, in `lib/laboratory.ts`, with its kind and a sentence saying why:

```ts
related: [
  { ref: "research/consensus-dynamics-in-networks", kind: "mathematical", note: "…" },
]
```

`kind` is `mathematical` (the same mathematics, read in two places) or
`conceptual` (one gives intuition for the other). The research page then
lists the experiment under *Related experiments*, and the experiment page
lists the research under *Related research*, each with the kind and the note.
An entry may also point the other way with `related: [laboratory/<slug>]` in
its frontmatter, and `<Ref to="laboratory/<slug>" />` works in prose; a slug
that matches no experiment is dropped with a warning in development. Shared
tags never create one of these links — the *Elsewhere under the same tags*
list is a suggestion and is labelled as such. Every instrument starts
its animation only after first paint and not at all for a visitor who prefers
reduced motion; play, pause, step and reset are ordinary buttons and the
sliders are ordinary range inputs, so everything works from the keyboard.

---

## 13. Deploying to Vercel

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

Every route is prerendered at build time. The Bookshelf and the Screening
Room's search and filters run in the browser over the public catalogue. New content
appears after a rebuild, which a `git push` triggers automatically.

---

## 14. Design and architecture notes

**Stack** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
MDX via `next-mdx-remote/rsc`, KaTeX, Motion. No database, no CMS, no auth,
no paid services.

**Why these choices**

- *Content as files.* Frontmatter plus MDX means your archive is plain text you
  own, diffable in git, and readable in twenty years. Adding an entry touches no
  application code. There are four collections — research, projects, books,
  films — and adding a fifth means a folder, a type, and a route.
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
- `visibility: draft` or `private` (or the older `draft: true`) keeps an entry
  out of production entirely; `npm run dev` shows it with a marker.
- A missing `date` or an unknown `status`/`category` logs a warning in
  development naming the file, and falls back to something sensible rather than
  failing the build.
