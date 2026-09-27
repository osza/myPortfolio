const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

export const renderDocumentationPage = ({ sourcePath, title, lead, body, metadata }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(metadata.title)}</title>
  <meta name="description" content="${escapeHtml(metadata.description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
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
          <p class="eyebrow">Developer documentation sample</p>
          <h1>${inline(title)}</h1>
          <p class="hero__lead">${inline(lead)}</p>
          <div class="hero__actions"><a class="button-link button-link--primary" href="#what-this-tutorial-demonstrates">Read tutorial</a><a class="button-link button-link--secondary" href="index.html#samples">Back to selected work</a></div>
        </div>
        <aside class="hero-panel" aria-labelledby="sample-proof-title">
          <p class="hero-panel__label" id="sample-proof-title">Build status</p>
          <ul class="proof-list"><li><strong>Markdown source</strong><span>${sourcePath}</span></li><li><strong>Generated HTML</strong><span>Built locally before publication.</span></li><li><strong>Checked output</strong><span>Source markers and local links are validated in CI.</span></li></ul>
        </aside>
      </div>
    </section>
${body}  </main>
  <footer class="site-footer"><div class="container site-footer__inner"><span>Piotr Oszenda — Technical Writer · Knowledge Manager · Documentation Architect</span><span>Built from Markdown source</span></div></footer>
  <script>
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
          panel.classList.toggle('is-active', active);
          panel.toggleAttribute('hidden', !active);
        });
      }));
    });
  </script>
</body>
</html>
`;
