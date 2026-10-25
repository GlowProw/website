import type { RouteRecordRaw } from 'vue-router';
import { isLoginBeforeEnter, initAccountInfo, initCDNAssets, initItemAssets } from '../guards';

const PortalMainBasePage = () => import('@/views/portal/Index.vue');
const PortalPage = () => import('@/views/portal/Home.vue');
const AccountPage = () => import('@/views/user/account/Index.vue');
const AccountInformationPage = () => import('@/views/user/account/Information.vue');
const AccountProfilePicturePage = () => import('@/views/user/account/ProfilePicture.vue');
const AccountAssemblysPage = () => import('@/views/user/account/Assemblys.vue');
const AccountCommentsPage = () => import('@/views/user/account/Comments.vue');
const Teamup = () => import('@/views/user/account/Teamup.vue');
const AccountMapsPage = () => import('@/views/user/account/Maps.vue');
const AccountMediaPage = () => import('@/views/user/account/Media.vue');
const AccountSmugglersReport = () => import('@/views/user/account/SmugglersReport.vue');
const AccountBotGuide = () => import('@/views/user/account/bot/Guide.vue');
const AccountBotOverview = () => import('@/views/user/account/bot/Overview.vue');
const AccountBotManage = () => import('@/views/user/account/bot/Manage.vue');
const AccountDataCenterPage = () => import('@/views/user/account/DataCenter.vue');
const AccountCollectionStatsPage = () => import('@/views/user/account/CollectionStats.vue');
const AccountMessagesCenterPage = () => import('@/views/user/account/MessagesCenter.vue');
const AccountMessagesSettingsPage = () => import('@/views/user/account/MessagesSettings.vue');
const SpacePage = () => import('@/views/user/space/Index.vue');
const SpaceAssemblysPage = () => import('@/views/user/space/Assemblys.vue');
const SpaceTeamupsPage = () => import('@/views/user/space/Teamups.vue');
const SigninPage = () => import('@/views/user/Signin.vue');
const SignupPage = () => import('@/views/user/Signup.vue');
const ActivatePage = () => import('@/views/user/Activate.vue');
const ForgotPasswordPage = () => import('@/views/user/ForgotPassword.vue');
const ResetPasswordPage = () => import('@/views/user/ResetPassword.vue');
const TeamPage = () => import('@/views/Team.vue');
const SearchPage = () => import('@/views/Search.vue');
const SettingPage = () => import('@/views/setting/Index.vue');
const SettingViewPage = () => import('@/views/setting/View.vue');
const SettingRoutinePage = () => import('@/views/setting/Routine.vue');
const SettingAdPage = () => import('@/views/setting/Ad.vue');
const SettingStoragePage = () => import('@/views/setting/Storage.vue');
const AboutPage = () => import('@/views/setting/About.vue');
const SettingServiceStatusPage = () => import('@/views/setting/ServiceStatus.vue');
const SettingWishlistPage = () => import('@/views/setting/Wishlist.vue');
const SettingLogPage = () => import('@/views/setting/Log.vue');
const SettingSubscriptionsPage = () => import('@/views/setting/Subscriptions.vue');
const AdvancedPage = () => import('@/views/setting/Advanced.vue');

// 基础门户与用户账户、个人空间、系统设置路由集合
export const portalRoutes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'BasePortal',
        component: PortalMainBasePage,
        meta: {
            title: 'home.title',
            keywords: 'home.meta.keywords'
        },
        children: [
            {
                path: '',
                name: 'PortalHome',
                component: PortalPage
            },
            {
                path: 'account',
                name: 'AccountHome',
                component: AccountPage,
                redirect: to => ({ name: 'AccountInformation', params: { lang: to.params.lang } }),
                meta: {
                    title: 'account.title',
                    keywords: 'account.meta.keywords'
                },
                beforeEnter: (to, from, next) => {
                    isLoginBeforeEnter(to, from, next);
                    initAccountInfo(to, from, next);
                },
                children: [
                    {
                        path: 'information',
                        name: 'AccountInformation',
                        component: AccountInformationPage
                    },
                    {
                        path: 'profile-picture',
                        name: 'AccountProfilePicture',
                        component: AccountProfilePicturePage
                    },
                    {
                        path: 'security',
                        name: 'AccountSecurity',
                        component: () => import('@/views/user/account/Security.vue'),
                        redirect: to => ({ name: 'AccountBindings', params: { lang: to.params.lang }, query: to.query }),
                        meta: { title: 'account.securityCenter.title' },
                        children: [
                            {
                                path: 'bindings',
                                name: 'AccountBindings',
                                component: () => import('@/views/user/account/Bindings.vue'),
                                meta: { title: 'account.bindings.title', auth: true }
                            },
                            {
                                path: 'sessions',
                                name: 'AccountSessions',
                                component: () => import('@/views/user/account/Sessions.vue'),
                                meta: { title: 'account.sessions.title', auth: true }
                            },
                            {
                                path: 'twofa',
                                name: 'AccountTwoFactor',
                                component: () => import('@/views/user/account/TwoFactor.vue'),
                                meta: { title: 'account.twoFactor.title', auth: true }
                            },
                        ]
                    },
                    {
                        path: 'achievements',
                        name: 'AccountAchievements',
                        component: () => import('@/views/user/account/AccountAchievements.vue'),
                        meta: { title: 'account.achievements.title', auth: true }
                    },
                    {
                        path: 'checkin',
                        name: 'AccountCheckin',
                        component: () => import('@/views/user/account/Signin.vue'),
                        meta: { title: 'account.signin.title', auth: true }
                    },
                    {
                        path: 'orders',
                        name: 'AccountOrders',
                        component: () => import('@/views/user/account/Orders.vue'),
                        meta: { title: 'account.orders.title', auth: true }
                    },
                    {
                        path: 'collection-stats',
                        name: 'AccountCollectionStats',
                        component: AccountCollectionStatsPage,
                        meta: { title: 'account.collectionStats.title', auth: true }
                    },
                    {
                        path: 'data-center',
                        name: 'AccountDataCenter',
                        component: AccountDataCenterPage
                    },
                    {
                        path: 'messages',
                        name: 'AccountMessages',
                        component: AccountMessagesCenterPage
                    },
                    {
                        path: 'messages-settings',
                        name: 'AccountMessagesSettings',
                        component: AccountMessagesSettingsPage,
                        meta: { title: 'account.messages.settings.title', auth: true }
                    },
                    {
                        path: 'assemblys',
                        name: 'AccountAssemblys',
                        component: AccountAssemblysPage
                    },
                    {
                        path: 'comments',
                        name: 'AccountComments',
                        component: AccountCommentsPage
                    },
                    {
                        path: 'teamups',
                        name: 'AccountTeamUps',
                        component: Teamup
                    },
                    {
                        path: 'maps',
                        name: 'AccountMaps',
                        component: AccountMapsPage
                    },
                    {
                        path: 'media',
                        name: 'AccountMedia',
                        component: AccountMediaPage,
                        meta: { title: 'account.media.title', auth: true }
                    },
                    {
                        path: 'smugglersReport',
                        name: 'AccountSmugglersReport',
                        component: AccountSmugglersReport
                    },
                    {
                        path: 'bot',
                        name: 'AccountBotHome',
                        redirect: to => ({name: 'AccountBotGuide', params: {lang: to.params.lang}, query: to.query}),
                        children: [
                            {
                                path: 'guide',
                                name: 'AccountBotGuide',
                                component: AccountBotGuide,
                                meta: {title: 'account.bot.guide.title', auth: true}
                            },
                            {
                                path: 'overview',
                                name: 'AccountBotOverview',
                                component: AccountBotOverview,
                                meta: {title: 'account.bot.overview.title', auth: true}
                            },
                            {
                                path: 'manage',
                                name: 'AccountBotManage',
                                component: AccountBotManage,
                                meta: {title: 'account.bot.manage.title', auth: true}
                            },
                        ]
                    },
                    {
                        path: 'trash',
                        name: 'AccountTrash',
                        component: () => import('@/views/user/account/Trash.vue'),
                        meta: { title: 'account.trash', auth: true }
                    },
                ]
            },
            {
                path: 'space',
                name: 'SpaceHome',
                component: SpacePage,
                redirect: to => ({ name: 'SpaceAssemblys', params: { lang: to.params.lang }, query: to.query }),
                children: [
                    {
                        path: 'assemblys',
                        name: 'SpaceAssemblys',
                        component: SpaceAssemblysPage,
                        meta: { title: 'space.title' }
                    },
                    {
                        path: 'teamups',
                        name: 'SpaceTeamups',
                        component: SpaceTeamupsPage,
                        meta: { title: 'space.title' }
                    },
                ]
            },
            {
                path: 'space/:id',
                name: 'AccountSpace',
                component: SpacePage,
                redirect: to => ({ name: 'SpaceUserAssemblys', params: to.params, query: to.query }),
                children: [
                    {
                        path: 'assemblys',
                        name: 'SpaceUserAssemblys',
                        component: SpaceAssemblysPage,
                        meta: { title: 'space.title' }
                    },
                    {
                        path: 'teamups',
                        name: 'SpaceUserTeamups',
                        component: SpaceTeamupsPage,
                        meta: { title: 'space.title' }
                    },
                ]
            },
            {
                path: 'oauth/callback',
                name: 'OAuthCallbackPage',
                meta: {
                    title: 'oauth.callbackTitle',
                },
                component: () => import('@/views/user/McpOAuthDispatch.vue'),
            },
            {
                path: 'account/signin',
                name: 'signin',
                meta: {
                    title: 'signin.title',
                    keywords: 'signin.meta.keywords'
                },
                component: SigninPage
            },
            {
                path: 'account/signup',
                name: 'signup',
                meta: {
                    title: 'signup.title',
                    keywords: 'signup.meta.keywords'
                },
                component: SignupPage
            },
            {
                path: 'account/activate',
                name: 'activate',
                meta: {
                    title: 'activate.title',
                    keywords: 'activate.meta.keywords'
                },
                component: ActivatePage
            },
            {
                path: 'account/forgot-password',
                name: 'forgotPassword',
                meta: {
                    title: 'forgotPassword.title'
                },
                component: ForgotPasswordPage
            },
            {
                path: 'account/reset-password',
                name: 'resetPassword',
                meta: {
                    title: 'resetPassword.title'
                },
                component: ResetPasswordPage
            },
            {
                path: 'team',
                name: 'Team',
                meta: {
                    title: 'teamUp.title',
                    keywords: 'teamUp.meta.keywords'
                },
                component: TeamPage,
                beforeEnter: initItemAssets,
            },
            {
                path: 'search',
                name: 'Search',
                meta: {
                    title: 'search.title',
                    keywords: 'search.meta.keywords'
                },
                component: SearchPage,
            },
            {
                path: 'setting',
                name: 'PortalSetting',
                component: SettingPage,
                beforeEnter: initCDNAssets,
                redirect: to => ({ name: 'PortalSettingView', params: { lang: to.params.lang } }),
                children: [
                    {
                        path: '',
                        name: 'PortalSettingView',
                        component: SettingViewPage,
                        redirect: to => ({ name: 'PortalSettingRoutine', params: { lang: to.params.lang } }),
                        children: [
                            {
                                path: 'routine',
                                name: 'PortalSettingRoutine',
                                component: SettingRoutinePage,
                            },
                            {
                                path: 'ads',
                                name: 'PortalSettingAds',
                                component: SettingAdPage,
                            },
                            {
                                path: 'storage',
                                name: 'PortalSettingStorage',
                                component: SettingStoragePage,
                            },
                            {
                                path: 'about',
                                name: 'PortalSettingAbout',
                                component: AboutPage,
                            },
                            {
                                path: 'service-status',
                                name: 'PortalSettingServiceStatus',
                                component: SettingServiceStatusPage,
                                meta: {
                                    title: 'setting.serviceStatus.title'
                                },
                            },
                            {
                                path: 'pwa',
                                name: 'PortalSettingPwa',
                                redirect: to => ({ name: 'PortalSettingAdvanced', params: { lang: to.params.lang } }),
                            },
                            {
                                path: 'wishlist',
                                name: 'PortalSettingWishlist',
                                component: SettingWishlistPage,
                            },
                            {
                                path: 'log',
                                name: 'PortalSettingLog',
                                component: SettingLogPage,
                            },
                            {
                                path: 'subscriptions',
                                name: 'PortalSettingSubscriptions',
                                component: SettingSubscriptionsPage,
                            },
                            {
                                path: 'advanced',
                                name: 'PortalSettingAdvanced',
                                meta: {
                                    title: 'setting.advanced.title'
                                },
                                component: AdvancedPage,
                            },
                            {
                                path: 'hotkeys',
                                name: 'PortalSettingHotkeys',
                                meta: {
                                    title: 'setting.hotkeys.title'
                                },
                                component: () => import('@/views/setting/Hotkeys.vue'),
                            }
                        ]
                    },
                ]
            },
        ]
    }
];
