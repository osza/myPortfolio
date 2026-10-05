# Piotr Oszenda — Technical Writing Portfolio

This repository contains my technical writing portfolio for GitHub Pages.

I specialise in developer documentation, API content, product documentation, and knowledge architecture for SaaS and enterprise platforms. My work includes user-facing documentation, help content, onboarding materials, release notes, knowledge base content, developer-focused documentation, and docs-as-code examples.

## What this portfolio shows

- Selected samples from product, developer, and knowledge documentation work.
- A mix of live-style portfolio pages and tutorial samples.
- Short context notes that explain the audience, goal, and my contribution.
- A simple HTML and CSS portfolio site designed to present the work clearly.

## Repository structure

- `content/docs/` — Markdown sources for documentation samples.
- `content/tutorials/` — Markdown sources for tutorial samples.
- `content/essays/` — Markdown sources for essay samples.
- `content/pages/` — Reserved for special or custom Markdown pages.
- `templates/shared/` — Shared page shell and rendering helpers.
- `templates/page-types/` — Documentation, tutorial, and essay page renderers.
- `assets/css/` — Shared stylesheet used by the portfolio pages.
- `scripts/build/` — Markdown-to-HTML build logic.
- `scripts/validate/` — Site and generated-output validation logic.
- `index.html` — Main portfolio entry point, kept in the repository root.

## Key samples

- `index.html` — Main portfolio page with selected work, experience, and contact details.
- `api-tutorials.html` — Overview page for API and SUI tutorial samples.
- `customers-api-tutorial.html` — HTML version of a CRUD tutorial for a Customers API.
- `content/tutorials/customers-api-tutorial.md` — Markdown source for the generated Customers API tutorial.
- `mews-events-case-study.html` — Case study about reorganising product knowledge for a new documentation hub.
- `content/docs/docs-as-code.md` — Markdown source for the docs-as-code sample.
- `content/docs/mews-events-case-study.md` — Markdown source for the case study.
- `octopus-society-on-sui.html` — Concept-focused guide on SUI.
- `game-assets-on-sui.html` — Tutorial-style guide on game assets in SUI.
- `docs-as-code.html` — Sample page focused on docs-as-code thinking and documentation workflow.

## Background

I’m a Senior Technical Writer and Knowledge Architect with experience documenting complex products and workflows across SaaS, developer portals, enterprise software, and IT platforms. My recent work includes documentation for Mews, Jamf, SAP, and consulting projects involving API documentation, knowledge base design, content migration, and documentation architecture.

## Live site

[GitHub Pages](https://osza.github.io/myPortfolio/)

## Documentation workflow

Markdown sources in `content/` are rendered into committed HTML pages in the repository root. The build preserves `index.html` in the root and does not copy it into `dist/`.

The main commands are:

```bash
npm run build
npm run validate
npm run check
```

`npm run build` generates HTML from the Markdown sources. `npm run validate` checks local links, required frontmatter, generated-file markers, and the shared `Built from Markdown source` footer. `npm run check` runs both commands in sequence.

After changing a Markdown source or the build templates, run the commands locally and review both the generated HTML and the diff before committing.

## Contact

- Email: [piotr.oszenda@outlook.com](mailto:piotr.oszenda@outlook.com)
- Location: Gliwice, Poland or Gijón, Spain (remote)
- [LinkedIn](https://www.linkedin.com/in/piotr-oszenda/)
  
