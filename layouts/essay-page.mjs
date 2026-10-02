import { renderDocumentationPage } from './doc-page.mjs';

export const renderEssayPage = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow = 'Essay sample',
  primaryLink = { href: '#the-argument', label: 'Read essay' },
  heroStats = null,
  heroPanel = null,
  footerTag = 'Essay page built from Markdown source',
  usesMermaid = false
}) => renderDocumentationPage({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow,
  primaryLink,
  heroStats,
  heroPanel: heroPanel ?? {
    style: 'case',
    label: 'Essay focus',
    items: [
      { title: 'Angle', text: 'Long-form argument shaped for online reading.' },
      { title: 'Structure', text: 'Clear narrative sections with editorial pacing.' },
      { title: 'Output', text: 'Published as static HTML from a maintainable source file.' }
    ]
  },
  footerTag,
  usesMermaid
});
