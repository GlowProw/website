
import { ref } from 'vue';
import SearchWorker from "@/workers/search.worker.ts?worker";

// 单例状态
const searchWorker = ref<Worker | null>(null);
const isLoading = ref(true);
const progress = ref(0);
const searchResult = ref<any>({});
let initializationPromise: Promise<void> | null = null;

/**
 * 搜索 Worker 服务 Hook（单例模式）
 */
export const useSearchWorkerService = () => {

    /**
     * 初始化搜索 Worker
     */
    const initWorker = (messages: any, locale: string) => {
        if (searchWorker.value) {
            // Worker 已存在
            return initializationPromise || Promise.resolve();
        }

        // 避免重复初始化的竞态条件
        if (initializationPromise) return initializationPromise;

        initializationPromise = new Promise((resolve, reject) => {
            const worker = new SearchWorker();

            worker.onmessage = (e) => {
                const { type, payload } = e.data;
                if (type === 'progress') {
                    progress.value = payload;
                } else if (type === 'ready') {
                    isLoading.value = false;
                    progress.value = 1;
                    resolve();
                } else if (type === 'results') {
                    searchResult.value = payload;
                } else if (type === 'error') {
                    console.error('Search worker error:', payload);
                    isLoading.value = false; // 回退处理
                    reject(payload);
                }
            };

            worker.postMessage({
                type: 'init',
                payload: {
                    messages: JSON.parse(JSON.stringify(messages)),
                    locale: locale
                }
            });

            searchWorker.value = worker;
        });

        return initializationPromise;
    };

    /**
     * 执行搜索请求
     */
    const performSearch = (query: string, parsedQuery: any) => {
        if (!searchWorker.value || isLoading.value) return;

        const isAdvanced = parsedQuery && parsedQuery.conditions.length > 0;

        const payload = {
            query,
            isAdvanced,
            parsedQuery,
            limit: parsedQuery.limit,
            types: parsedQuery.types
        };

        searchWorker.value.postMessage({
            type: 'search',
            payload: JSON.parse(JSON.stringify(payload))
        });
    };

    /**
     * 终止 Worker 线程
     */
    const terminateWorker = () => {
        if (searchWorker.value) {
            searchWorker.value.terminate();
            searchWorker.value = null;
            isLoading.value = true;
            progress.value = 0;
            initializationPromise = null;
        }
    }

    return {
        searchWorker,
        isLoading,
        progress,
        searchResult,
        initWorker,
        performSearch,
        terminateWorker
    };
};
