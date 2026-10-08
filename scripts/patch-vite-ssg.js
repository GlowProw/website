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
    let dirty = false;

    if (content.includes('new JSDOM(renderedHTML)') && !content.includes('jsdom.window.close()')) {
      // Patch JSDOM close to release memory after serialization
      content = content.replace(
        'const html = jsdom.serialize();',
        'const html = jsdom.serialize();\n        try { jsdom.window.close(); } catch (e) {}'
      );

      // Early cleanup for ctx.modules reference
      if (!content.includes('const ctxModules = ctx.modules;')) {
        content = content.replace(
          'const jsdom = new JSDOM(renderedHTML);\n        renderPreloadLinks(jsdom.window.document, ctx.modules || /* @__PURE__ */ new Set(), ssrManifest);',
          'const ctxModules = ctx.modules;\n        ctx.modules = null;\n        const jsdom = new JSDOM(renderedHTML);\n        renderPreloadLinks(jsdom.window.document, ctxModules || /* @__PURE__ */ new Set(), ssrManifest);'
        );
      }

      dirty = true;
    }

    // vite-ssg 对 server 构建硬编码 minify: false，导致 SSR bundle 未压缩（约 3 倍体积、解析更慢）。
    // 改为 esbuild 压缩，与 vite.config 中 build.minify 保持一致。
    if (content.includes('minify: false,\n      cssCodeSplit: false,') && !content.includes('/* patched: ssr-minify */')) {
      content = content.replace(
        'minify: false,\n      cssCodeSplit: false,',
        'minify: "esbuild", /* patched: ssr-minify */\n      cssCodeSplit: false,'
      );
      dirty = true;
    }

    // 分批 SSG：非首批分片复用首批已产出的 client 构建结果（dist/index.html、dist/.vite/ssr-manifest.json、
    // 静态资源），跳过 client build，避免 Vite 清空 dist 把前面分片的 HTML 删掉，同时节省每批构建时间。
    const clientBuildMarker = '/* patched: shard-skip-client */';
    const clientBuildAnchor = '  buildLog("Build for client...");\n  await build$1(mergeConfig(viteConfig, {';
    if (content.includes(clientBuildAnchor) && !content.includes(clientBuildMarker)) {
      content = content.replace(
        clientBuildAnchor,
        `  if (process.env.SSG_SHARD_SKIP_CLIENT !== "1") { ${clientBuildMarker}\n  buildLog("Build for client...");\n  await build$1(mergeConfig(viteConfig, {`
      );
      // 在 client build 调用结束后补一个闭合花括号（定位紧随其后的 "if (mock)" 块前）
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
} else {
  console.log('[patch-vite-ssg] vite-ssg not found, skipping patch.');
}
