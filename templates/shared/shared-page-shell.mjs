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
  .map((item) => `            <li>\n              <strong>${inline(item.title)}</strong>\n              <span>${inline(item.text)}</span>\n            </li>`)
  .join('\n');

const renderHeroStats = (stats = [], indented = false) => stats
  .map((stat) => indented
    ? `            <span class="hero-stat">${inline(stat)}</span>`
    : `<span class="hero-stat">${inline(stat)}</span>`)
  .join(indented ? '\n' : '');

const buildDefaultHeroPanel = (sourcePath) => ({
  id: 'sample-proof-title',
  label: 'Build status',
  style: 'default',
  items: [
    { title: 'Markdown source', text: sourcePath },
    { title: 'Generated HTML', text: 'Built locally before publication.' },
    { title: 'Checked output', text: 'Source markers and local links are validated in CI.' }
  ]
});

const normalizeHeroPanel = (heroPanel, sourcePath) => {
  const panel = heroPanel && Array.isArray(heroPanel.items) && heroPanel.items.length
    ? heroPanel
    : buildDefaultHeroPanel(sourcePath);

  return {
    id: panel.id || 'sample-proof-title',
    label: panel.label || 'Build status',
    style: panel.style === 'case' ? 'case' : 'default',
    items: panel.items
  };
};

const renderHeroPanel = (heroPanel, sourcePath) => {
  const panel = normalizeHeroPanel(heroPanel, sourcePath);

  if (panel.style === 'case') {
    return `        <aside class="hero-panel" aria-labelledby="${escapeHtml(panel.id)}">\n          <p class="hero-panel__label" id="${escapeHtml(panel.id)}">${inline(panel.label)}</p>\n          <ul class="case-proof-list">\n${renderCaseProofList(panel.items)}\n          </ul>\n        </aside>`;
  }

  return `        <aside class="hero-panel" aria-labelledby="${escapeHtml(panel.id)}">\n          <p class="hero-panel__label" id="${escapeHtml(panel.id)}">${inline(panel.label)}</p>\n          <ul class="proof-list">${renderProofList(panel.items)}</ul>\n        </aside>`;
};

const renderHeroMeta = (heroStats = null) => {
  if (!Array.isArray(heroStats) || !heroStats.length) {
    return '';
  }

  return `          <div class="hero__meta">${renderHeroStats(heroStats)}</div>`;
};

const renderHeroActions = (primaryLink, secondaryLink) => `          <div class="hero__actions"><a class="button-link button-link--primary" href="${escapeHtml(primaryLink.href)}">${inline(primaryLink.label)}</a><a class="button-link button-link--secondary" href="${escapeHtml(secondaryLink.href)}">${inline(secondaryLink.label)}</a></div>`;

const renderMermaidScript = (mode = 'tutorial') => {
  if (mode === 'doc') {
    return '  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>\n  <script>\n    mermaid.initialize({\n      startOnLoad: true,\n      theme: \'base\',\n      securityLevel: \'loose\',\n      flowchart: {\n        useMaxWidth: true,\n        htmlLabels: false,\n        nodeSpacing: 30,\n        rankSpacing: 38,\n        curve: \'basis\'\n      },\n      themeVariables: {\n        fontFamily: \'Inter, sans-serif\',\n        fontSize: \'15px\',\n        primaryColor: \'#f8f6f1\',\n        primaryTextColor: \'#201d18\',\n        primaryBorderColor: \'#c7b794\',\n        lineColor: \'#6e6558\',\n        secondaryColor: \'#f4efe6\',\n        tertiaryColor: \'#fcfbf8\',\n        clusterBkg: \'#fcfbf8\',\n        clusterBorder: \'#d8ccba\',\n        clusterBkg0: \'#fcfbf8\',\n        clusterBorder0: \'#d8ccba\',\n        clusterBkg1: \'#fcfbf8\',\n        clusterBorder1: \'#d8ccba\'\n      }\n    });\n  </script>\n';
  }

  return '  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>\n  <script>\n    mermaid.initialize({ startOnLoad: true, theme: \'default\' });\n  </script>\n';
};

export const renderCodeSwitcherScript = () => `<script>\n(() => {\n  const groups = document.querySelectorAll('[data-code-group]');\n  for (const group of groups) {\n    const tabs = Array.from(group.querySelectorAll('[data-code-tab]'));\n    const panels = Array.from(group.querySelectorAll('[data-code-panel]'));\n\n    if (!tabs.length || !panels.length) continue;\n\n    const activate = (index) => {\n      tabs.forEach((tab, tabIndex) => {\n        const active = tabIndex === index;\n        tab.classList.toggle('is-active', active);\n        tab.setAttribute('aria-selected', active ? 'true' : 'false');\n        tab.setAttribute('tabindex', active ? '0' : '-1');\n      });\n\n      panels.forEach((panel, panelIndex) => {\n        const active = panelIndex === index;\n        panel.classList.toggle('is-active', active);\n        panel.hidden = !active;\n      });\n    };\n\n    tabs.forEach((tab, index) => {\n      tab.addEventListener('click', () => activate(index));\n      tab.addEventListener('keydown', (event) => {\n        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;\n\n        event.preventDefault();\n\n        let nextIndex = index;\n        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;\n        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;\n        if (event.key === 'Home') nextIndex = 0;\n        if (event.key === 'End') nextIndex = tabs.length - 1;\n\n        activate(nextIndex);\n        tabs[nextIndex].focus();\n      });\n    });\n\n    activate(0);\n  }\n})();\n</script>`;

export const renderSharedPageShell = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow,
  primaryLink,
  secondaryLink = { href: 'index.html#samples', label: 'Back to selected work' },
  heroStats = null,
  heroPanel = null,
  footerTag = 'Built from Markdown source',
  usesMermaid = false,
  mermaidMode = 'tutorial',
  footerMode = 'simple',
  extraFooterContent = ''
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
  ${usesMermaid ? renderMermaidScript(mermaidMode) : ''}  <link rel="stylesheet" href="assets/css/style.css">
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
${renderHeroMeta(heroStats)}
${renderHeroActions(primaryLink, secondaryLink)}
        </div>
${renderHeroPanel(heroPanel, sourcePath)}
      </div>
    </section>
${body}
  </main>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p>${inline(footerTag)}</p>
      ${footerMode === 'simple' ? '<a href="#top">Back to top</a>' : `<span>${inline(extraFooterContent)}</span>`}
    </div>
  </footer>
  ${renderCodeSwitcherScript()}
</body>
</html>`;
