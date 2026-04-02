import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSimilarityStore = defineStore('similarity', () => {
    // 缓存已经计算过的特征： Map<imageUrl, features>
    const featuresCache = ref<Map<string, any>>(new Map());

    // 状态跟踪
    const isProcessing = ref(false);
    const progress = ref(0);
    const total = ref(0);
    const lastError = ref<string | null>(null);

    // AbortController 用于取终操作
    let abortController: AbortController | null = null;
    let workers: Worker[] = [];

    const setFeatures = (url: string, features: any) => {
        featuresCache.value.set(url, features);
    };

    const hasFeatures = (url: string) => {
        return featuresCache.value.has(url);
    };

    // 核心处理逻辑：并发批量处理图片
    const startProcessing = async (urls: string[], concurrency = navigator.hardwareConcurrency || 4) => {
        if (isProcessing.value) return;

        isProcessing.value = true;
        total.value = urls.length;
        progress.value = 0;
        lastError.value = null;
        abortController = new AbortController();

        // 过滤掉已经缓存过的
        const queue = urls.filter(url => !hasFeatures(url));
        progress.value = urls.length - queue.length;

        if (queue.length === 0) {
            isProcessing.value = false;
            return;
        }

        return new Promise<void>((resolve, reject) => {
            let currentIndex = 0;
            let finishedCount = 0;

            // 创建固定数量的 Worker 线程池
            const poolSize = Math.min(concurrency, queue.length);
            for (let i = 0; i < poolSize; i++) {
                const worker = new Worker(new URL('../src/workers/similarity.worker.ts', import.meta.url), {
                    type: 'module'
                });
                workers.push(worker);

                const handleWorkerMessage = (e: MessageEvent) => {
                    if (e.data.success) {
                        setFeatures(e.data.imageUrl, e.data.features);
                        progress.value++;
                    } else {
                        console.error('Worker processing error:', e.data.error);
                    }
                    
                    finishedCount++;
                    
                    // 分派下一个任务或关闭
                    if (currentIndex < queue.length && !abortController?.signal.aborted) {
                        worker.postMessage({ imageUrl: queue[currentIndex++] });
                    } else {
                        // 该 Worker 完成了所有分派给它的工作
                        worker.terminate();
                        workers = workers.filter(w => w !== worker);
                        
                        if (workers.length === 0 || (finishedCount >= queue.length && currentIndex >= queue.length)) {
                            isProcessing.value = false;
                            resolve();
                        }
                    }
                };

                worker.onmessage = handleWorkerMessage;
                worker.onerror = (err) => {
                    console.error('Worker system error:', err);
                    worker.terminate();
                    workers = workers.filter(w => w !== worker);
                    if (workers.length === 0) {
                        isProcessing.value = false;
                        resolve();
                    }
                };

                // 发送第一个任务
                if (currentIndex < queue.length) {
                    worker.postMessage({ imageUrl: queue[currentIndex++] });
                }
            }

            abortController?.signal.addEventListener('abort', () => {
                workers.forEach(w => w.terminate());
                workers = [];
                isProcessing.value = false;
                reject(new Error('Operation aborted'));
            });
        });
    };

    const abortProcessing = () => {
        abortController?.abort();
        isProcessing.value = false;
    };

    return {
        featuresCache,
        isProcessing,
        progress,
        total,
        lastError,
        startProcessing,
        abortProcessing,
        hasFeatures,
        setFeatures
    };
});
