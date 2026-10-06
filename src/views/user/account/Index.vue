<script setup lang="ts">
import {computed, ref, watch, type Ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

import Silk from "@/components/Silk.vue";
import EmptyView from "@/components/EmptyView.vue";
import UserAvatar from "@/components/UserAvatar.vue";

const route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    authStore = useAuthStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()

// 一级菜单选项
const primaryNavMenu = ref<'MeAccount' | 'MeDataList'>('MeAccount')

// 二级菜单列表
const accountTabs = [
  {
    name: 'account.information.title',
    value: 'AccountInformation',
    icon: 'mdi-card-account-details-outline'
  },
  {
    name: 'account.profile-picture.title',
    value: 'AccountProfilePicture',
    icon: 'mdi-face-man-profile'
  },
  {
    name: 'account.bindings.title',
    value: 'AccountBindings',
    icon: 'mdi-link-variant'
  },
]

// 分类下的二级菜单列表
const dataTabs = [
  {
    name: 'account.myAssembly',
    value: 'AccountAssemblys',
    icon: 'mdi-package-variant-closed'
  },
  {
    name: 'account.myComment',
    value: 'AccountComments',
    icon: 'mdi-comment-text-multiple-outline'
  },
  {
    name: 'account.myTeamup',
    value: 'AccountTeamUps',
    icon: 'mdi-account-group-outline'
  },
  {
    name: 'account.myMap',
    value: 'AccountMaps',
    icon: 'mdi-map-marker-multiple-outline'
  },
  {
    name: 'account.mySmugglersReport',
    value: 'AccountSmugglersReport',
    icon: 'mdi-file-document-outline'
  },
  {
    name: 'account.trash',
    value: 'AccountTrash',
    icon: 'mdi-delete-empty-outline'
  },
]

// 判断路由属于哪个大类
const isDataRoute = (routeName: string) => dataTabs.some(i => i.value === routeName)
const isAccountRoute = (routeName: string) => accountTabs.some(i => i.value === routeName)

// 当前大类下显示的二级 Tab 列表
const currentSubTabs = computed(() => {
  return primaryNavMenu.value === 'MeAccount' ? accountTabs : dataTabs
})

// 当前激活的二级 Tab 项
const tab = ref<string>(accountTabs[0].value)

// 依据路由同步一级 Tab 与二级 Tab
const syncFromRoute = (routeName: string) => {
  if (isDataRoute(routeName)) {
    primaryNavMenu.value = 'MeDataList'
    tab.value = routeName
  } else if (isAccountRoute(routeName)) {
    primaryNavMenu.value = 'MeAccount'
    tab.value = routeName
  }
}

watch(() => route.name, (newName) => {
  if (newName) {
    syncFromRoute(newName as string)
  }
}, {immediate: true})

// 一级 Tab 切换事件
const onPrimaryTabChange = (val: any) => {
  primaryNavMenu.value = val
  if (val === 'MeAccount') {
    if (!isAccountRoute(route.name as string)) {
      router.push({ name: accountTabs[0].value, params: route.params })
    }
  } else if (val === 'MeDataList') {
    if (!isDataRoute(route.name as string)) {
      router.push({ name: dataTabs[0].value, params: route.params })
    }
  } else if (val === 'MeSpace') {
    const uid = authStore.user?.userId
    if (uid) {
      router.push(`/space/${uid}`)
    }
  }
}

// 二级 Tab 切换事件（严格遵循 setting/View.vue）
const onSubTabChange = (targetRouteName: any) => {
  if (targetRouteName && targetRouteName !== route.name) {
    router.push({ name: targetRouteName, params: route.params })
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

defineOptions({
  name: 'AccountIndex'
})
</script>

<template>
    <v-card min-height="200px" class="d-flex flex-column justify-space-between mt-13">
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
            <v-breadcrumbs-item>{{ t('account.title') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
            <v-icon icon="mdi-account" size="200"></v-icon>
          </div>
        </v-container>

        <v-container class="pa-0 px-2 mt-auto d-flex align-end" v-if="authStore.isLogin">
          <v-row dense>
            <v-col cols="9">
            <v-tabs
              v-model="primaryNavMenu"
              @update:model-value="onPrimaryTabChange"
              color="amber"
              stacked
              align-tabs="start"
              density="comfortable"
              class="primary-tabs">
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
          </v-col>
          <v-col cols="3" class="d-flex align-center justify-end" v-if="authStore.isLogin">
            <div class="d-flex align-center">
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <h2 class="singe-line text-h4 font-weight-bold d-flex align-center" v-bind="props">
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
            </div>
          </v-col>
          </v-row>
        </v-container>
      </template>
    </v-card>

    <v-divider></v-divider>

    <div class="account-root">
    <div class="setting-page-root" v-if="authStore.isLogin">
      <v-container>
        <div :class="{'d-flex flex-row': !mobile}">
          <div :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}">
            <v-tabs
                stacked
                border
                hide-slider
                v-model="tab"
                @update:model-value="onSubTabChange"
                class="w-100 h-100"
                density="default"
                :fixed="mobile"
                :direction="!mobile ? 'vertical' : 'horizontal'">
              <template v-for="(i, index) in currentSubTabs" :key="index">
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

          <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
            <router-view></router-view>
          </div>
        </div>
      </v-container>
    </div>

    <!-- 未登录提示 S -->
    <div v-else class="setting-page-root">
      <v-container class="py-16 text-center">
        <EmptyView>
          <template v-slot:title>
            <h3 class="text-h5 font-weight-bold mb-2">{{ t('account.needLogin') }}</h3>
          </template>
          <template v-slot:description>
            <p class="opacity-60 mb-6">{{ t('account.needLoginDesc') }}</p>
            <v-btn color="amber" variant="tonal" to="/account/signin" class="px-8 font-weight-bold">
              {{ t('signin.title') }}
            </v-btn>
          </template>
        </EmptyView>
      </v-container>
    </div>
    <!-- 未登录提示 E -->
  </div>
</template>

<style scoped lang="less">
.account-root {
  min-height: calc(100vh - 64px);
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
