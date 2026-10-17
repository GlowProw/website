import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 为 vite-ssg 打补丁以优化内存占用、压缩产物与分片构建
 */
function patchViteSsg() {
  const sharedDir = path.resolve(__dirname, '../node_modules/vite-ssg/dist/shared');
  if (!fs.existsSync(sharedDir)) {
    console.log('[patch-vite-ssg] vite-ssg not found, skipping patch.');
    return;
  }

  const files = fs.readdirSync(sharedDir).filter(f => f.endsWith('.mjs'));
  let patchedCount = 0;

  for (const file of files) {
    const filePath = path.join(sharedDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let dirty = false;

    // 引入 VirtualConsole 并在创建 JSDOM 时过滤 css parsing 错误
    if (!content.includes('/* patched: virtual-console */')) {
      if (content.includes("import { JSDOM } from 'jsdom';")) {
        content = content.replace(
          "import { JSDOM } from 'jsdom';",
          "import { JSDOM, VirtualConsole } from 'jsdom'; /* patched: virtual-console */"
        );
        dirty = true;
      }
    }

    if (content.includes('new JSDOM(renderedHTML)') && !content.includes('jsdom.window.close()')) {
      content = content.replace(
        'const html = jsdom.serialize();',
        'const html = jsdom.serialize();\n        try { jsdom.window.close(); } catch (e) {}'
      );
      dirty = true;
    }

    if (content.includes('new JSDOM(renderedHTML)') && !content.includes('virtualConsole: _vc')) {
      if (content.includes('const ctxModules = ctx.modules;')) {
        content = content.replace(
          'const jsdom = new JSDOM(renderedHTML);',
          'const _vc = new VirtualConsole();\n        _vc.sendTo(console, { omitJSDOMErrors: true });\n        _vc.on("jsdomError", (e) => { if (e && e.type === "css parsing") return; console.error(e); });\n        const jsdom = new JSDOM(renderedHTML, { virtualConsole: _vc });'
        );
      } else {
        content = content.replace(
          'const jsdom = new JSDOM(renderedHTML);\n        renderPreloadLinks(jsdom.window.document, ctx.modules || /* @__PURE__ */ new Set(), ssrManifest);',
          'const ctxModules = ctx.modules;\n        ctx.modules = null;\n        const _vc = new VirtualConsole();\n        _vc.sendTo(console, { omitJSDOMErrors: true });\n        _vc.on("jsdomError", (e) => { if (e && e.type === "css parsing") return; console.error(e); });\n        const jsdom = new JSDOM(renderedHTML, { virtualConsole: _vc });\n        renderPreloadLinks(jsdom.window.document, ctxModules || /* @__PURE__ */ new Set(), ssrManifest);'
        );
      }
      dirty = true;
    }

    if (content.includes('minify: false,\n      cssCodeSplit: false,') && !content.includes('/* patched: ssr-minify */')) {
      content = content.replace(
        'minify: false,\n      cssCodeSplit: false,',
        'minify: "esbuild", /* patched: ssr-minify */\n      cssCodeSplit: false,'
      );
      dirty = true;
    }

    const clientBuildMarker = '/* patched: shard-skip-client */';
    const clientBuildAnchor = '  buildLog("Build for client...");\n  await build$1(mergeConfig(viteConfig, {';
    if (content.includes(clientBuildAnchor) && !content.includes(clientBuildMarker)) {
      content = content.replace(
        clientBuildAnchor,
        `  if (process.env.SSG_SHARD_SKIP_CLIENT !== "1") { ${clientBuildMarker}\n  buildLog("Build for client...");\n  await build$1(mergeConfig(viteConfig, {`
      );
      content = content.replace(
        '    mode: config.mode\n  }));\n  if (mock) {',
        '    mode: config.mode\n  }));\n  }\n  if (mock) {'
      );
      dirty = true;
    }

    if (dirty) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-vite-ssg] Successfully patched ${file}`);
      patchedCount++;
    }
  }

  if (patchedCount === 0) {
    console.log('[patch-vite-ssg] vite-ssg is already patched or patch not needed.');
  }
}

/**
 * 修复 JSDOM 内部 CSSOM 无法解析 @layer 等现代 CSS 语法导致的抛错
 */
function patchJsdomStylesheets() {
  const stylesheetsPath = path.resolve(__dirname, '../node_modules/jsdom/lib/jsdom/living/helpers/stylesheets.js');
  if (!fs.existsSync(stylesheetsPath)) {
    return;
  }

  let content = fs.readFileSync(stylesheetsPath, 'utf8');
  const targetPattern = 'elementImpl._ownerDocument._defaultView._virtualConsole.emit("jsdomError", error);';
  const patchMarker = '/* patched: ignore css parsing error */';

  if (content.includes(targetPattern) && !content.includes(patchMarker)) {
    content = content.replace(
      targetPattern,
      `// CSSOM 无法解析 @layer 等现代 CSS 语法，SSR 环境下忽略此类错误\n      if (error && error.type !== "css parsing") {\n        elementImpl._ownerDocument._defaultView._virtualConsole.emit("jsdomError", error);\n      } ${patchMarker}`
    );
    fs.writeFileSync(stylesheetsPath, content, 'utf8');
    console.log('[patch-vite-ssg] Successfully patched jsdom stylesheets helper');
  }
}

patchViteSsg();
patchJsdomStylesheets();
