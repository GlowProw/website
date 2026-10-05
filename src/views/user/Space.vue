<script setup lang="ts">
import Silk from "@/components/Silk.vue";
import {computed, nextTick, onMounted, Ref, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";
import {handleApiError} from "@/assets/sripts/error_handler";

import RolesTagWidget from "@/components/RolesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import EmptyView from "@/components/EmptyView.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import Textarea from "@/components/textarea/index.vue";
import Loading from "@/components/Loading.vue";
import {AssemblyListResult, ResultData} from "@/assets/types";
import {SpaceUserResult} from "@/assets/types/User";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

const route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    authStore = useAuthStore(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()

let loading = ref({
      userInfo: true,
      assembly: true,
      teamUp: true
    }),
    userData: Ref<Partial<SpaceUserResult>> = ref({}),
    userAssemblyWidgetRefs = ref<any[]>([]),
    userTeamUpData = ref<ResultData<any[]>>({
      code: '0',
      data: []
    }),
    userAssemblysData: Ref<AssemblyListResult> = ref({
      code: '0',
      data: []
    }),
    spacePagination = ref({
      page: 1,
      pageSize: 10
    }),

    tabs = ref([
      {
        name: 'assembly.title',
        value: 'assembly',
        icon: 'mdi-palette-outline'
      },
      {
        name: 'teamUp.title',
        value: 'teamUp',
        icon: 'mdi-bullhorn-outline'
      },
    ]),
    tab = ref(tabs.value[0].value)

// 判断当前访问是否是登录用户自己的空间
const isSelf = computed(() => {
  if (!authStore.isLogin) return false;
  const currentUid = authStore.user?.userId || authStore.user?.id;
  const targetUid = route.params.id || userData.value?.userId || userData.value?.id;
  return String(currentUid) === String(targetUid);
});

// 一级 Tab 切换（与 account/Index.vue 保持完全一致的切换体系）
const onPrimaryTabChange = (val: any) => {
  if (val === 'MeAccount') {
    router.push('/account/information');
  } else if (val === 'MeDataList') {
    router.push('/account/assemblys');
  } else if (val === 'MeSpace') {
    const uid = authStore.user?.userId || authStore.user?.id;
    if (uid && String(route.params.id) !== String(uid)) {
      router.push(`/space/${uid}`);
    }
  }
};

const logout = () => {
  authStore.logout();
  router.push('/');
};

watch(userAssemblysData, (newList) => {
  if (newList && newList.data.length > 0) {
    nextTick(() => {
      const processBatch = (index = 0) => {
        if (index >= newList.data.length) return;

        const widget = userAssemblyWidgetRefs.value[index];
        if (widget?.onLoad) {
          widget
              .setSetting({
                assemblyUseVersion: newList.data[index]?.attr?.assemblyUseVersion,
                isShowItemName: newList.data[index]?.attr?.isShowItemName,
              })
              .onLoad(newList.data[index]?.assembly || {})
        }

        requestAnimationFrame(() => {
          processBatch(index + 1)
        })
      };

      processBatch()
    })
  }
}, {deep: true})

watch(() => tab.value, (value) => {
  onUpdateData(value)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    getUserInfo()
    onUpdateData(tab.value)
  }
})

onMounted(() => {
  getUserInfo()
  onUpdateData(tab.value)
})

const onUpdateData = (value: string) => {
  switch (value) {
    case 'teamUp':
      getUserTeamUpsData()
      break;
    case 'assembly':
      getUserAssemblysData()
      break;
  }
}

/**
 * 取得账户数据
 */
const getUserInfo = async () => {
  try {
    const {id} = route.params;

    if (!id) return;
    loading.value.userInfo = true;

    const result = await apis.userApi().getUserInfo(id as string),
        d = result.data;

    userData.value = d.data || {};
  } catch (e) {
    handleApiError(e, notice, t, { component: 'UserSpace' })
  } finally {
    loading.value.userInfo = false;
  }
}

/**
 * 获取账户相关配装信息
 */
const getUserTeamUpsData = async () => {
  try {
    const {id} = route.params;

    if (Array.from(userTeamUpData.value.data).length > 0 && !id)
      return

    loading.value.teamUp = true;

    const result = await apis.userApi().getUserTeamups(id as string, spacePagination.value),
        d = result.data

    userTeamUpData.value = d.data;
  } catch (e) {
    handleApiError(e, notice, t, { component: 'UserSpace' })
  } finally {
    loading.value.teamUp = false;
  }
}

/**
 * 获取账户相关配装信息
 */
const getUserAssemblysData = async () => {
  try {
    const {id} = route.params;

    if (!id)
      return

    loading.value.assembly = true;

    const result = await apis.userApi().getUserAssemblys(id as string, spacePagination.value),
        d = result.data

    userAssemblysData.value = d.data;
  } catch (e) {
    handleApiError(e, notice, t, { component: 'UserSpace' })
  } finally {
    loading.value.assembly = false;
  }
}

defineOptions({
  name: 'AccountSpace'
})
</script>

<template>
  <div class="space-page-root">
    <!-- Banner S -->
    <v-card min-height="200px" class="d-flex flex-column justify-space-between mt-13 rounded-0">
      <template v-slot:image>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black">
        </Silk>
      </template>
      <template v-slot:default>
        <v-container class="pa-2 mt-4 position-relative">
          <v-breadcrumbs class="pa-0 mb-3">
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('space.title') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
            <v-icon icon="mdi-account" size="200"></v-icon>
          </div>
        </v-container>

        <v-container class="pa-0 px-2 mt-auto d-flex align-end" >
          <v-tabs
              model-value="MeSpace"
              @update:model-value="onPrimaryTabChange"
              color="amber"
              stacked
              align-tabs="start"
              density="comfortable"
              class="primary-tabs"
              v-if="isSelf">
            <v-tab value="MeAccount" class="font-weight-bold text-subtitle-1 px-8">
              {{ t('account.title') }}
            </v-tab>
            <v-tab value="MeDataList" class="font-weight-bold text-subtitle-1 px-8">
              {{ t('account.dataList') }}
            </v-tab>
            <v-tab value="MeSpace" class="font-weight-bold text-subtitle-1 px-8">
              {{ t('space.title') }}
            </v-tab>
          </v-tabs>

          <template v-if="!isSelf">
            <div class="mb-5 d-flex ga-2">
              <RolesTagWidget :data="userData.role || []"></RolesTagWidget>
            <v-chip v-if="userData.lastOnlineTime">
              {{ t('space.lastOnlineTime') }}：
              <Time :time="userData.lastOnlineTime"/>
            </v-chip>
            <v-chip v-if="userData.joinTime">
              {{ t('space.joinTime') }}：
              <Time :time="userData.joinTime"/>
            </v-chip>
            </div>
          </template>
          
          <v-spacer></v-spacer>
          <v-col cols="auto" class="d-flex align-center">
            <div class="d-flex align-center">
              <v-menu location="bottom end" v-if="isSelf">
                <template v-slot:activator="{ props }">
                  <h2 class="text-h4 font-weight-bold d-flex align-center" v-bind="props">
                    Hi, <u class="u">{{ authStore.currentUser || 'Captain' }}</u>
                  </h2>
                  <v-btn
                      v-bind="props"
                      icon="mdi-menu-down"
                      variant="text"
                      density="comfortable"
                      size="small"
                      class="ml-1">
                  </v-btn>
                </template>
                <v-list density="compact" min-width="140" border rounded="lg" class="pa-1">
                  <v-list-item
                      prepend-icon="mdi-logout"
                      color="error"
                      base-color="error"
                      rounded="lg"
                      @click="logout">
                    <v-list-item-title>{{ t('account.logout') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <template v-else>
                <h2 class="text-h4 font-weight-bold d-flex align-center" v-bind="props">
                  <v-card border class="mr-4">
                    <UserAvatar :src="userData.userAvatar" v-if="userData.userAvatar" size="44"></UserAvatar>
                    <v-avatar size="44" v-else>
                      <v-icon icon="mdi-account" size="24"></v-icon>
                    </v-avatar>
                  </v-card> 
                  <u class="u">{{ userData.username || 'Captain' }}</u>
                </h2>
              </template>
            </div>
          </v-col>
        </v-container>
        <!-- 当前用户查看自己空间时展示一级 Tab E -->
      </template>
    </v-card>
    <!-- Banner E -->

    <v-divider></v-divider>

    <!-- 下方内容区域 S -->
    <div class="account-root">
      <div class="setting-page-root">
        <v-container>
          <div :class="{'d-flex flex-row': !mobile}">
            <div :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}">
              <v-tabs
                  stacked
                  border
                  hide-slider
                  v-model="tab"
                  class="w-100 h-100"
                  :fixed="mobile"
                  :direction="!mobile ? 'vertical' : 'horizontal'">
                <template v-for="(i, index) in tabs" :key="index">
                  <v-tooltip content-class="pa-0" :target="[tooltipPos.x, tooltipPos.y]">
                    <template v-slot:default>
                      <v-card border class="py-3 px-10">
                        {{ t(i.name) }}
                      </v-card>
                    </template>
                    <template v-slot:activator="{props}">
                      <div :class="{'mb-2': !mobile, 'mr-5': mobile}">
                        <v-tab
                            :value="i.value"
                            selected-class="bg-amber"
                            class="d-flex align-center justify-center"
                            min-width="80"
                            width="80"
                            height="80"
                            border
                            @mousemove="onMouseMove"
                            @mouseenter="onMouseEnter"
                            v-bind="props"
                            replaceb
                            ripple
                            slim>
                          <div>
                            <v-icon size="40">{{ i.icon }}</v-icon>
                          </div>
                        </v-tab>
                        <p class="mt-1 mb-3 text-center singe-line w-100 tab-item" :title="t(i.name)">
                          {{ t(i.name) }}
                        </p>
                      </div>
                    </template>
                  </v-tooltip>
                </template>
              </v-tabs>
            </div>

            <!-- 右侧视窗内容 S -->
            <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
              <v-tabs-window v-model="tab">
                <!-- 组队招募窗口 S -->
                <v-tabs-window-item value="teamUp" class="position-relative">
                  <v-card v-for="(i, index) in userTeamUpData.data" :key="index" class="mb-2 pa-3 pl-4" v-if="userTeamUpData.data && userTeamUpData.data.length > 0">
                    <v-row align="center">
                      <v-col cols="12">
                        <div class="font-weight-bold text-h5 text-amber">{{ i.description }}</div>
                        <v-row class="text-body-1 opacity-60">
                          <v-col cols="auto">
                            <TimeView :time="i.createdTime"></TimeView>
                          </v-col>
                          <v-col cols="auto">
                            {{ i.player }}
                          </v-col>
                          <v-col cols="auto">
                            <v-chip density="compact" v-for="(tag, tIdx) in i.tags" :key="tIdx">
                              {{ tag }}
                            </v-chip>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-card>
                  <div class="text-center py-10" v-else>
                    <EmptyView></EmptyView>
                  </div>

                  <v-overlay v-model="loading.teamUp" contained class="d-flex justify-center align-center">
                    <Loading size="50"></Loading>
                  </v-overlay>
                </v-tabs-window-item>
                <!-- 组队招募窗口 E -->

                <!-- 配装窗口 S -->
                <v-tabs-window-item value="assembly" class="position-relative">
                  <v-row v-if="userAssemblysData.data && userAssemblysData.data.length > 0" class="mr-lg-10">
                    <v-col cols="12" md="6" lg="6" v-for="(i, index) in userAssemblysData.data" :key="index">
                      <v-card class="card-enlargement-mask-flavor pa-5 ma-n1">
                        <v-row class="pt-2 px-1">
                          <v-col>
                            <router-link :to="`/assembly/browse/${i.uuid}/detail`">
                              <div :title="String(i.name || 'none')" class="text-amber text-h4 mb-1 font-weight-bold singe-line">{{ i.name || 'none' }}</div>
                            </router-link>
                            <v-row>
                              <v-col>
                                <AccountCardWidget :id="i.userId">
                                  <div class="d-flex align-center">
                                    <v-card v-if="i.userAvatar" class="mr-1">
                                      <UserAvatar size="20" :src="i.userAvatar"></UserAvatar>
                                    </v-card>
                                    <span class="u">{{ i.username || t('assembly.anonymous') }}</span>
                                  </div>
                                </AccountCardWidget>
                              </v-col>

                              <v-col cols="auto">
                                <v-chip density="compact" class="badge-flavor px-3" :disabled="!!i.isLiked">
                                  <v-icon color="red">{{ i.likes <= 0 ? 'mdi-heart-outline' : 'mdi-heart'}}</v-icon>
                                  <span class="ml-1 text-red-accent-4" v-if="i.likes">{{ i.likes || 0 }}</span>
                                </v-chip>
                              </v-col>
                            </v-row>
                          </v-col>
                        </v-row>

                        <v-hover v-slot="{ isHovering, props }">
                          <div v-bind="props" class="position-relative">
                            <AssemblyTouring>
                              <AssemblyWidget
                                  class="card-flavor mb-5 ml-n10 mr-n10"
                                  :readonly="true"
                                  :ref="(el) => { if (el) userAssemblyWidgetRefs[index] = el }">
                              </AssemblyWidget>
                            </AssemblyTouring>
                            <router-link :to="`/assembly/browse/${i.uuid}/detail`" target="_blank">
                              <v-overlay scrim="#000" contained class="d-flex justify-center align-center" :model-value="!!isHovering">
                                <v-icon icon="mdi-open-in-new" size="30"></v-icon>
                              </v-overlay>
                            </router-link>
                          </div>
                        </v-hover>
                      </v-card>
                    </v-col>
                  </v-row>
                  <div class="text-center py-10" v-else>
                    <EmptyView></EmptyView>
                  </div>

                  <!-- 分页 S -->
                  <v-pagination
                      v-if="userAssemblysData.pagination"
                      v-model.number="spacePagination.page"
                      :length="userAssemblysData.pagination?.totalPages || 0"
                      @update:model-value="getUserAssemblysData"
                      class="mt-8"
                  ></v-pagination>
                  <!-- 分页 E -->

                  <v-overlay v-model="loading.assembly" contained class="d-flex justify-center align-center">
                    <Loading size="50"></Loading>
                  </v-overlay>
                </v-tabs-window-item>
                <!-- 配装窗口 E -->
              </v-tabs-window>
            </div>
            <!-- 右侧视窗内容 E -->
          </div>
        </v-container>
      </div>
    </div>
    <!-- 下方内容区域 E -->
  </div>
</template>

<style scoped lang="less">
.space-page-root {
  min-height: calc(100vh - 64px);
}

.account-root {
  min-height: 80vh;
}

.primary-tabs {
  border-bottom: none;
}

.tabs-box-mobile {
  height: auto;

  .tab-item {
    max-width: 80px;
    font-size: 12px;
  }
}

.tabs-box-desktop {
  width: 80px;
  min-width: 80px;
  flex-shrink: 0;

  .tab-item {
    font-size: 12px;
  }
}

.setting-content {
  min-width: 0;
  width: 100%;
  min-height: 80vh;
}

.border-amber {
  border: 2px solid rgba(255, 193, 7, 0.5);
}
</style>
