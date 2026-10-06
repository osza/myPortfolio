import { renderSharedPageShell } from '../shared/shared-page-shell.mjs';

const defaultEssayHeroPanel = {
  style: 'case',
  label: 'Essay focus',
  items: [
    { title: 'Angle', text: 'Long-form argument shaped for online reading.' },
    { title: 'Structure', text: 'Clear narrative sections with editorial pacing.' },
    { title: 'Output', text: 'Published as static HTML from a maintainable source file.' }
  ]
};

export const renderEssayPage = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow = 'Essay sample',
  primaryLink = { href: '#the-argument', label: 'Read essay' },
  secondaryLink = { href: 'index.html#samples', label: 'Back to selected work' },
  heroStats = null,
  heroPanel = null,
  footerTag = 'Built from Markdown source',
  usesMermaid = false
}) => renderSharedPageShell({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow,
  primaryLink,
  secondaryLink,
  heroStats,
  heroPanel: heroPanel ?? defaultEssayHeroPanel,
  footerTag,
  usesMermaid,
  mermaidMode: 'doc',
  footerMode: 'simple'
});
