# How I design docs-as-code workflows

A working portfolio sample that shows how I structure documentation systems around contribution flow, review rules, publishing control, and long-term maintainability.

## Documentation systems need more than version control.

::: intro
A docs-as-code setup works best when contribution flow, ownership, review, and publishing are designed as one connected system instead of isolated tooling decisions.
:::

### Core principle

::: meta
Process design · documentation operations
:::

I treat docs-as-code as an operating model, not just a repository pattern. The repository, branching strategy, review path, and publishing process must all support the people who maintain the documentation.

The goal is not simply to store docs in Git. The goal is to make documentation easier to update, review, reuse, and trust over time.

## The workflow components I define first.

::: intro
Before choosing detailed tooling patterns, I define who can contribute, how changes are reviewed, and what the publishing rules are.
:::

::: card-grid

::: card
::: meta
Contribution · Ownership
:::

### Who can change content

Define whether documentation is owned by a central team, distributed across product teams, or maintained through a hybrid contribution model.
:::

::: card
::: meta
Review · Approval
:::

### How changes are approved

Clarify technical review, editorial review, and publication rules so contributors understand what done means.
:::

::: card
::: meta
Publishing · Release control
:::

### What reaches production

Separate draft, review, and release states to prevent incomplete or unvalidated content from being published accidentally.
:::

:::

## A simple path from draft to publish.

::: intro
A good docs-as-code flow reduces uncertainty for authors and makes review expectations visible from the start.
:::

::: steps-grid

::: step
::: meta
1
:::

### Draft

Draft in a structured source file using agreed naming, headings, and content conventions.
:::

::: step
::: meta
2
:::

### Review

Review for correctness, terminology, and task completeness before content moves forward.
:::

::: step
::: meta
3
:::

### Publish

Publish through a controlled process that preserves consistency across the wider documentation set.
:::

:::

## A compact view of the docs-as-code workflow.

::: intro
This version uses a shorter left-to-right path so the diagram reads cleanly inside the existing card layout.
:::

### Workflow map

::: meta
Mermaid · process overview
:::

::: mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 34}, "themeVariables": {"fontFamily": "Inter", "fontSize": "15px", "primaryColor": "#f5f3ee", "primaryTextColor": "#1f1d19", "primaryBorderColor": "#0d6666", "lineColor": "#5f5a52", "secondaryColor": "#f5f3ee", "tertiaryColor": "#f5f3ee"}} }%%
flowchart LR
  A[Stakeholder input] --> B[Research]
  B --> C[Information design]
  C --> D[Drafting]
  D --> E[Review]
  E --> F[Editing]
  F --> G[Validation]
  G --> H[Publication]
  H --> I[Customer feedback]
  I --> B

  classDef editorial fill:#fcfbf8,stroke:#0d6666,color:#1f1d19,stroke-width:1.6px;
  classDef editorialAccent fill:#0d6666,stroke:#0a5050,color:#ffffff,stroke-width:2px;
  classDef loop fill:#dcebea,stroke:#0d6666,color:#1f1d19,stroke-width:1.5px;

  class A,D,E,I loop;
  class B,C,F,G editorial;
  class H editorialAccent;
:::

This flow captures real-world documentation work by including stakeholder input from developers, SMEs, and product owners, followed by review and validation before publication. After publication, customer feedback goes back into research and helps improve the next version.

## What I keep visible in the repo.

::: intro
Docs-as-code becomes easier to maintain when the repository itself communicates structure, ownership, and reusable patterns.
:::

::: timeline

::: timeline-card
::: meta
Structure · Navigation · Consistency
:::

### Use predictable files and pages.

- Keep titles and file names aligned.
- Use consistent section order across samples.
- Make the source easy to scan for contributors.

In this portfolio: Markdown source, generated HTML output, build script, and clear paths.
:::

::: timeline-card
::: meta
Governance · Editorial control · Maintenance
:::

### Make ownership and review explicit.

- Document who approves changes.
- Define what needs technical validation.
- Keep publishing steps lightweight but controlled.

In this portfolio: local-link validation and a GitHub Actions check on pull requests and changes to the published branch.
:::

:::

## Other portfolio pages that connect to this approach.

::: intro
This sample sits alongside tutorial and case-study pages that show how I build and maintain structured documentation.
:::

::: card-grid

::: card
::: meta
Tutorial · API
:::

### Customers API tutorial

A published tutorial that shows how I explain CRUD operations and structure task-based developer guidance.

[View tutorial](./customers-api-tutorial.html)
:::

::: card
::: meta
Source · Markdown
:::

### Customers API source file

The Markdown source for the same tutorial. The build script turns this file into the published HTML page.

[View source](./customers-api-tutorial.md)
:::

::: card
::: meta
Source repository · GitHub
:::

### Portfolio source repository

The source files behind this portfolio, including its HTML structure, shared CSS, and published documentation samples.

[View portfolio source on GitHub](https://github.com/osza/myPortfolio)
:::

:::

## Docs-as-code as part of reliable documentation practice.

::: intro
This sample connects the published page with the workflow behind it: source files, review, ownership, and a structure that makes documentation easier to maintain.
:::

::: actions
[Back to selected samples](./index.html#samples)
[Discuss documentation projects](./index.html#contact)
:::

## Available for documentation-related projects and content governance.

::: intro
I work remotely and collaborate comfortably across product, engineering, QA, support, and consulting environments.
:::

::: contact-grid

::: contact-card

### Email

[piotr.oszenda@outlook.com](mailto:piotr.oszenda@outlook.com)
:::

::: contact-card

### LinkedIn

[LinkedIn profile](https://www.linkedin.com/in/piotr-oszenda/)
:::

::: contact-card

### Location

Gliwice, Poland or Gijón, Spain · Remote
:::

::: contact-card

### Focus

Developer documentation, product docs, knowledge management, content governance, migration work, and documentation systems.
:::

::: contact-card

### Best fit

SaaS and API-first teams that need developer documentation, workflow-heavy product content, knowledge management, migration cleanup, or documentation restructuring.
:::

:::
