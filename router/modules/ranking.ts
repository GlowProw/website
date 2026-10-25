import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const RankingDesignedItemsPage = () => import('@/views/rankingDesignedItems/Index.vue');
const RankingDesignedItemsBrowsePage = () => import('@/views/rankingDesignedItems/Browse.vue');
const RankingDesignedItemsWorkshopPage = () => import('@/views/rankingDesignedItems/workshop/Index.vue');
const RankingDesignedItemsPublishPage = () => import('@/views/rankingDesignedItems/Publish.vue');

// 幻化与精选设计物品排行路由集合
export const rankingRoutes: RouteRecordRaw[] = [
    {
        path: '/ranking-designed-items',
        name: 'rankingDesignedItems',
        component: RankingDesignedItemsPage,
        meta: {
            title: 'rankingDesignedItems.title',
            keywords: 'rankingDesignedItems.keywords'
        },
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'RankingDesignedItemsBrowse', params: { lang: to.params.lang } }),
        children: [
            {
                path: 'browse',
                name: 'RankingDesignedItemsBrowse',
                component: RankingDesignedItemsBrowsePage,
            },
            {
                path: 'workshop',
                name: 'RankingDesignedItemsWorkshop',
                component: RankingDesignedItemsWorkshopPage,
            },
            {
                path: 'publish/:uid',
                name: 'PublishRankingDesignedItems',
                component: RankingDesignedItemsPublishPage,
            },
            {
                path: 'edit/:uid',
                name: 'EditRankingDesignedItems',
                component: RankingDesignedItemsPublishPage,
            },
        ]
    }
];
