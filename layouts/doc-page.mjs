const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inline = (value = '') => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
    const external = /^https?:\/\//.test(href) || href.startsWith('mailto:');
    const attrs = external && !href.startsWith('mailto:')
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${text}</a>`;
  });

const renderProofList = (items = []) => items
  .map((item) => `<li><strong>${inline(item.title)}</strong><span>${inline(item.text)}</span></li>`)
  .join('');

const renderCaseProofList = (items = []) => items
  .map((item) => `            <li>
              <strong>${inline(item.title)}</strong>
              <span>${inline(item.text)}</span>
            </li>`)
  .join('\n');

const renderHeroStats = (stats = []) => stats
  .map((stat) => `            <span class="hero-stat">${inline(stat)}</span>`)
  .join('\n');

const renderHeroPanel = (heroPanel, sourcePath) => {
  const panel = heroPanel ?? {
    label: 'Build status',
    items: [
      { title: 'Markdown source', text: sourcePath },
      { title: 'Generated HTML', text: 'Built locally before publication.' },
      { title: 'Checked output', text: 'Source markers and local links are validated in CI.' }
    ]
  };

  return panel.style === 'case'
    ? `          <ul class="case-proof-list">\n${renderCaseProofList(panel.items)}\n          </ul>`
    : `          <ul class="proof-list">${renderProofList(panel.items)}</ul>`;
};

const renderTabsScript = () => `  <script>
    document.querySelectorAll('[data-code-group]').forEach((group) => {
      const tabs = Array.from(group.querySelectorAll('[data-code-tab]'));
      const panels = Array.from(group.querySelectorAll('[data-code-panel]'));

      tabs.forEach((tab) => tab.addEventListener('click', () => {
        const selected = tab.dataset.codeTab;

        tabs.forEach((item) => {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
        });

        panels.forEach((panel) => {
          const active = panel.dataset.codePanel === selected;
          panel.hidden = !active;
        });
      }));

      tabs.forEach((tab) => tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();

        const currentIndex = tabs.indexOf(tab);
        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;

        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }));

      if (!tabs.some((tab) => tab.classList.contains('is-active')) && tabs[0]) {
        tabs[0].click();
      }
    });
  </script>`;

export const renderDocumentationPage = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow = 'Developer documentation sample',
  primaryLink = { href: '#overview', label: 'Read page' },
  heroStats = null,
  heroPanel = null,
  footerTag = 'Built from Markdown source',
  usesMermaid = false,
  sectionKicker = 'Tutorial'
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(metadata.title)}</title>
  <meta name="description" content="${escapeHtml(metadata.description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${usesMermaid ? '  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>\n  <script>\n    mermaid.initialize({ startOnLoad: true, theme: \'default\' });\n  </script>\n' : ''}  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Generated from ${sourcePath}. Run npm run build after editing the source. -->
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="index.html#top" aria-label="Go to homepage"><span class="brand__mark" aria-hidden="true">PO</span><span>Piotr Oszenda</span></a>
      <nav class="main-nav" aria-label="Primary">
        <a href="index.html#work">Work</a><a href="index.html#approach">Approach</a><a href="index.html#experience">Experience</a><a href="index.html#samples">Samples</a><a href="index.html#contact">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <section class="hero" id="top">
      <div class="container hero__grid">
        <div>
          <p class="eyebrow">${inline(eyebrow)}</p>
          <h1>${inline(title)}</h1>
          <p class="hero__lead">${inline(lead)}</p>
          <div class="hero__actions"><a class="button-link button-link--primary" href="${escapeHtml(primaryLink.href)}">${inline(primaryLink.label)}</a><a class="button-link button-link--secondary" href="index.html#samples">Back to selected work</a></div>
${heroStats ? `          <div class="hero-stats" aria-label="Page metadata">
${renderHeroStats(heroStats)}
          </div>
` : ''}        </div>
        <aside class="hero-panel" aria-labelledby="${heroPanel?.id ?? 'sample-proof-title'}">
          <p class="hero-panel__label" id="${heroPanel?.id ?? 'sample-proof-title'}">${inline(heroPanel?.label ?? 'Build status')}</p>
${renderHeroPanel(heroPanel, sourcePath)}
        </aside>
      </div>
    </section>
${body}  </main>
  <footer class="site-footer"><div class="container site-footer__inner"><span>Piotr Oszenda — Technical Writer · Knowledge Manager · Documentation Architect</span><span>${escapeHtml(footerTag)}</span></div></footer>
${renderTabsScript()}
</body>
</html>`;
