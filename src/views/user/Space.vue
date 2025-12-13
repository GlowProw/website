<script setup lang="ts">

import Silk from "@/components/Silk.vue";
import {nextTick, onMounted, Ref, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useUserApi} from "@/assets/sripts/api";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";

import PrivilegesTagWidget from "@/components/PrivilegesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import EmptyView from "@/components/EmptyView.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import Textarea from "@/components/textarea"
import Loading from "@/components/Loading.vue"
import {AssemblyListResult, PaginationParams, ResultData} from "@/assets/types";
import {SpaceUserResult} from "@/assets/types/User";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";

const route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    api = useUserApi()

let loading = ref({
      userInfo: true,
      assembly: true,
      teamUp: true
    }),
    userData: Ref<SpaceUserResult> = ref({}),
    userAssemblyWidgetRefs = ref([]),
    userTeamUpData = ref({
      data: []
    }),
    userAssemblysData: Ref<AssemblyListResult> = ref({
      data: []
    }),
    spacePagination: Ref<PaginationParams> = ref({
      page: 1,
      pageSize: 10
    }),

    tabs = ref([
      {
        name: t('assembly.title'),
        value: 'assembly',
        icon: 'mdi-palette-outline'
      },
      {
        name: t('teamUp.title'),
        value: 'teamUp',
        icon: 'mdi-bullhorn-outline'
      },
    ]),
    tab = ref(tabs.value[0].value)

watch(userAssemblysData, (newList: ResultData) => {
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

        // 继续处理下一个
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

onMounted(() => {
  getUserInfo()
  onUpdateData(tab.value)
})

const onUpdateData = (value) => {
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

    const result = await api.getUserInfo(id as string),
        d = result.data;

    userData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
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

    const result = await api.getUserTeamups(id as string, spacePagination.value),
        d = result.data

    userTeamUpData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
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

    const result = await api.getUserAssemblys(id as string, spacePagination.value),
        d = result.data

    userAssemblysData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    loading.value.assembly = false;
  }
}
</script>

<template>
  <v-app>
    <v-card height="200px">
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
      <template v-slot:append>
        <v-container class="position-relative">
          <div class="position-absolute top-0 right-0 opacity-10 d-flex pt-10 ga-2">
            <v-icon icon="mdi-account" size="200"></v-icon>
          </div>
        </v-container>
      </template>
      <template v-slot:default>
        <v-container class="mt-3 ">
          <v-row no-gutters align="center">
            <v-col cols="auto">
              <v-card border>
                <UserAvatar :src="userData.userAvatar" v-if="userData.userAvatar" size="80"></UserAvatar>
              </v-card>
            </v-col>
            <v-col cols="8" class="ml-4">
              <h1 class="mb-1">{{ userData.username }}</h1>
              <div class="align-center d-flex ga-2 overflow-y-auto">
                <PrivilegesTagWidget :data="userData.privilege" density="compact"></PrivilegesTagWidget>
                <v-divider vertical class="mx-3" inset opacity=".2"></v-divider>
                <v-chip density="compact" v-if="userData.lastOnlineTime">
                  {{ t('space.lastOnlineTime') }}：
                  <Time :time="userData.lastOnlineTime"/>
                </v-chip>
                <v-chip density="compact" v-if="userData.joinTime">
                  {{ t('space.joinTime') }}：
                  <Time :time="userData.joinTime"/>
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-card>

    <v-divider></v-divider>

    <v-container>
      <template v-if="userData.attr && userData.attr.introduction">
        <Textarea class="mb-10 opacity-80 text-caption"
                  :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                  :minHeight="'auto'" v-model="userData.attr.introduction" readonly></Textarea>
      </template>

      <div :class="{'d-flex flex-row ': !mobile}">
        <v-tabs
            stacked
            border
            hide-slider
            v-model="tab"
            height="80"
            :class="{'mb-10': mobile}"
            :fixed="mobile"
            :direction="!mobile ? 'vertical' : 'horizontal'">
          <v-tab :value="i.value"
                 v-for="(i, index) in tabs"
                 :key="index"
                 :class="{'mb-5': !mobile, 'mr-5': mobile}"
                 selected-class="bg-amber"
                 class="mb-5 d-flex align-center justify-center"
                 min-width="80"
                 width="80"
                 height="80"
                 border
                 replaceb ripple slim>
            <template v-slot:default>
              <div>
                <v-icon size="30">{{ i.icon }}</v-icon>
                <p class="mt-2 singe-line">{{ i.name }}</p>
              </div>
            </template>
          </v-tab>
        </v-tabs>

        <v-main min-height="80vh" class="pl-lg-5">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="teamUp" class="position-relative">
              <v-card v-for="(i,index) in userTeamUpData.data" :key="index" class="mb-2 pa-2 pl-4" v-if="userTeamUpData.data && userTeamUpData.data.length > 0">
                <v-row align="center">
                  <v-col cols="12">
                    <div class="font-weight-bold text-h5 text-amber">{{ i.description }}</div>
                    <v-row class="text-body-1 opacity-60">
                      <v-col cols="auto">
                        <TimeView :time="i.createdTime">
                          <Time :time="i.createdTime"></Time>
                        </TimeView>
                      </v-col>
                      <v-col cols="auto">
                        {{ i.player }}
                      </v-col>
                      <v-col cols="auto">
                        <v-chip density="compact" v-for="(i, index) in i.tags" :key="index">
                          {{ i }}
                        </v-chip>
                      </v-col>
                    </v-row>
                  </v-col>
                  <v-spacer></v-spacer>
                </v-row>
              </v-card>
              <div class="text-center" v-else>
                <EmptyView></EmptyView>
              </div>

              <v-overlay v-model="loading.teamUp" contained class="d-flex justify-center align-center">
                <Loading size="50"></Loading>
              </v-overlay>
            </v-tabs-window-item>
            <v-tabs-window-item value="assembly" class="position-relative">
              <v-row v-if="userAssemblysData.data && userAssemblysData.data.length > 0" class="mr-16">
                <v-col cols="12" md="6" lg="6" v-for="(i, index) in userAssemblysData.data"
                       :key="index"
                       v-if="userAssemblysData.data.length > 0">
                  <v-card class="card-enlargement-flavor pa-5">
                    <v-row class="pt-5 pl-5 pr-5">
                      <v-col cols="9">
                        <router-link :to="`/assembly/browse/${i.uuid}/detail`">
                          <div :title="i.name || 'none'" class="text-amber text-h4 mb-1 font-weight-bold singe-line">{{ i.name || 'none' }}</div>
                        </router-link>
                        <div>
                          <AccountCardWidget :id="i.userId">
                            <div class="d-flex align-center">
                              <v-card v-if="i.userAvatar" class="mr-1">
                                <UserAvatar size="20" :src="i.userAvatar"></UserAvatar>
                              </v-card>
                              {{ i.username || t('assembly.anonymous') }}
                            </div>
                          </AccountCardWidget>
                        </div>
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
              <div class="text-center" v-else>
                <EmptyView></EmptyView>
              </div>

              <!-- 分页 S -->
              <v-pagination
                  v-if="userAssemblysData.pagination"
                  v-model="spacePagination.page"
                  :length="userAssemblysData.pagination?.totalPages || 0"
                  @update:model-value="getUserAssemblysData"
                  class="mt-8"
              ></v-pagination>
              <!-- 分页 E -->

              <v-overlay v-model="loading.assembly" contained class="d-flex justify-center align-center">
                <Loading size="50"></Loading>
              </v-overlay>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-main>
      </div>
    </v-container>
  </v-app>
</template>

<style scoped lang="less">

</style>
