<script setup lang="ts">

import Silk from "@/components/Silk.vue";
import {onMounted, ref, watch} from "vue";
import {api, http} from "@/assets/sripts/index";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";

import PrivilegesTagWidget from "@/components/PrivilegesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import EmptyView from "@/components/EmptyView.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import Textarea from "@/components/textarea"
import Loading from "@/components/Loading.vue"

const route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay()

let loading = ref({
      userInfo: true,
      assembly: true,
      teamUp: true
    }),
    userData = ref({}),
    userTeamUpData = ref({
      data: []
    }),
    userAssemblysData = ref({
      data: []
    }),
    browsePagination = ref({
      page: 1,
      pageSize: 10
    }),

    tabs = ref([
      {
        name: '配装',
        value: 'assembly',
        icon: 'mdi-palette-outline'
      },
      {
        name: '组队',
        value: 'teamUp',
        icon: 'mdi-bullhorn-outline'
      },
    ]),
    tab = ref(tabs.value[0].value)

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
      getMyTeamUpsData()
      break;
    case 'assembly':
      getAssemblysData()
      break;
  }
}

/**
 * 取得账户数据
 */
const getUserInfo = async () => {
  try {
    loading.value.userInfo = true;
    const {id} = route.params

    const result = await http.get(api['user_info'], {
          params: {id}
        }),
        d = result.data

    if (d.error == 1)
      return;

    userData.value = d.data;
  } finally {
    loading.value.userInfo = false;
  }
}

/**
 * 获取账户相关配装信息
 */
const getMyTeamUpsData = async () => {
  try {
    if (Array.from(userTeamUpData.value.data).length > 0)
      return

    loading.value.teamUp = true;
    const {id} = route.params
    const {page, pageSize} = browsePagination.value;

    const result = await http.get(api['user_space_teamups'], {
          params: {id, page, pageSize}
        }),
        d = result.data

    if (d.error == 1)
      return;

    userTeamUpData.value = d.data;
  } finally {
    loading.value.teamUp = false;
  }
}

/**
 * 获取账户相关配装信息
 */
const getAssemblysData = async () => {
  try {
    loading.value.assembly = true;

    const {id} = route.params
    const {page, pageSize} = browsePagination.value;

    const result = await http.get(api['user_space_assemblys'], {
          params: {
            id, page, pageSize
          }
        }),
        d = result.data

    if (d.error == 1)
      return;

    userAssemblysData.value = d.data;
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
                <UserAvatar :src="userData.userAvatar" size="80"></UserAvatar>
              </v-card>
            </v-col>
            <v-col cols="8" class="ml-4">
              <h1 class="mb-1">{{ userData.username }}</h1>
              <div class="align-center d-flex ga-2 overflow-y-auto">
                <PrivilegesTagWidget :data="userData.privilege" density="compact"></PrivilegesTagWidget>
                <v-divider vertical class="mx-3" inset></v-divider>
                <v-chip density="compact" v-if="userData.lastOnlineTime">最后在线：
                  <Time :time="userData.lastOnlineTime"/>
                </v-chip>
                <v-chip density="compact" v-if="userData.joinTime">加入时间：
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

      <div :class="{
        'd-flex flex-row ': !mobile,
      }">
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
              <v-card v-for="(i,index) in userAssemblysData.data" :key="index" class="mb-2 pl-4" v-if="userAssemblysData.data && userAssemblysData.data.length > 0">
                <v-row align="stretch">
                  <v-col>
                    <div class="mx-5 my-3">
                      <b class="font-weight-bold text-h5 text-amber">{{ i.name }}</b>
                      <p class="opacity-60">{{ i.uuid }}</p>
                    </div>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col cols="auto" class="d-flex">
                    <v-divider vertical></v-divider>
                    <v-btn class="h-100 px-8" elevation="0" tile :to="`/assembly/browse/${i.uuid}/detail`" target="_blank" icon="mdi-open-in-new"></v-btn>
                  </v-col>
                </v-row>
              </v-card>
              <div class="text-center" v-else>
                <EmptyView></EmptyView>
              </div>

              <!-- 配装分页 S -->
              <v-pagination
                  v-if="userAssemblysData.pagination"
                  v-model="browsePagination.page"
                  :length="userAssemblysData.pagination?.totalPages || 0"
                  @update:model-value="getAssemblysData"
                  class="mt-8"
              ></v-pagination>
              <!-- 配装分页 E -->

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
