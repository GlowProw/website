
import { ref } from 'vue';
import SearchWorker from "@/workers/search.worker.ts?worker";

// Singleton state
const searchWorker = ref<Worker | null>(null);
const isLoading = ref(true);
const progress = ref(0);
const searchResult = ref<any>({});
let initializationPromise: Promise<void> | null = null;

export const useSearchWorkerService = () => {
    
    const initWorker = (messages: any, locale: string) => {
        if (searchWorker.value) {
            // Worker already exists
            return initializationPromise || Promise.resolve();
        }

        // Avoid double initialization race condition
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
                    isLoading.value = false; // Fallback
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

    const performSearch = (query: string, parsedQuery: any) => {
        if (!searchWorker.value || isLoading.value) return;

        const isAdvanced = parsedQuery && parsedQuery.conditions.length > 0;

        searchWorker.value.postMessage({
            type: 'search',
            payload: {
                query,
                isAdvanced,
                parsedQuery: JSON.parse(JSON.stringify(parsedQuery))
            }
        });
    };

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
