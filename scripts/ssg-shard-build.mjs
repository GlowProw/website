/**
 * 分片 SSG 构建编排器
 *
 * 在长生命周期进程中持续分配，V8 老生代只涨不回收，最终 OOM。
 *
 * 方案：把预渲染路由按字母序连续切成 N 片，每片在【独立子进程】中运行 vite-ssg。
 * 进程退出即归还全部内存，单批内存上限确定可控。
 *
 * - 第 0 片：完整 client + server 构建（产出 index.html、ssr-manifest、静态资源）
 * - 其余片：跳过 client 构建（patch-vite-ssg 注入的 SSG_SHARD_SKIP_CLIENT 开关），
 *   只构建 server bundle 并渲染本片 HTML，复用第 0 片的 client 产物
 *
 * 环境变量：
 *   SSG_SHARD_TOTAL  分片总数（默认 4）
 *   NODE_OPTIONS     透传，建议 --expose-gc --max-old-space-size=<单机上限>
 */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const binPath = path.join(root, 'node_modules', 'vite-ssg', 'bin', 'vite-ssg.js');

const TOTAL = Math.max(1, Number.parseInt(process.env.SSG_SHARD_TOTAL || '4', 10));

const runShard = (index) => new Promise((resolve, reject) => {
    const env = {
        ...process.env,
        SSG_SHARD_INDEX: String(index),
        SSG_SHARD_TOTAL: String(TOTAL),
        SSG_SHARD_SKIP_CLIENT: index === 0 ? '' : '1',
    };

    const child = spawn(process.execPath, [binPath, 'build', '--mode', 'production'], {
        cwd: root,
        env,
        stdio: 'inherit',
    });

    child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`[ssg-shard] shard ${index + 1}/${TOTAL} failed with exit code ${code}`));
    });
});

const main = async () => {
    for (let i = 0; i < TOTAL; i++) {
        // 第 0 片前清空 dist；每片前清空 server 临时目录（vite-ssg 自身也会清，双保险）
        if (i === 0) {
            fs.rmSync(path.join(root, 'dist'), {recursive: true, force: true});
        }
        fs.rmSync(path.join(root, '.vite-ssg-temp'), {recursive: true, force: true});

        console.log(`\n[ssg-shard] === shard ${i + 1}/${TOTAL} start ===\n`);
        const startedAt = Date.now();
        await runShard(i);
        const minutes = ((Date.now() - startedAt) / 60000).toFixed(1);
        console.log(`\n[ssg-shard] === shard ${i + 1}/${TOTAL} done (${minutes} min) ===\n`);
    }
    console.log('[ssg-shard] all shards finished.');
};

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
