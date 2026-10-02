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

const renderHeroStats = (stats = []) => stats
  .map((stat) => `<span class="hero-stat">${inline(stat)}</span>`)
  .join('\n');

const renderHeroPanel = (heroPanel, sourcePath) => {
  const panel = heroPanel && Array.isArray(heroPanel.items) && heroPanel.items.length
    ? heroPanel
    : {
        id: 'sample-proof-title',
        label: 'Build status',
        items: [
          { title: 'Markdown source', text: sourcePath },
          { title: 'Generated HTML', text: 'Built locally before publication.' },
          { title: 'Checked output', text: 'Source markers and local links are validated in CI.' }
        ]
      };

  const panelId = panel.id || 'sample-proof-title';

  return `        <aside class="hero-panel" aria-labelledby="${escapeHtml(panelId)}">
          <p class="hero-panel__label" id="${escapeHtml(panelId)}">${inline(panel.label || 'Build status')}</p>
          <ul class="proof-list">${renderProofList(panel.items)}</ul>
        </aside>`;
};

const renderCodeSwitcherScript = () => `<script>
(() => {
  const groups = document.querySelectorAll('[data-code-group]');
  for (const group of groups) {
    const tabs = Array.from(group.querySelectorAll('[data-code-tab]'));
    const panels = Array.from(group.querySelectorAll('[data-code-panel]'));

    if (!tabs.length || !panels.length) continue;

    const activate = (index) => {
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.setAttribute('tabindex', active ? '0' : '-1');
      });

      panels.forEach((panel, panelIndex) => {
        const active = panelIndex === index;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(index));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();

        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;

        activate(nextIndex);
        tabs[nextIndex].focus();
      });
    });

    activate(0);
  }
})();
</script>`;

export const renderTutorialPage = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow = 'Developer documentation sample',
  primaryLink = { href: '#what-this-tutorial-demonstrates', label: 'Read tutorial' },
  secondaryLink = { href: 'index.html#samples', label: 'Back to selected work' },
  heroStats = null,
  heroPanel = null,
  footerTag = 'Built from Markdown source',
  usesMermaid = false
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
          ${Array.isArray(heroStats) && heroStats.length ? `<div class="hero__meta">${renderHeroStats(heroStats)}</div>` : ''}
          <div class="hero__actions"><a class="button-link button-link--primary" href="${escapeHtml(primaryLink.href)}">${inline(primaryLink.label)}</a><a class="button-link button-link--secondary" href="${escapeHtml(secondaryLink.href)}">${inline(secondaryLink.label)}</a></div>
        </div>
${renderHeroPanel(heroPanel, sourcePath)}
      </div>
    </section>
${body}
  </main>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p>${inline(footerTag)}</p>
      <a href="#top">Back to top</a>
    </div>
  </footer>
  ${renderCodeSwitcherScript()}
</body>
</html>`;
