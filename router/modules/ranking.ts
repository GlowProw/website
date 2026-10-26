import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets } from '../guards';

const RankingDesignedItemsPage = () => import('@/views/rankingDesignedItems/Index.vue');
const RankingDesignedItemsBrowsePage = () => import('@/views/rankingDesignedItems/Browse.vue');
const RankingDesignedItemsDetailPage = () => import('@/views/rankingDesignedItems/Detail.vue');
const RankingDesignedItemsWorkshopPage = () => import('@/views/rankingDesignedItems/workshop/Index.vue');

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
                path: 'browse/:uuid/detail',
                name: 'RankingDesignedItemsDetail',
                component: RankingDesignedItemsDetailPage,
            },
            {
                path: 'workshop',
                name: 'RankingDesignedItemsWorkshop',
                component: RankingDesignedItemsWorkshopPage,
            },
            {
                path: 'workshop/:uid/edit',
                name: 'RankingDesignedItemsWorkshopEdit',
                component: RankingDesignedItemsWorkshopPage,
            },
            {
                path: 'publish/:uid',
                name: 'PublishRankingDesignedItems',
                redirect: to => ({ name: 'RankingDesignedItemsWorkshop' }),
            },
            {
                path: 'edit/:uid',
                name: 'EditRankingDesignedItems',
                redirect: to => ({ name: 'RankingDesignedItemsWorkshopEdit', params: { uid: to.params.uid } }),
            },
        ]
    },
    {
        path: '/publish/:uid',
        name: 'TopLevelPublishRankingDesignedItems',
        redirect: to => ({
            name: 'RankingDesignedItemsWorkshop',
            params: { lang: to.params.lang }
        })
    }
];


