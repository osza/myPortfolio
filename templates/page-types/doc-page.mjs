import { renderSharedPageShell } from '../shared/shared-page-shell.mjs';

export const renderDocumentationPage = ({
  sourcePath,
  title,
  lead,
  body,
  metadata,
  eyebrow = 'Developer documentation sample',
  primaryLink = { href: '#overview', label: 'Read page' },
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
  mermaidMode: 'doc',
  footerMode: 'simple',
  bodyClassName: 'page--doc'
});
