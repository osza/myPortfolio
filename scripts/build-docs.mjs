import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolve paths relative to the repo root so the script works from any cwd.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot);
import { renderDocumentationPage } from '../layouts/doc-page.mjs';

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${text}</a>`;
  });

const slug = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const isTableDivider = (value) => /^\|(?:\s*:?-{2,}:?\s*\|)+$/.test(value);

const table = (rows) => {
  const cells = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim());
  const [head, ...body] = rows.filter((row) => !isTableDivider(row));
  return `<div class="table-wrapper"><table><thead><tr>${cells(head)
    .map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${body
    .map((row) => `<tr>${cells(row).map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};

/**
 * Page definitions. Each entry maps a Markdown source to its HTML output and
 * supplies per-page layout options. Add a new entry here to generate another
 * documentation page from Markdown.
 */
const pages = [
  {
    sourcePath: 'customers-api-tutorial.md',
    outputPath: 'customers-api-tutorial.html',
    metadata: {
      title: 'Customers API tutorial — Developer documentation sample (Piotr Oszenda)',
      description: 'Hands-on API tutorial showing how to create, retrieve, update, and delete customer records with a fictional Customers API.'
    }
  },
  {
    sourcePath: 'octopus-society-on-sui.md',
    outputPath: 'octopus-society-on-sui.html',
    metadata: {
      title: 'Join Octopus Society on Sui — Developer documentation sample (Piotr Oszenda)',
      description: 'Hands-on Sui tutorial illustrating a fictional onboarding flow for connecting a wallet, joining Octopus Society, verifying membership, and claiming a reward.'
    },
    eyebrow: 'Sui onboarding tutorial',
    primaryLink: { href: '#overview', label: 'Read tutorial' },
    heroStats: ['Testnet', 'Move objects', 'CLI + TypeScript', 'Documentation sample'],
    heroPanel: {
      id: 'tutorial-proof-title',
      label: 'What this tutorial demonstrates',
      style: 'case',
      items: [
        { title: 'A membership workflow centered on one object.', text: 'The reader follows a single membership object from minting to verification and reward claim.' },
        { title: 'Current Sui SDK conventions.', text: 'The TypeScript example uses `Transaction`, a signer, and a current Sui client.' },
        { title: 'Preparation, reference, and workflow.', text: 'Setup, object inspection, and step-by-step tasks give the sample a clear onboarding structure.' }
      ]
    },
    footerTag: 'Fictional Sui documentation sample · Testnet-oriented examples',
    accentSections: ['join-and-verify'],
    noAccentOverview: true,
    spacedArticles: true
  },
  {
    sourcePath: 'docs-as-code.md',
    outputPath: 'docs-as-code.html',
    metadata: {
      title: 'Docs-as-code workflow sample — Piotr Oszenda',
      description: 'A documentation architecture sample showing how I design docs-as-code workflows, contributor processes, review rules, and publishing structures.'
    },
    eyebrow: 'Documentation architecture sample',
    primaryLink: { href: '#documentation-systems-need-more-than-version-control', label: 'Read the workflow' },
    heroPanel: {
      id: 'focus-title',
      label: 'Workflow focus',
      items: [
        { title: 'Docs-as-code', text: 'Versioned content, structured source files, and reusable publishing patterns.' },
        { title: 'Governance', text: 'Ownership, review paths, and release control for documentation teams.' },
        { title: 'Contributor flow', text: 'Clear rules for authors, reviewers, and maintainers working across product areas.' }
      ]
    },
    usesMermaid: true,
    accentSections: [
      'documentation-systems-need-more-than-version-control',
      'a-simple-path-from-draft-to-publish',
      'docs-as-code-as-part-of-reliable-documentation-practice',
      'available-for-documentation-related-projects-and-content-governance'
    ]
  }
];

const buildPage = (page) => {
  return (async () => {
    const source = await readFile(page.sourcePath, 'utf8');
    const lines = source.replace(/\r\n/g, '\n').split('\n');

    const firstSection = lines.findIndex((line) => line.startsWith('## '));
    const title = lines.find((line) => line.startsWith('# '))?.slice(2).trim();
    const lead = lines.slice(0, firstSection)
      .find((line) => line && !line.startsWith('#') && !line.startsWith('[') && !line.startsWith('>'));

    if (!title || !lead || firstSection === -1) {
      throw new Error(`${page.sourcePath} needs a title, an introduction, and at least one level-two heading.`);
    }

    let body = '';
    let sectionOpen = false;
    let articleOpen = false;
    let caseGridOpen = false;
    let casePanelOpen = false;
    let cardGridOpen = false;
    let cardOpen = false;
    let stepsGridOpen = false;
    let stepOpen = false;
    let timelineOpen = false;
    let timelineCardOpen = false;
    let contactGridOpen = false;
    let contactCardOpen = false;
    let sectionArticleCount = 0;
    let index = firstSection;
    let codeGroup = 0;
    let pendingMeta = null;
    let pendingIntro = null;

    const inCustomBlock = () => (
      caseGridOpen || casePanelOpen ||
      cardGridOpen || cardOpen ||
      stepsGridOpen || stepOpen ||
      timelineOpen || timelineCardOpen ||
      contactGridOpen || contactCardOpen
    );

    const closeArticle = () => {
      if (articleOpen) {
        body += '        </article>\n';
        articleOpen = false;
      }
    };

    const closeCasePanel = () => {
      if (casePanelOpen) {
        body += '          </article>\n';
        casePanelOpen = false;
      }
    };

    const closeCaseGrid = () => {
      closeCasePanel();
      if (caseGridOpen) {
        body += '        </div>\n';
        caseGridOpen = false;
      }
    };

    const closeCard = () => {
      if (cardOpen) {
        body += '          </article>\n';
        cardOpen = false;
      }
    };

    const closeCardGrid = () => {
      closeCard();
      if (cardGridOpen) {
        body += '        </div>\n';
        cardGridOpen = false;
      }
    };

    const closeStep = () => {
      if (stepOpen) {
        body += '          </article>\n';
        stepOpen = false;
      }
    };

    const closeStepsGrid = () => {
      closeStep();
      if (stepsGridOpen) {
        body += '        </div>\n';
        stepsGridOpen = false;
      }
    };

    const closeTimelineCard = () => {
      if (timelineCardOpen) {
        body += '          </article>\n';
        timelineCardOpen = false;
      }
    };

    const closeTimeline = () => {
      closeTimelineCard();
      if (timelineOpen) {
        body += '        </div>\n';
        timelineOpen = false;
      }
    };

    const closeContactCard = () => {
      if (contactCardOpen) {
        body += '          </article>\n';
        contactCardOpen = false;
      }
    };

    const closeContactGrid = () => {
      closeContactCard();
      if (contactGridOpen) {
        body += '        </div>\n';
        contactGridOpen = false;
      }
    };

    const closeSection = () => {
      closeContactGrid();
      closeTimeline();
      closeStepsGrid();
      closeCardGrid();
      closeCaseGrid();
      closeArticle();
      if (sectionOpen) {
        body += '      </div>\n    </section>\n';
        sectionOpen = false;
      }
    };

    while (index < lines.length) {
      const line = lines[index];

      if (line.startsWith('## ')) {
        closeSection();
        const heading = line.slice(3).trim();
        const id = slug(heading);
        const defaultAccents = page.noAccentOverview ? [] : ['overview'];
        const accentIds = new Set([...(page.accentSections ?? []), ...defaultAccents]);
        const accent = accentIds.has(id) ? ' section--accent' : '';
        sectionArticleCount = 0;
        pendingIntro = null;

        let look = index + 1;
        while (look < lines.length && lines[look] === '') look += 1;
        if (lines[look] === '::: intro') {
          const introLines = [];
          look += 1;
          while (look < lines.length && lines[look] !== ':::') {
            if (lines[look]) introLines.push(lines[look]);
            look += 1;
          }
          pendingIntro = introLines.join(' ');
          index = look + 1;
        } else {
          index += 1;
        }

        body += `    <section class="section${accent}" id="${id}">
      <div class="container">
        <div class="section__header">
          <div>
            <p class="section-kicker">Tutorial</p>
            <h2 class="section-title">${inline(heading)}</h2>
          </div>
`;
        if (pendingIntro) {
          body += `          <p class="section-intro">${inline(pendingIntro)}</p>\n`;
        }
        body += '        </div>\n';
        sectionOpen = true;
        continue;
      }

      if (line === '::: meta') {
        const metaLines = [];
        index += 1;
        while (index < lines.length && lines[index] !== ':::') {
          if (lines[index]) metaLines.push(lines[index]);
          index += 1;
        }
        pendingMeta = metaLines.join(' ');
        index += 1;
        continue;
      }

      if (line === '::: case-grid') {
        closeArticle();
        body += '        <div class="case-grid">\n';
        caseGridOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: case-panel') {
        closeCasePanel();
        body += '          <article class="case-panel">\n';
        casePanelOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: card-grid') {
        closeArticle();
        body += '        <div class="samples-grid">\n';
        cardGridOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: card') {
        closeCard();
        body += '          <article class="sample-card sample-card--regular">\n';
        cardOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: steps-grid') {
        closeArticle();
        body += '        <div class="results-grid">\n';
        stepsGridOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: step') {
        closeStep();
        body += '          <article class="result-card">\n';
        stepOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: timeline') {
        closeArticle();
        body += '        <div class="timeline">\n';
        timelineOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: timeline-card') {
        closeTimelineCard();
        body += '          <article class="timeline-card">\n';
        timelineCardOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: contact-grid') {
        closeArticle();
        body += '        <div class="contact-grid">\n';
        contactGridOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: contact-card') {
        closeContactCard();
        body += '          <article class="contact-card">\n';
        contactCardOpen = true;
        index += 1;
        continue;
      }

      if (line === '::: actions') {
        const actionLines = [];
        index += 1;
        while (index < lines.length && lines[index] !== ':::') {
          if (lines[index]) actionLines.push(lines[index]);
          index += 1;
        }
        const links = actionLines
          .map((entry, actionIndex) => {
            const match = entry.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (!match) {
              throw new Error(`Invalid action link in ${page.sourcePath}: "${entry}"`);
            }
            const [, text, href] = match;
            const variant = actionIndex === 0 ? 'button-link button-link--primary' : 'button-link button-link--secondary';
            const external = /^https?:\/\//.test(href);
            const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a class="${variant}" href="${escapeHtml(href)}"${attrs}>${text}</a>`;
          })
          .join('');
        body += `        <div class="hero__actions">${links}</div>\n`;
        index += 1;
        continue;
      }

      if (line === '::: mermaid') {
        const mermaidLines = [];
        index += 1;
        while (index < lines.length && lines[index] !== ':::') {
          mermaidLines.push(lines[index]);
          index += 1;
        }
        body += `          <div class="sample-summary mermaid-wrap">\n            <pre class="mermaid">${escapeHtml(mermaidLines.join('\n'))}</pre>\n          </div>\n`;
        index += 1;
        continue;
      }

      if (line === ':::') {
        if (contactCardOpen) closeContactCard();
        else if (contactGridOpen) closeContactGrid();
        else if (timelineCardOpen) closeTimelineCard();
        else if (timelineOpen) closeTimeline();
        else if (stepOpen) closeStep();
        else if (stepsGridOpen) closeStepsGrid();
        else if (cardOpen) closeCard();
        else if (cardGridOpen) closeCardGrid();
        else if (casePanelOpen) closeCasePanel();
        else if (caseGridOpen) closeCaseGrid();
        index += 1;
        continue;
      }

      if (line.startsWith('### ')) {
        const heading = line.slice(4).trim();

        if (casePanelOpen) {
          body += `            <h3>${inline(heading)}</h3>\n`;
        } else if (cardOpen) {
          if (pendingMeta) {
            const chips = pendingMeta.split('·').map((item) => item.trim()).filter(Boolean);
            body += `            <div class="sample-card__meta">${chips.map((chip) => `<span class="chip">${inline(chip)}</span>`).join('')}</div>\n`;
          }
          body += `            <h3>${inline(heading)}</h3>\n`;
          pendingMeta = null;
        } else if (stepOpen) {
          const value = pendingMeta ? inline(pendingMeta) : '';
          if (value) {
            body += `            <span class="result-card__value">${value}</span>\n`;
          }
          body += `            <p>${inline(lines[index + 1] ?? '')}</p>\n`;
          pendingMeta = null;
          index += 2;
          if (lines[index] === ':::') continue;
          continue;
        } else if (timelineCardOpen) {
          if (pendingMeta) {
            const chips = pendingMeta.split('·').map((item) => item.trim()).filter(Boolean);
            body += `            <div class="timeline-card__meta">${chips.map((chip) => `<span>${inline(chip)}</span>`).join('')}</div>\n`;
          }
          body += `            <h3>${inline(heading)}</h3>\n`;
          pendingMeta = null;
        } else if (contactCardOpen) {
          body += `            <h3>${inline(heading)}</h3>\n`;
        } else {
          if (caseGridOpen) {
            body += `            <h3>${inline(heading)}</h3>\n`;
          } else {
            if (!articleOpen) {
              const spaced = page.spacedArticles && sectionArticleCount > 0 ? ' sample--spaced' : '';
              body += `        <article class="sample${spaced}">\n`;
              articleOpen = true;
            }
            const meta = pendingMeta ? `<p class="meta">${inline(pendingMeta)}</p>` : '';
            body += `          <div class="sample-header"><div class="sample-heading"><h3>${inline(heading)}</h3>${meta}</div></div>\n`;
            sectionArticleCount += 1;
            pendingMeta = null;
          }
        }

        index += 1;
        continue;
      }

      if (line.startsWith('#### ')) {
        const firstExample = line.slice(5).trim().match(/^(cURL|JavaScript) - (.+)$/);
        let codeStart = index + 1;
        while (lines[codeStart] === '') codeStart += 1;

        if (firstExample && lines[codeStart]?.startsWith('```')) {
          const firstCode = [];
          let cursor = codeStart + 1;
          const firstLanguage = lines[codeStart].slice(3).trim() || 'text';

          while (cursor < lines.length && !lines[cursor].startsWith('```')) {
            firstCode.push(lines[cursor]);
            cursor += 1;
          }

          cursor += 1;
          while (lines[cursor] === '') cursor += 1;
          const secondExample = lines[cursor]?.startsWith('#### ')
            ? lines[cursor].slice(5).trim().match(/^(cURL|JavaScript) - (.+)$/)
            : null;

          let secondCodeStart = cursor + 1;
          while (lines[secondCodeStart] === '') secondCodeStart += 1;
          if (secondExample && secondExample[2] === firstExample[2] && lines[secondCodeStart]?.startsWith('```')) {
            const secondCode = [];
            const secondLanguage = lines[secondCodeStart].slice(3).trim() || 'text';
            cursor = secondCodeStart + 1;
            while (cursor < lines.length && !lines[cursor].startsWith('```')) {
              secondCode.push(lines[cursor]);
              cursor += 1;
            }
            if (cursor === lines.length) throw new Error(`Unclosed code fence in ${page.sourcePath}.`);

            const groupId = `code-group-${codeGroup += 1}`;
            body += `          <div class="code-switcher" data-code-group>
            <div class="code-tabs" role="tablist" aria-label="Code examples for ${inline(firstExample[2])}">
              <button class="code-tab is-active" type="button" role="tab" id="${groupId}-curl" aria-selected="true" aria-controls="${groupId}-curl-panel" data-code-tab="curl">cURL</button>
              <button class="code-tab" type="button" role="tab" id="${groupId}-javascript" aria-selected="false" aria-controls="${groupId}-javascript-panel" tabindex="-1" data-code-tab="javascript">JavaScript</button>
            </div>
            <pre class="code-panel is-active" id="${groupId}-curl-panel" role="tabpanel" aria-labelledby="${groupId}-curl" data-code-panel="curl"><code class="language-${escapeHtml(firstLanguage)}">${escapeHtml(firstCode.join('\n'))}</code></pre>
            <pre class="code-panel" id="${groupId}-javascript-panel" role="tabpanel" aria-labelledby="${groupId}-javascript" data-code-panel="javascript" hidden><code class="language-${escapeHtml(secondLanguage)}">${escapeHtml(secondCode.join('\n'))}</code></pre>
          </div>
`;
            index = cursor + 1;
            continue;
          }
        }

        body += `          <h4>${inline(line.slice(5).trim())}</h4>\n`;
        index += 1;
        continue;
      }

      if (line.startsWith('```')) {
        const language = line.slice(3).trim() || 'text';
        const code = [];
        index += 1;
        while (index < lines.length && !lines[index].startsWith('```')) {
          code.push(lines[index]);
          index += 1;
        }
        if (index === lines.length) throw new Error(`Unclosed code fence in ${page.sourcePath}.`);
        const indent = inCustomBlock() ? '            ' : '          ';
        body += `${indent}<pre class="code-panel"><code class="language-${escapeHtml(language)}">${escapeHtml(code.join('\n'))}</code></pre>\n`;
        index += 1;
        continue;
      }

      if (line.startsWith('|')) {
        const rows = [];
        while (index < lines.length && lines[index].startsWith('|')) {
          rows.push(lines[index]);
          index += 1;
        }
        body += `          ${table(rows)}\n`;
        continue;
      }

      if (line.startsWith('- ')) {
        const items = [];
        while (index < lines.length && lines[index].startsWith('- ')) {
          items.push(lines[index].slice(2));
          index += 1;
        }

        if (timelineCardOpen) {
          body += `            <ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>\n`;
          continue;
        }

        const indent = inCustomBlock() ? '            ' : '          ';
        body += `${indent}<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>\n`;
        continue;
      }

      if (/^\d+\. /.test(line)) {
        const items = [];
        while (index < lines.length && /^\d+\. /.test(lines[index])) {
          items.push(lines[index].replace(/^\d+\. /, ''));
          index += 1;
        }
        body += `          <ol>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>\n`;
        continue;
      }

      if (line.startsWith('> ')) {
        body += `          <p class="sample-summary"><strong>${inline(line.slice(2).trim())}</strong></p>\n`;
        index += 1;
        continue;
      }

      if (line) {
        if (!articleOpen && !inCustomBlock() && sectionOpen) {
          const spaced = page.spacedArticles && sectionArticleCount > 0 ? ' sample--spaced' : '';
          body += `        <article class="sample${spaced}">\n`;
          articleOpen = true;
          sectionArticleCount += 1;
        }

        const paragraph = [line];
        index += 1;
        while (index < lines.length && lines[index] && !/^(#{2,4} |```|\||- |\d+\. |> |:::)/.test(lines[index])) {
          paragraph.push(lines[index]);
          index += 1;
        }
        const text = paragraph.join(' ');

        if (casePanelOpen || cardOpen || timelineCardOpen || contactCardOpen) {
          body += `            <p>${inline(text)}</p>\n`;
        } else {
          body += `          <p class="sample-summary">${inline(text)}</p>\n`;
        }
        continue;
      }

      index += 1;
    }

    closeSection();

    const html = renderDocumentationPage({
      sourcePath: page.sourcePath,
      title,
      lead,
      body,
      metadata: page.metadata,
      eyebrow: page.eyebrow,
      primaryLink: page.primaryLink,
      heroStats: page.heroStats,
      heroPanel: page.heroPanel,
      footerTag: page.footerTag,
      usesMermaid: page.usesMermaid
    });

    await writeFile(page.outputPath, html);
    console.log(`Built ${page.outputPath} from ${page.sourcePath}.`);
  })();
};

for (const page of pages) {
  await buildPage(page);
}
