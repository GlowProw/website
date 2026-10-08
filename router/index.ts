import { createRouter, createWebHistory, createMemoryHistory, RouteRecordRaw, RouterView } from 'vue-router';
import { getCurrentSeasonId } from "@/assets/sripts";

const PortalMainBasePage = () => import('@/views/portal/Index.vue');
const PortalPage = () => import('@/views/portal/Home.vue');
const AccountPage = () => import('@/views/user/account/Index.vue');
const AccountInformationPage = () => import('@/views/user/account/Information.vue');
const AccountProfilePicturePage = () => import('@/views/user/account/ProfilePicture.vue');
const AccountAssemblysPage = () => import('@/views/user/account/Assemblys.vue');
const AccountCommentsPage = () => import('@/views/user/account/Comments.vue');
const Teamup = () => import('@/views/user/account/Teamup.vue');
const AccountMapsPage = () => import('@/views/user/account/Maps.vue');
const AccountSmugglersReport = () => import('@/views/user/account/SmugglersReport.vue');
const AccountDataCenterPage = () => import('@/views/user/account/DataCenter.vue');
const AccountMessagesCenterPage = () => import('@/views/user/account/MessagesCenter.vue');
const AccountMessagesSettingsPage = () => import('@/views/user/account/AccountMessagesSettings.vue');
const AccountSpacePage = () => import('@/views/user/Space.vue');
const SigninPage = () => import('@/views/user/Signin.vue');
const SignupPage = () => import('@/views/user/Signup.vue');
const ActivatePage = () => import('@/views/user/Activate.vue');
const ForgotPasswordPage = () => import('@/views/user/ForgotPassword.vue');
const ResetPasswordPage = () => import('@/views/user/ResetPassword.vue');
const CodexPage = () => import('@/views/codex/Index.vue');
const CodexCodexOverviewPage = () => import('@/views/codex/CodexOverview.vue');
const RankingDesignedItemsPage = () => import('@/views/rankingDesignedItems/Index.vue');
const RankingDesignedItemsBrowsePage = () => import('@/views/rankingDesignedItems/Browse.vue');
const RankingDesignedItemsWorkshopPage = () => import('@/views/rankingDesignedItems/workshop/Index.vue');
const RankingDesignedItemsPublishPage = () => import('@/views/rankingDesignedItems/Publish.vue');
const ShipsPage = () => import('@/views/codex/ships/Index.vue');
const ShipDetailPage = () => import('@/views/codex/ships/Detail.vue');
const ItemsPage = () => import('@/views/codex/items/Index.vue');
const ItemDetailPage = () => import('@/views/codex/items/Detail.vue');
const CommoditiesPage = () => import('@/views/codex/commodities/Index.vue');
const CommoditieDetailPage = () => import('@/views/codex/commodities/Detail.vue');
const ModsPage = () => import('@/views/codex/modifications/Index.vue');
const ModDetailPage = () => import('@/views/codex/modifications/Detail.vue');
const MaterialsPage = () => import('@/views/codex/materials/Index.vue');
const MaterialDetailPage = () => import('@/views/codex/materials/Detail.vue');
const CosmeticsPage = () => import('@/views/codex/cosmetics/Index.vue');
const CosmeticDetailPage = () => import('@/views/codex/cosmetics/Detail.vue');
const SetsPage = () => import('@/views/codex/sets/Index.vue');
const SetDetailPage = () => import('@/views/codex/sets/Detail.vue');
const TreasureMapsPage = () => import('@/views/codex/treasureMaps/Index.vue');
const TreasureMapDetailPage = () => import('@/views/codex/treasureMaps/Detail.vue');
const TreasureMapComparisonPage = () => import('@/views/codex/treasureMaps/Comparison.vue');
const MapLocationPage = () => import('@/views/codex/mapLocations/Index.vue');
const MapLocationsDetailPage = () => import('@/views/codex/mapLocations/Detail.vue');
const NpcsPage = () => import('@/views/codex/npcs/Index.vue');
const NpcDetailPage = () => import('@/views/codex/npcs/Detail.vue');
const EmpireSkillsPage = () => import('@/views/codex/empireSkills/Index.vue');
const EmpireSkillDetailPage = () => import('@/views/codex/empireSkills/Detail.vue');
const CodexMasterysPage = () => import('@/views/codex/masterys/Index.vue');
const CodexMasteryDetailPage = () => import('@/views/codex/masterys/Detail.vue');
const QuestPage = () => import('@/views/quest/Index.vue');
const QuestListPage = () => import('@/views/quest/List.vue');
const QuestDetailPage = () => import('@/views/quest/Detail.vue');
const EmpireSkillSimulationPage = () => import('@/views/empireSkillSimulation/Index.vue');
const MasteryPage = () => import('@/views/mastery/Index.vue');
const MasteryViewPage = () => import('@/views/mastery/View.vue');
const MasterySharePage = () => import('@/views/mastery/Share.vue');
const UltimatesPage = () => import('@/views/codex/ultimates/Index.vue');
const UltimateDetailPage = () => import('@/views/codex/ultimates/Detail.vue');
const CalendarPage = () => import('@/views/calendar/Index.vue');
const CalendarHistoryPage = () => import('@/views/calendar/History.vue');
const AssemblePage = () => import('@/views/assembly/Index.vue');
const AssembleWorkshopPage = () => import('@/views/assembly/workshop/Index.vue');
const AssemblePublishPage = () => import('@/views/assembly/Publish.vue');
const AssemblyBrowsePage = () => import('@/views/assembly/Browse.vue');
const AssemblyDetailPage = () => import('@/views/assembly/Detail.vue');
const AssemblySharePage = () => import('@/views/assembly/Share.vue');
const MapsPage = () => import('@/views/map/Index.vue');
const MapViewPage = () => import('@/views/map/View.vue');
const AppsPage = () => import('@/views/apps/Index.vue');
const AppsViewPage = () => import('@/views/apps/View.vue');
const QQBotPage = () => import('@/views/apps/QQBot.vue');
const ApiDocsPage = () => import('@/views/apps/ApiDocs.vue');
const TeamPage = () => import('@/views/Team.vue');
const SearchPage = () => import('@/views/Search.vue');
const SmugglersReportPage = () => import('@/views/smugglers/Index.vue');
const SmugglersReportDetailPage = () => import('@/views/smugglers/View.vue');
const StateOfWarPage = () => import('@/views/stateOfWar/Index.vue');
const StateOfWarViewPage = () => import('@/views/stateOfWar/View.vue');
const SettingPage = () => import('@/views/setting/Index.vue');
const SettingViewPage = () => import('@/views/setting/View.vue');
const SettingAdPage = () => import('@/views/setting/Ad.vue');
const SettingRoutinePage = () => import('@/views/setting/Routine.vue');
const SettingStoragePage = () => import('@/views/setting/Storage.vue');
const AboutPage = () => import('@/views/setting/About.vue');
const SettingPwaPage = () => import('@/views/setting/Pwa.vue');
const SettingWishlistPage = () => import('@/views/setting/Wishlist.vue');
const SettingLogPage = () => import('@/views/setting/Log.vue');
const SettingSubscriptionsPage = () => import('@/views/setting/Subscriptions.vue');
const AdvancedPage = () => import('@/views/setting/Advanced.vue');
const ReminderIndexPage = () => import('@/views/reminder/Index.vue');
const ReminderViewPage = () => import('@/views/reminder/View.vue');
const NotFoundPage = () => import('@/views/NotFound.vue');
const Test = () => import('@/views/Test.vue');
const CalculatorPage = () => import('@/views/calculator/Index.vue');
const DropPage = () => import('@/views/drop/Index.vue');
const WidgetIndexPage = () => import('@/widgets/Index.vue');
const WidgetAssemblyPage = () => import('@/widgets/assembly/Index.vue');
const WidgetMasteryPage = () => import('@/widgets/mastery/Index.vue');
const WidgetShipPage = () => import('@/widgets/ship/Index.vue');
const WidgetItemPage = () => import('@/widgets/item/Index.vue');
const WidgetMaterialPage = () => import('@/widgets/material/Index.vue');
const WidgetNpcPage = () => import('@/widgets/npc/Index.vue');
const WidgetModPage = () => import('@/widgets/modifications/Index.vue');
const WidgetCosmeticPage = () => import('@/widgets/cosmetic/Index.vue');
const WidgetCommoditiePage = () => import('@/widgets/commoditie/Index.vue');
const WidgetTreasureMapPage = () => import('@/widgets/treasureMap/Index.vue');
const WidgetUltimatePage = () => import('@/widgets/ultimate/Index.vue');
const WidgetSetPage = () => import('@/widgets/set/Index.vue');
const WidgetMapLocationPage = () => import('@/widgets/mapLocation/Index.vue');
const WidgetEmpireSkillPage = () => import('@/widgets/empireSkills/Index.vue');
const WidgetStateOfWarPage = () => import('@/widgets/stateOfWar/Index.vue');
const WidgetDailyReportPage = () => import('@/widgets/dailyReport/Index.vue');
const WidgetModSlotPage = () => import('@/widgets/modSlot/Index.vue');
const WidgetCombatEffectPage = () => import('@/widgets/combatEffect/Index.vue');
const WidgetInfamyPage = () => import('@/widgets/infamy/Index.vue');
import { useAuthStore } from "@/../stores/userAccountStore";
import { useAssetsStore } from "@/../stores/assetsStore";
import { useHead } from "@unhead/vue";
import { apis, storage } from "@/assets/sripts";
import { useCDNAssetsServiceStore } from "~/stores/cdnAssetsStore";
import { normalizeLang, SUPPORTED_LANGS, DEFAULT_LANG, isSupportedLang } from "@/config/languages";

const isLoginBeforeEnter = function (to: any, from: any, next: any) {
    const authStore = useAuthStore()

    if (authStore.user) {
        next()
    } else {
        next({ path: '/account/signin', query: { backUrl: to.fullPath } })
    }
}

const initAccountInfo = async function (to: any, from: any, next: any) {
    const authStore = useAuthStore()

    try {
        const result = await apis.userApi().getMe()

        authStore.updateAccountAttr(result.data)
    } catch (e) {
        console.error(e)
    }
}

const initItemAssets = () => {
    const { init } = useAssetsStore()
    init()
    initCDNAssets()
}

const initCDNAssets = () => {
    const { loadFromStorage } = useCDNAssetsServiceStore()
    loadFromStorage()
}

/**
 * 获取当前进行中或最新发布的赛季 ID
 */
const getLatestSeasonId = (): string => {
    return getCurrentSeasonId('crimsonWaters');
};

const staticFilePaths = ['/robots.txt', '/sitemap.xml', '/ads.txt'];

const baseAppRoutes: Readonly<RouteRecordRaw[]> = [
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
                redirect: to => ({ name: 'AccountInformation', params: to.params }),
                meta: {
                    title: 'account.title',
                    keywords: 'account.meta.keywords'
                },
                beforeEnter: (to, from, next) => {
                    isLoginBeforeEnter(to, from, next)
                    initAccountInfo(to, from, next)
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
                        path: 'bindings',
                        name: 'AccountBindings',
                        component: () => import('@/views/user/account/Bindings.vue'),
                        meta: { title: 'account.bindings.title', auth: true }
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
                        path: 'smugglersReport',
                        name: 'AccountSmugglersReport',
                        component: AccountSmugglersReport
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
                path: 'space/:id',
                name: 'AccountSpace',
                component: AccountSpacePage,
            },
            {
                path: 'oauth/callback',
                name: 'OAuthCallback',
                meta: {
                    title: 'oauth.callbackTitle',
                },
                component: () => import('@/views/user/OAuthCallback.vue'),
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
                redirect: to => ({ name: 'PortalSettingView', params: to.params }),
                children: [
                    {
                        path: '',
                        name: 'PortalSettingView',
                        component: SettingViewPage,
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
                                path: 'pwa',
                                name: 'PortalSettingPwa',
                                redirect: to => ({ name: 'PortalSettingAdvanced', params: to.params }),
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
                            }
                        ]
                    },

                ]
            },
        ]
    },
    {
        path: '/smugglers-report',
        name: 'SmugglersReport',
        meta: {
            title: 'smugglersReport.title',
            keywords: 'smugglersReport.meta.keywords'
        },
        redirect: to => ({ name: 'SmugglersReportDetail', params: to.params }),
        component: SmugglersReportPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'view',
                name: 'SmugglersReportDetail',
                component: SmugglersReportDetailPage,
            }
        ]
    },
    {
        path: '/stateOfWar',
        name: 'StateOfWar',
        meta: {
            title: 'stateOfWar.title',
            keywords: 'stateOfWar.meta.keywords'
        },
        redirect: to => ({ name: 'StateOfWarSeasonView', params: { ...to.params, seasonId: getCurrentSeasonId() } }),
        component: StateOfWarPage,
        children: [
            {
                path: 'view',
                name: 'StateOfWarDefaultView',
                redirect: to => ({ name: 'StateOfWarSeasonView', params: { ...to.params, seasonId: getCurrentSeasonId() } }),
            },
            {
                path: ':seasonId/view',
                name: 'StateOfWarSeasonView',
                component: StateOfWarViewPage,
            }
        ]
    },
    {
        path: '/codex',
        name: 'Codex',
        component: CodexPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: '',
                name: 'codexOverview',
                component: CodexCodexOverviewPage,
                meta: {
                    title: 'codex.meta.title',
                    keywords: 'codex.meta.keywords'
                },
            },
            {
                path: 'ships',
                name: 'Ships',
                meta: {
                    title: 'codex.ships.title',
                    keywords: 'codex.ships.meta.keywords'
                },
                component: ShipsPage,
            },
            {
                path: 'ship/:id',
                name: 'ShipDetail',
                meta: {
                    title: 'codex.ship.title',
                    keywords: 'codex.ship.meta.keywords'
                },
                component: ShipDetailPage,
            },
            {
                path: 'items',
                name: 'Items',
                meta: {
                    title: 'codex.items.title',
                    keywords: 'codex.items.meta.keywords'
                },
                component: ItemsPage,
            },
            {
                path: 'item/:id',
                name: 'ItemDetail',
                meta: {
                    title: 'codex.item.title',
                    keywords: 'codex.item.meta.keywords'
                },
                component: ItemDetailPage,
            },
            {
                path: 'commodities',
                name: 'Commodities',
                meta: {
                    title: 'codex.commodities.title',
                    keywords: 'codex.commodities.meta.keywords'
                },
                component: CommoditiesPage,
            },
            {
                path: 'commoditie/:id',
                name: 'CommoditieDetail',
                meta: {
                    title: 'codex.commoditie.title',
                    keywords: 'codex.commoditie.meta.keywords'
                },
                component: CommoditieDetailPage,
            },
            {
                path: 'ultimates',
                name: 'Ultimates',
                meta: {
                    title: 'codex.ultimates.title',
                    keywords: 'codex.ultimates.meta.keywords'
                },
                component: UltimatesPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateDetail',
                meta: {
                    title: 'codex.ultimate.title',
                    keywords: 'codex.ultimate.meta.keywords'
                },
                component: UltimateDetailPage,
            },
            {
                path: 'modifications',
                name: 'Mods',
                meta: {
                    title: 'codex.modifications.title',
                    keywords: 'codex.modifications.meta.keywords'
                },
                component: ModsPage,

            },
            {
                path: 'modification/:id',
                name: 'ModDetail',
                meta: {
                    title: 'codex.modification.title',
                    keywords: 'codex.modification.meta.keywords'
                },
                component: ModDetailPage,
            },
            {
                path: 'materials',
                name: 'Materials',
                meta: {
                    title: 'codex.materials.title',
                    keywords: 'codex.materials.meta.keywords'
                },
                component: MaterialsPage,
            },
            {
                path: 'material/:id',
                name: 'MaterialDetail',
                meta: {
                    title: 'codex.material.title',
                    keywords: 'codex.material.meta.keywords'
                },
                component: MaterialDetailPage,
            },
            {
                path: 'cosmetics',
                name: 'Cosmetics',
                meta: {
                    title: 'codex.commoditys.title',
                    keywords: 'codex.commoditys.meta.keywords'
                },
                component: CosmeticsPage,
            },
            {
                path: 'cosmetic/:id',
                name: 'CosmeticDetail',
                meta: {
                    title: 'codex.cosmetic.title',
                    keywords: 'codex.cosmetic.meta.keywords'
                },
                component: CosmeticDetailPage,
            },
            {
                path: 'sets',
                name: 'Sets',
                meta: {
                    title: 'codex.sets.title',
                    keywords: 'codex.sets.meta.keywords'
                },
                component: SetsPage,
            },
            {
                path: 'set/:id',
                name: 'SetDetail',
                meta: {
                    title: 'codex.set.title',
                    keywords: 'codex.set.meta.keywords'
                },
                component: SetDetailPage,
            },
            {
                path: 'treasureMaps/comparison',
                name: 'TreasureMapComparison',
                meta: {
                    title: 'codex.treasureMaps.comparison.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: TreasureMapComparisonPage,
            },
            {
                path: 'treasureMaps',
                name: 'TreasureMaps',
                meta: {
                    title: 'codex.treasureMaps.title',
                    keywords: 'codex.treasureMaps.meta.keywords'
                },
                component: TreasureMapsPage,
            },
            {
                path: 'treasureMap/:id',
                name: 'TreasureMapDetail',
                meta: {
                    title: 'codex.treasureMap.title',
                    keywords: 'codex.treasureMap.meta.keywords'
                },
                component: TreasureMapDetailPage,
            },
            {
                path: 'mapLocations',
                name: 'MapLocations',
                meta: {
                    title: 'codex.mapLocations.title',
                    keywords: 'codex.mapLocations.meta.keywords'
                },
                component: MapLocationPage,
            },
            {
                path: 'mapLocation/:id',
                name: 'MapLocationDetail',
                meta: {
                    title: 'codex.mapLocation.title',
                    keywords: 'codex.mapLocation.meta.keywords'
                },
                component: MapLocationsDetailPage,
            },
            {
                path: 'npcs',
                name: 'Npcs',
                meta: {
                    title: 'codex.npcs.title',
                    keywords: 'codex.npcs.meta.keywords'
                },
                component: NpcsPage,
            },
            {
                path: 'npc/:id',
                name: 'NpcDetail',
                meta: {
                    title: 'codex.npc.title',
                    keywords: 'codex.npc.meta.keywords'
                },
                component: NpcDetailPage,
            },
            {
                path: 'empireSkills',
                name: 'EmpireSkills',
                meta: {
                    title: 'codex.empireSkills.title',
                    keywords: 'codex.empireSkills.meta.keywords'
                },
                component: EmpireSkillsPage,
            },
            {
                path: 'empireSkill/:id',
                name: 'EmpireSkillDetail',
                meta: {
                    title: 'codex.empireSkill.title',
                    keywords: 'codex.empireSkill.meta.keywords'
                },
                component: EmpireSkillDetailPage,
            },
            {
                path: 'empireSkills/:id',
                redirect: to => ({ name: 'EmpireSkillDetail', params: to.params }),
            },
            {
                path: 'masterys',
                name: 'Masterys',
                meta: {
                    title: 'codex.masterys.title',
                    keywords: 'codex.masterys.meta.keywords'
                },
                component: CodexMasterysPage,
            },
            {
                path: 'mastery/:id',
                name: 'MasteryDetail',
                meta: {
                    title: 'codex.mastery.title',
                    keywords: 'codex.mastery.meta.keywords'
                },
                component: CodexMasteryDetailPage,
            },
            {
                path: 'masterys/:id',
                redirect: to => ({ name: 'MasteryDetail', params: to.params }),
            },
            {
                path: 'quest',
                redirect: to => ({ name: 'Quests', params: to.params })
            },
            {
                path: 'quests',
                redirect: to => ({ name: 'Quests', params: to.params })
            },
            {
                path: 'quest/:id',
                redirect: to => ({ name: 'QuestDetail', params: to.params })
            },
            {
                path: 'quests/:id',
                redirect: to => ({ name: 'QuestDetail', params: to.params }),
            },
        ]
    },
    {
        path: '/quest',
        name: 'Quest',
        component: QuestPage,
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'Quests', params: to.params }),
        children: [
            {
                path: '',
                name: 'Quests',
                component: QuestListPage,
                meta: {
                    title: 'quest.title',
                    keywords: 'quest.meta.keywords'
                },
            },
            {
                path: ':id',
                name: 'QuestDetail',
                component: QuestDetailPage,
                meta: {
                    title: 'quest.detail.title',
                    keywords: 'quest.meta.keywords'
                },
            },
        ]
    },
    {
        path: '/quests',
        redirect: to => ({ name: 'Quests', params: to.params })
    },
    {
        path: '/quests/:id',
        redirect: to => ({ name: 'QuestDetail', params: to.params })
    },
    {
        path: '/ranking-designed-items',
        name: 'rankingDesignedItems',
        component: RankingDesignedItemsPage,
        meta: {
            title: 'rankingDesignedItems.title',
            keywords: 'rankingDesignedItems.keywords'
        },
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'RankingDesignedItemsBrowse', params: to.params }),
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
    },
    {
        path: '/calendar',
        name: 'Calendar',
        meta: {
            title: 'calendar.title',
            keywords: 'calendar.meta.keywords'
        },
        component: CalendarPage,
        redirect: to => ({ name: 'CalendarCurrentSeason', params: { ...to.params, seasonId: getLatestSeasonId() } }),
        children: [
            {
                path: 'history',
                name: 'CalendarHistoryDefault',
                component: CalendarHistoryPage,
            },
            {
                path: ':seasonId',
                name: 'CalendarCurrentSeason',
                component: CalendarHistoryPage,
            },
            {
                path: ':seasonId/history',
                name: 'CalendarHistorySeason',
                component: CalendarHistoryPage,
            }
        ]
    },
    {
        path: '/assembly',
        meta: {
            title: 'assembly.title',
            keywords: 'assembly.meta.keywords'
        },
        name: 'Assembly',
        component: AssemblePage,
        beforeEnter: initItemAssets,
        redirect: to => ({ name: 'AssemblyBrowse', params: to.params }),
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
                component: AssemblePublishPage,
                beforeEnter: isLoginBeforeEnter
            },
            {
                path: 'edit/:uid',
                name: 'EditAssembly',
                component: AssemblePublishPage,
                beforeEnter: isLoginBeforeEnter
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
    },
    {
        path: '/empire-skill-simulation',
        name: 'EmpireSkillSimulation',
        component: EmpireSkillSimulationPage,
        meta: {
            title: 'header.functions.empire-skill-simulation.title',
            keywords: 'header.functions.empire-skill-simulation.keywords'
        },
        beforeEnter: initItemAssets,
    },
    {
        path: '/mastery',
        component: MasteryPage,
        meta: {
            title: 'header.functions.mastery.title',
            keywords: 'header.functions.mastery.keywords'
        },
        beforeEnter: initItemAssets,
        children: [
            {
                path: '',
                name: 'Mastery',
                component: MasteryViewPage,
                meta: {
                    title: 'header.functions.mastery.title',
                    keywords: 'header.functions.mastery.keywords'
                },
            },
            {
                path: 'share',
                name: 'MasteryShare',
                component: MasterySharePage,
                meta: {
                    title: 'mastery.share.title',
                    keywords: 'header.functions.mastery.keywords'
                },
            },
        ]
    },
    {
        path: '/calculator',
        name: 'Calculator',
        component: CalculatorPage,
        meta: {
            title: 'calculator.title',
            keywords: 'calculator.meta.keywords'
        },
        beforeEnter: initItemAssets,
    },

    {
        path: '/map',
        name: 'Map',
        redirect: to => ({ name: 'mapView', params: to.params }),
        component: MapsPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'view',
                name: 'mapView',
                component: MapViewPage
            }
        ]
    },
    {
        path: '/apps',
        name: 'Apps',
        redirect: to => ({ name: 'AppsView', params: to.params }),
        component: AppsPage,
        children: [
            {
                path: 'view',
                name: 'AppsView',
                component: AppsViewPage
            },
            {
                path: 'qq-bot',
                name: 'QQBot',
                component: QQBotPage
            },
            {
                path: 'api-docs',
                alias: ['apiDocs'],
                name: 'ApiDocs',
                component: ApiDocsPage
            }
        ]
    },
    {
        path: '/docs',
        redirect: to => ({ name: 'ApiDocs', params: to.params })
    },
    {
        path: '/api-docs',
        redirect: to => ({ name: 'ApiDocs', params: to.params })
    },
    {
        path: '/about',
        name: 'About',
        redirect: to => ({ name: 'PortalSettingAbout', params: to.params })
    },
    {
        path: '/drop',
        name: 'Drop',
        component: DropPage,
        meta: {
            title: 'drop.title',
            keywords: 'drop.meta.keywords'
        }
    },
    {
        path: '/reminder',
        name: 'Reminder',
        redirect: to => ({ name: 'ReminderView', params: to.params }),
        component: ReminderIndexPage,
        children: [
            {
                path: 'view',
                name: 'ReminderView',
                component: ReminderViewPage,
                meta: {
                    title: 'reminder.title',
                    keywords: 'reminder.meta.keywords'
                }
            }
        ]
    },

    {
        path: '/widgets',
        name: 'Widgets',
        component: WidgetIndexPage,
        beforeEnter: initItemAssets,
        children: [
            {
                path: 'assembly/:uid',
                name: 'AssemblyWidget',
                component: WidgetAssemblyPage,
            },
            {
                path: 'mastery/:uid',
                name: 'MasteryWidget',
                component: WidgetMasteryPage,
            },
            {
                path: 'ship/:id',
                name: 'ShipWidget',
                component: WidgetShipPage,
            },
            {
                path: 'item/:id',
                name: 'ItemWidget',
                component: WidgetItemPage,
            },
            {
                path: 'material/:id',
                name: 'MaterialWidget',
                component: WidgetMaterialPage,
            },
            {
                path: 'npc/:id',
                name: 'NPCWidget',
                component: WidgetNpcPage,
            },
            {
                path: 'modification/:id',
                name: 'ModWidget',
                component: WidgetModPage,
            },
            {
                path: 'cosmetic/:id',
                name: 'CosmeticWidget',
                component: WidgetCosmeticPage,
            },
            {
                path: 'commoditie/:id',
                name: 'CommoditieWidget',
                component: WidgetCommoditiePage,
            },
            {
                path: 'treasureMap/:id',
                name: 'TreasureMapWidget',
                component: WidgetTreasureMapPage,
            },
            {
                path: 'ultimate/:id',
                name: 'UltimateWidget',
                component: WidgetUltimatePage,
            },
            {
                path: 'set/:id',
                name: 'SetWidget',
                component: WidgetSetPage,
            },
            {
                path: 'mapLocation/:id',
                name: 'MapLocationWidget',
                component: WidgetMapLocationPage,
            },
            {
                path: 'empireSkill/:id',
                name: 'EmpireSkillWidget',
                component: WidgetEmpireSkillPage,
            },
            {
                path: 'empireSkills/:id',
                redirect: to => ({ name: 'EmpireSkillWidget', params: to.params }),
            },
            {
                path: 'stateOfWar',
                name: 'StateOfWarWidget',
                component: WidgetStateOfWarPage,
            },
            {
                path: 'stateOfWar/:seasonId',
                name: 'StateOfWarSeasonWidget',
                component: WidgetStateOfWarPage,
            },
            {
                path: 'dailyReport',
                name: 'DailyReportWidget',
                component: WidgetDailyReportPage,
            },
            {
                path: 'dailyReport/:seasonId',
                name: 'DailyReportSeasonWidget',
                component: WidgetDailyReportPage,
            },
            {
                path: 'modSlot',
                name: 'ModSlotWidget',
                component: WidgetModSlotPage,
            },
            {
                path: 'combatEffect',
                name: 'CombatEffectWidget',
                component: WidgetCombatEffectPage,
            },
            {
                path: 'infamy',
                name: 'InfamyWidget',
                component: WidgetInfamyPage,
            }
        ]
    },

    {
        path: '/test',
        name: 'Test',
        component: Test,
        beforeEnter: initItemAssets
    },
];

export { SUPPORTED_LANGS };

function createLocalizedRoutes(rawRoutes: readonly RouteRecordRaw[]): RouteRecordRaw[] {
    const langPattern = SUPPORTED_LANGS.join('|');
    return rawRoutes.map(r => {
        const langPath = r.path === '/'
            ? `/:lang(${langPattern})`
            : `/:lang(${langPattern})${r.path}`;
        return {
            ...r,
            path: langPath,
        };
    });
}

const routes: Readonly<RouteRecordRaw[]> = [
    // 全局多语言专属路由 (/:lang/...)
    ...createLocalizedRoutes(baseAppRoutes),
    // 根入口
    {
        path: '/',
        name: 'RootEntry',
        component: PortalPage,
    },
    // 未带语言前缀或未匹配路由的兜底捕获（由 beforeEach 守卫自动补全语言前缀并重定向）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundPage,
    },
];

export const scrollBehavior = (to: any, from: any, savedPosition: any) => {
    if (staticFilePaths.includes(to.path)) {
        return false;
    }

    if (typeof window === 'undefined') {
        return { top: 0 };
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            // 检查是否有 scrollTop=false 查询参数
            const scrollTopParam = <boolean | string>to.query.scrollTop;
            if (scrollTopParam === 'false' || scrollTopParam == false) {
                // 不进行滚动
                resolve(false)
                return
            }

            if (to.hash) {
                resolve({
                    el: to.hash,
                    behavior: 'smooth',
                    top: (typeof document !== 'undefined' && document.querySelector('header')) ? 70 : 0
                })
            } else if (savedPosition) {
                resolve(savedPosition)
            } else {
                resolve({ top: 0, behavior: 'smooth' })
            }
        }, 300)
    })
};

export function setupRouterGuards(r: any) {
    if (r && typeof r.resolve === 'function' && !r.__hasCustomResolve) {
        const origResolve = r.resolve.bind(r);
        r.resolve = (to: any, currentLocation: any) => {
            let normalizedTo = to;
            if (typeof to === 'object' && to !== null) {
                if ('name' in to && to.name && (!to.params || !to.params.lang)) {
                    const currentLang = (currentLocation?.params?.lang as string)
                        || (r.currentRoute?.value?.params?.lang as string)
                        || DEFAULT_LANG;
                    normalizedTo = {
                        ...to,
                        params: {
                            lang: currentLang,
                            ...to.params,
                        }
                    };
                }
            }
            return origResolve(normalizedTo, currentLocation);
        };
        r.__hasCustomResolve = true;
    }

    r.beforeEach((to: any, from: any, next: any) => {
        if (staticFilePaths.includes(to.path)) {
            return false;
        }

        const segments = to.path.split('/').filter(Boolean);
        const firstSegment = segments[0];

        // 如果包含合法的语言前缀
        if (firstSegment && isSupportedLang(firstSegment)) {
            if (typeof window !== 'undefined') {
                storage.local.set('lang', { value: firstSegment });
            }
            return next();
        }

        // 在客户端：如果访问不带语言前缀的路径（如 / 或 /codex/item/culverin1）
        if (typeof window !== 'undefined') {
            const rawStored = storage.local.get('lang')?.data?.value;
            const stored = (typeof rawStored === 'object' && rawStored !== null && rawStored.value) ? rawStored.value : rawStored;
            const targetLang = (typeof stored === 'string' && isSupportedLang(stored))
                ? stored
                : (normalizeLang(navigator.language) || DEFAULT_LANG);

            const cleanPath = to.path === '/' ? '' : to.path;
            return next({ path: `/${targetLang}${cleanPath}`, query: to.query, hash: to.hash, replace: true });
        }

        next();
    });
}

const router = createRouter({
    history: typeof window !== 'undefined' ? createWebHistory() : createMemoryHistory(),
    routes,
    scrollBehavior,
});

setupRouterGuards(router);

export { routes };
export default router;


