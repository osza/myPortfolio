---
type: doc
title: "How myPortfolio v5 works (with v4 comparison)"
description: "A documentation sample explaining how myPortfolio v5 uses Markdown, frontmatter, Node.js, validation, and AI-assisted development compared with version 4."
eyebrow: "Portfolio architecture sample"
primary_link_href: "#overview"
primary_link_label: "Read sample"
secondary_link_href: "index.html#samples"
secondary_link_label: "Back to selected work"
hero_stats: "Docs as code | Markdown workflow | AI-assisted development | Version comparison"
hero_panel_id: "myportfolio-v5-title"
hero_panel_label: "Architecture focus"
hero_panel_style: "default"
hero_panel_items: "Approach::Markdown files act as source content, while frontmatter controls routing, rendering, and validation. | Change::Version 5 separates content, templates, scripts, and assets more clearly than version 4. | Reality::AI helps write the code, but human review is still needed to catch invented decisions and unintended changes."
footer_tag: "Built from Markdown source"
uses_mermaid: false
accent_sections: "overview|from-v4-to-v5|how-v5-works|why-v5-is-better|future-improvements"
spaced_articles: false
output: "how-myportfolio-works.html"
---

# How myPortfolio v5 works

This piece briefly explains how **myPortfolio** v5 turns Markdown into published HTML and how the current architecture improves on version 4. 

## Overview

AI helped build this version of my portfolio. The working arrangement is simple: I complain; the AI writes code. I ask for a feature; it improvises, changes something without asking (the footer text was one example), and I catch the decision in a diff. AI proposes structure and phrasing; I remove filler, correct the logic, and verify the implementation. I remain the AI project manager because the tool is fast, shallow, and not accountable. The point from my [Human, but not humane](human-but-not-humane.html) essay still holds: adding skills or commands remains a fight with the system, not a smooth upgrade.

## From v4 to v5: what changed

In v4, the root directory mixed source files, build output, assets, layouts, scripts, backups, and special pages. It worked, but it made the repository harder to navigate and easier to break.

v5 uses a source-first docs-as-code structure. Content lives in `content/`, organised as `content/docs/`, `content/tutorials/`, and `content/essays/`; `content/pages/` holds special pages. Shared templates live in `templates/shared/`, page-type templates in `templates/page-types/`, assets in `assets/css/`, and scripts in `scripts/`.

The pipeline is now explicit. In v4, Markdown files in the root used ad-hoc layouts and inconsistent metadata. In v5, every article is an `.md` file with YAML frontmatter. It declares the page type (`doc`, `tutorial`, or `essay`), title, description, hero content, footer tag, and output filename. Frontmatter is the control layer: it tells the build which template to use, where to write the page, and what to validate.

The workflow is explicit: `npm run build` generates HTML, `npm run validate` checks existing output, and `npm run check` runs both as a pre-CI quality warden.

## How v5 works now

Frontmatter is the single source of truth for rendering. Change a field and the page changes without editing the prose. It keeps metadata separate from content and makes each page machine-readable, so the pipeline can validate, index, and reuse it.

The build uses `.mjs` files, so Node.js treats scripts as ECMAScript modules and they use `import` and `export`. Shared templates provide common page chrome; page-type templates render documentation, tutorials, and essays.

Validation runs after the build. It checks the output, footer consistency, and frontmatter-driven rules before changes reach CI.

Accent sections in the HTML files are matched against slugs derived from H2 titles, so styling follows headings rather than duplicated identifiers.

## Why v5 is better than v4

v5 is clearer and safer to change. In v4, a layout or page-type change meant editing a crowded root and risking a published file. In v5, content, templates, scripts, assets, and output have distinct roles. Changes stay local and diffs are easier to review.

The pipeline also makes regressions easier to detect. Frontmatter-driven rendering produces predictable pages, while validation checks that source and output still follow the agreed model. The system remains small enough for one author, but follows practices that scale to a team.

## Future improvements

A later version could move published HTML into `dist/`. Validation could check internal links, heading hierarchy, and required frontmatter. The build could create a page index for search, and frontmatter flags could enable optional features such as Mermaid diagrams.

That would improve the system, not remove the supervision problem. Adding skills or commands will still require someone to inspect the diff and decide whether the tool solved the right problem.
