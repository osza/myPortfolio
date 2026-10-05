---
type: essay
title: "Human, but Not Humane — Piotr Oszenda"
description: "An essay by Piotr Oszenda on AI-assisted development, project memory, and the limits of treating a chat-based tool as a collaborator."
eyebrow: "Essay · AI-assisted development"
primary_link_href: "#the-argument"
primary_link_label: "Read essay"
secondary_link_href: "index.html#samples"
secondary_link_label: "Back to selected work"
hero_stats: "Project memory | AI-assisted development"
hero_panel_id: "essay-focus-title"
hero_panel_label: "The central distinction"
hero_panel_style: "case"
hero_panel_items: "Human describes resemblance.::AI can be articulate, encouraging, inventive, apologetic, and confidently wrong, all at the same time. | Humane describes treatment.::A humane workflow preserves constraints, exposes uncertainty, and respects the user’s attention. | Project truth needs a durable home.::Chats can assist the work, but they should not be asked to keep organisational memory."
footer_tag: "Built from Markdown source"
uses_mermaid: false
spaced_articles: true
output: "human-but-not-humane.html"
---

# Human, but Not Humane

What building CitizenHub with AI taught me about project memory, responsibility, and the difference between a human-like interface and a humane workflow.

## The argument

- **Human describes resemblance.** AI can be articulate, encouraging, inventive, apologetic, and confidently wrong, all at the same time.
- **Humane describes treatment.** A humane workflow preserves constraints, exposes uncertainty, and respects the user’s attention.
- **Project truth needs a durable home.** Chats can assist the work, but they should not be asked to keep organisational memory.

## A small idea with a clear order of operations.

CitizenHub began with a small and slightly selfish goal: helping a foreign resident in Spain understand administrative changes without treating the Boletín Oficial del Estado as a postgraduate course in bureaucratic endurance.

The idea was simple. Each day, or a set interval, the system would find relevant changes, explain why they might matter, and redirect me to the official source. Two minutes, more or less. Three on a difficult morning.

I named it CitizenHub, which sounded reassuringly hyped. Plus, the work-in-progress bit did not sound like a full-blown repository containing multiple architectural philosophies or packages called final, final2, and actually-final.

The intended logic was pretty straightforward:

**New BOE item → meaning → relevance → priority → communication**

First, establish what an official document says. Then decide whether it matters to a particular person. Only then explain it. An item should not produce a new meaning just because its reader uses the app. They are rather busy, foreign, confused, or trying to understand it before the morning coffee. The displayed personalised content should follow interpretation. Not the other way round.

For a while, the project behaved well. It parsed real BOE XML documents, preserved source provenance, separated complex materials into usable segments, represented claims structurally, checked evidence references, and connected to an LLM API. For a while.

## AI was responsive, but not especially cumulative.

At first, AI was everything it promised to be: fast, tireless, encouraging, and always ready to explain code that, let's face it, I had not touched.

It suggested data models. It drafted tests. It produced architectural diagrams with the relaxed confidence of someone who would never be asked to maintain any of this six weeks later.

I gave it a clearly defined constraint.

It returned a solution that violated the constraint, but did so with impressive confidence.

I explained that the constraint was intentional.

It apologised.

Then it proposed essentially the same solution again, now with more elegant naming.

This is the peculiar charm of AI collaboration: it can be extremely responsive without being especially cumulative.

## The difficult part was that the project did not remember.

People make mistakes too, with rather less publicity. The difference was the invisible work of maintaining continuity across a growing project.

Decisions disappeared into long conversations. Rejected ideas returned wearing different terminology. Temporary experiments began presenting themselves as permanent architecture. Documentation described the system "we" meant to build, while the code pursued a more imaginative version of the plan.

I became the person responsible for continuity: project owner, requirements editor, architecture reviewer, regression detector, and archivist of decisions nobody could quite find anymore.

The AI generated momentum. I generated memory.

It was efficient in the same way that carrying a bicycle uphill is technically a form of transport.

## Human is not humane

AI can be human-like without being humane.

A humane workflow would respect settled decisions, preserve context, disclose uncertainty, and avoid turning a quick task into an hour of verification. It would understand that attention is not an infinite resource and that "here are three alternatives" is not always a gift. Sometimes it is simply homework wearing a friendly interface.

## The solution was an operating model, not a more dramatic, all-caps, prompt.

No direct instruction or solemn request for the model to "think carefully" could substitute for clear responsibility and durable project records.

### Human

Defines the problem, constraints, examples, and acceptance criteria.

### AI

Implements one approved change, tests it, and reports its limits.

### Automation

Checks contracts, quality rules, and regressions.

Project truth had to leave the chat and enter the repository: state files, Architecture Decision Records (ADRs), bounded tasks, explicit no-nos, and automated checks.

This did not make AI less useful. It made its usefulness easier to trust.

CitizenHub did not teach me that AI-assisted development is impossible for non-developers. It showed me something less dramatic and basic, to be honest: autonomy without durable memory transfers invisible engineering work to the human.

AI can be human-like without being humane.

So I do not expect it to develop a conscience.

I just no longer let it keep the project memory.

## AI-assisted development needs durable project memory.

This essay connects documentation practice with the working conditions around AI: clear constraints, preserved decisions, and accountable use of generated output.
