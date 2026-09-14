import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const files = (await readdir('.')).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = href.split('#')[0].replace(/^\.\//, '');
    if (!target) continue;
    try {
      await access(path.resolve(target));
    } catch {
      failures.push(`${file}: missing local target ${href}`);
    }
  }
}

const source = await readFile('customers-api-tutorial-v2.md', 'utf8');
const output = await readFile('customers-api-tutorial-v2.html', 'utf8');
if (!output.includes('Generated from customers-api-tutorial-v2.md')) {
  failures.push('customers-api-tutorial-v2.html: missing generated-file marker');
}
for (const marker of ['Manage customer data with the Customers API', 'CRUD tutorial']) {
  if (!source.includes(marker) || !output.includes(marker)) {
    failures.push(`customers-api-tutorial-v2.html: generated output is missing "${marker}"`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${files.length} HTML pages, local links, and the generated Customers API tutorial.`);
