import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sharedDir = path.resolve(__dirname, '../node_modules/vite-ssg/dist/shared');

if (fs.existsSync(sharedDir)) {
  const files = fs.readdirSync(sharedDir).filter(f => f.endsWith('.mjs'));
  let patchedCount = 0;

  for (const file of files) {
    const filePath = path.join(sharedDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('new JSDOM(renderedHTML)') && !content.includes('jsdom.window.close()')) {
      // 1. Patch JSDOM close to release memory after serialization
      content = content.replace(
        'const html = jsdom.serialize();',
        'const html = jsdom.serialize();\n        try { jsdom.window.close(); } catch (e) {}'
      );

      // 2. Early cleanup for ctx.modules reference
      if (!content.includes('const ctxModules = ctx.modules;')) {
        content = content.replace(
          'const jsdom = new JSDOM(renderedHTML);\n        renderPreloadLinks(jsdom.window.document, ctx.modules || /* @__PURE__ */ new Set(), ssrManifest);',
          'const ctxModules = ctx.modules;\n        ctx.modules = null;\n        const jsdom = new JSDOM(renderedHTML);\n        renderPreloadLinks(jsdom.window.document, ctxModules || /* @__PURE__ */ new Set(), ssrManifest);'
        );
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-vite-ssg] Successfully patched ${file}`);
      patchedCount++;
    }
  }

  if (patchedCount === 0) {
    console.log('[patch-vite-ssg] vite-ssg is already patched or patch not needed.');
  }
} else {
  console.log('[patch-vite-ssg] vite-ssg not found, skipping patch.');
}
