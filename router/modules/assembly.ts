import type { RouteRecordRaw } from 'vue-router';
import { initItemAssets, isLoginBeforeEnter } from '../guards';

const AssemblePage = () => import('@/views/assembly/Index.vue');
const AssembleWorkshopPage = () => import('@/views/assembly/workshop/Index.vue');
const AssemblyBrowsePage = () => import('@/views/assembly/Browse.vue');
const AssemblyDetailPage = () => import('@/views/assembly/Detail.vue');
const AssemblySharePage = () => import('@/views/assembly/Share.vue');

// 舰船配装系统路由集合
export const assemblyRoutes: RouteRecordRaw[] = [
    {
        path: '/assembly',
        meta: {
            title: 'assembly.title',
            keywords: 'assembly.meta.keywords'
        },
        name: 'Assembly',
        component: AssemblePage,
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'AssemblyBrowse', params: { lang: to.params.lang } }),
        children: [
            {
                path: 'workshop',
                name: 'AssemblyWorkshop',
                component: AssembleWorkshopPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'workshop/:uid/edit',
                name: 'AssemblyEdit',
                component: AssembleWorkshopPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'publish/:uid',
                name: 'PublishAssembly',
                redirect: to => ({ name: 'AssemblyWorkshop' })
            },
            {
                path: 'edit/:uid',
                name: 'EditAssembly',
                redirect: to => ({ name: 'AssemblyEdit', params: { uid: to.params.uid } })
            },
            {
                path: 'browse',
                name: 'AssemblyBrowse',
                component: AssemblyBrowsePage,
            },
            {
                path: 'browse/:uuid/detail',
                name: 'AssemblyDetail',
                component: AssemblyDetailPage
            },
            {
                path: 'browse/:uuid/share',
                name: 'AssemblyShare',
                component: AssemblySharePage
            }
        ]
    }
];
