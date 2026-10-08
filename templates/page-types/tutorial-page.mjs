import { renderSharedPageShell } from '../shared/shared-page-shell.mjs';

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
  heroPanel,
  footerTag,
  usesMermaid,
  mermaidMode: 'tutorial',
  footerMode: 'simple',
  bodyClassName: 'page--tutorial'
});
