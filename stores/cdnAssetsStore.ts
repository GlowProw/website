import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { storage } from "@/assets/sripts/index";

interface CDNAssetsService {
    name: string;
    urlTemplate: string;
    enabled: boolean;
    priority: number;
}

interface CDNAssetsParams {
    id: string;
    category: string;
    [key: string]: string;
}

// 多服务参数类型
interface MultiServiceParams {
    [serviceName: string]: CDNAssetsParams;
}

// URL 方法参数类型
type UrlParams = CDNAssetsParams | MultiServiceParams;

interface CurrentService extends CDNAssetsService {
    url: (params: UrlParams, forceName?: string) => string;
}

// 存储键名常量
const STORAGE_KEYS = {
    SELECTED_SERVICE: 'cdn.assets.value'
} as const;

export const useCDNAssetsServiceStore = defineStore('cdnService', () => {
    const services = ref<CDNAssetsService[]>([
        {
            name: 'local-test',
            urlTemplate: 'http://localhost:8088/api?src={category}&id={id}',
            enabled: true,
            priority: 1
        },
        {
            name: 'skull-and-bones-tools',
            urlTemplate: 'https://skullandbonestools.de/api/imagesservice?src=icons%2F{category}%2F{id}&width=128',
            enabled: true,
            priority: 2
        },
        {
            name: 'glow-prow',
            urlTemplate: 'https://assets.glow-prow.org.cn/api?src={category}&id={id}',
            enabled: true,
            priority: 3
        }
    ]);

    const selectedService = ref('glow-prow');

    const enabledServices = computed(() =>
        services.value.filter(s => s.enabled).sort((a, b) => a.priority - b.priority)
    );

    const targetService = computed(() =>
        services.value.find(s => s.name === selectedService.value) || services.value[0]
    );

    // 构建URL
    const buildServiceUrl = (service: CDNAssetsService, params: CDNAssetsParams): string => {
        let url = service.urlTemplate;
        Object.keys(params).forEach(key => {
            url = url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(params[key]));
        });
        return url;
    };

    const currentService = computed<CurrentService>(() => ({
        ...targetService.value,
        url: (params: UrlParams, forceName?: string): string => {
            // 检查是否是多服务参数
            const isMultiService = Object.keys(params).every(key =>
                services.value.some(s => (forceName || s.name) === key)
            );

            if (isMultiService) {
                const multiParams = params as MultiServiceParams;

                // 按优先级排序的服务列表
                const sortedServices = [...services.value]
                    .filter(s => s.enabled)
                    .sort((a, b) => a.priority - b.priority);

                // 遍历所有服务，找到第一个有对应参数且启用的服务
                for (const service of sortedServices) {
                    if (multiParams[service.name]) {
                        const serviceParams = multiParams[service.name];
                        return buildServiceUrl(service, serviceParams);
                    }
                }

                // 如果没有找到匹配的服务，使用当前服务的参数（如果有）
                if (multiParams[targetService.value.name]) {
                    return buildServiceUrl(targetService.value, multiParams[targetService.value.name]);
                }

                // 最后fallback：使用第一个可用的参数
                const firstServiceName = Object.keys(multiParams)[0];
                const firstService = services.value.find(s => s.name === firstServiceName);
                if (firstService && multiParams[firstServiceName]) {
                    return buildServiceUrl(firstService, multiParams[firstServiceName]);
                }

                console.warn('No valid service found for multi params');
                return '';
            } else {
                // 单服务模式：使用当前服务
                return buildServiceUrl(targetService.value, params as CDNAssetsParams);
            }
        }
    }));

    /**
     * 切换服务启用状态
     */
    const toggleService = (serviceName: string) => {
        const service = services.value.find(s => s.name === serviceName);
        if (service) {
            service.enabled = !service.enabled;
            saveToStorage();
        }
    };

    /**
     * 设置选中的服务
     */
    const setSelectedService = (serviceName: string) => {
        selectedService.value = serviceName;
        saveToStorage();
    };

    /**
     * 更新服务优先级
     */
    const updateServicePriority = (serviceName: string, priority: number) => {
        const service = services.value.find(s => s.name === serviceName);
        if (service) {
            service.priority = priority;
            saveToStorage();
        }
    };

    /**
     * 获取指定服务的URL
     */
    const getServiceUrl = (serviceName: string, params: CDNAssetsParams): string => {
        const service = services.value.find(s => s.name === serviceName);
        if (!service) return '';

        return buildServiceUrl(service, params);
    };

    /**
     * 获取当前选中服务的URL
     */
    const getCurrentServiceUrl = (params: CDNAssetsParams): string => {
        return getServiceUrl(selectedService.value, params);
    };

    /**
     * 从多服务参数中获取最佳URL
     */
    const getBestUrlFromMultiParams = (params: MultiServiceParams): string => {
        // 按优先级排序的服务列表
        const sortedServices = [...services.value]
            .filter(s => s.enabled)
            .sort((a, b) => a.priority - b.priority);

        // 遍历所有服务，找到第一个有对应参数的服务
        for (const service of sortedServices) {
            if (params[service.name]) {
                return buildServiceUrl(service, params[service.name]);
            }
        }

        console.warn('No valid service found for multi params');
        return '';
    };

    /**
     * 添加新服务
     */
    const addService = (service: CDNAssetsService) => {
        services.value.push(service);
        saveToStorage();
    };

    /**
     * 移除服务
     */
    const removeService = (serviceName: string) => {
        const index = services.value.findIndex(s => s.name === serviceName);
        if (index !== -1) {
            services.value.splice(index, 1);

            // 如果移除的是当前选中的服务，切换到第一个可用服务
            if (selectedService.value === serviceName && services.value.length > 0) {
                selectedService.value = services.value[0].name;
            }

            saveToStorage();
        }
    };

    /**
     * 更新服务配置
     */
    const updateService = (serviceName: string, updates: Partial<CDNAssetsService>) => {
        const service = services.value.find(s => s.name === serviceName);
        if (service) {
            Object.assign(service, updates);
            saveToStorage();
        }
    };

    /**
     * 获取所有服务
     */
    const getAllServices = () => {
        return services.value;
    };

    /**
     * 获取当前所有配置
     */
    const getCurrentConfig = () => {
        return {
            selectedService: selectedService.value,
            services: services.value,
            enabledServices: enabledServices.value
        };
    };

    // ========== 存储相关 ==========

    /**
     * 保存到 localStorage
     */
    const saveToStorage = () => {
        storage.local.set(STORAGE_KEYS.SELECTED_SERVICE, {
            name: selectedService.value,
        });
    };

    /**
     * 从 localStorage 加载
     */
    const loadFromStorage = () => {
        try {
            const saved = storage.local.get(STORAGE_KEYS.SELECTED_SERVICE);

            if (saved?.code === 0) {
                const name = saved?.data?.value?.name;
                if (name && services.value.some(s => s.name === name)) {
                    selectedService.value = name;
                }
            }
        } catch (e) {
            console.error('Failed to load image services config', e);
        }
    };

    /**
     * 初始化 CDN 服务配置
     */
    const initializeCDNConfig = () => {
        loadFromStorage();
        console.log('CDN config initialized:', {
            selectedService: selectedService.value,
            services: services.value
        });
    };

    /**
     * 重置为默认配置
     */
    const resetToDefaults = () => {
        services.value = [
            {
                name: 'local',
                urlTemplate: 'http://localhost:8088/api?src={category}&id={id}',
                enabled: true,
                priority: 1
            },
            {
                name: 'skull-and-bones-tools',
                urlTemplate: 'https://skullandbonestools.de/api/imagesservice?src=icons%2F{category}%2F{id}&width=128',
                enabled: true,
                priority: 2
            },
            {
                name: 'glow-prow',
                urlTemplate: 'https://assets.glow-prow.org.cn/api?src={category}&id={id}',
                enabled: true,
                priority: 3
            }
        ];

        selectedService.value = 'glow-prow';

        saveToStorage();
        console.log('CDN config reset to defaults');
    };

    // 初始化
    initializeCDNConfig();

    return {
        services,
        selectedService,

        enabledServices,
        currentService,

        toggleService,
        setSelectedService,
        updateServicePriority,
        getServiceUrl,
        getCurrentServiceUrl,
        getBestUrlFromMultiParams,
        addService,
        removeService,
        updateService,
        getAllServices,
        getCurrentConfig,
        initializeCDNConfig,
        resetToDefaults,
        loadFromStorage,
        saveToStorage
    };
});
