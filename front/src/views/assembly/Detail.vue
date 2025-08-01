<script setup lang="ts">

import AssemblyShowWidget from "@/components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {computed, nextTick, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api} from "@/assets/sripts";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import {useAuthStore} from "@/../stores";
import LikeWidget from "@/components/LikeWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import Loading from "@/components/Loading.vue";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue"
import Silk from "@/components/Silk.vue";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    authStore = useAuthStore(),
    {t, locale} = useI18n(),
    {asString} = useI18nUtils()

let assemblyDetailData = ref({
      uuid: '',
      name: '',
      tags: [],
      description: '',
      username: '',
      createdTime: Date.now(),
      updatedTime: Date.now(),
    }),
    assemblyDetailRef = ref(null),
    assemblyLoading = ref(false),
    delAssemblyLoading = ref(false),
    language = computed(() => locale.value.split('-')[0]),
    sso = ref({
      // name:   "SampleNews",
      // button:  "http://example.com/images/samplenews.gif",
      // icon:     "http://example.com/favicon.png",
      // url:        "http://example.com/login/",
      // logout:  "http://example.com/logout/",
      // width:   "800",
      // height:  "400"
    })

onMounted(() => {
  getAssemblyDetail()
})

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  try {
    const {uuid} = route.params;
    assemblyLoading.value = true;
    const result = await http.get(api['assembly_item'], {
          params: {
            uuid,
          },
        }),
        d = result.data;

    if (d.error == 1)
      return;

    assemblyDetailData.value = d.data;
    assemblyDetailData.value.description = unescape(assemblyDetailData.value.description || '这个人很懒什么,对此配装什么都没说')

    await nextTick(() => {
      assemblyDetailRef.value.onLoadJson(d.data.data || d.data.assembly)
    })
  } finally {
    assemblyLoading.value = false
  }
}

/**
 * 删除配装
 */
const delAssembly = async () => {
  try {
    const {uuid} = route.params;
    delAssemblyLoading.value = true
    const result = await http.post(api['assembly_delete'], {
          data: {uuid},
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d.message || d.code);

    await router.push("/assembly")
  } catch (e) {
    if (e instanceof Error)
      console.error(e)
  } finally {
    delAssemblyLoading.value = false
  }
}
</script>

<template>
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
    <template v-slot:default>
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs class="pa-2">
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pa-7">
        <v-overlay
            :model-value="assemblyLoading"
            transition
            scrim
            class="align-center justify-center background-flavor">
          <Loading size="120"></Loading>
        </v-overlay>

        <div v-show="!assemblyLoading">
          <div class="ml-n2 mr-n2">
            <v-toolbar color="" class="bg-transparent">
              <h1 :title="assemblyDetailData.name || 'none'" class="text-amber text-h2 singe-line">{{ assemblyDetailData.name || 'none' }}</h1>

              <v-spacer></v-spacer>

              <LikeWidget targetType="assembly"
                          class="ml-2"
                          v-if="authStore.isLogin"
                          :targetId="assemblyDetailData.uuid"
                          :userId="authStore.user.userId">
                <template v-slot:activate>
                  <v-btn icon="mdi-thumb-up"></v-btn>
                </template>
                <template v-slot:unActivate>
                  <v-btn icon="mdi-thumb-up-outline"></v-btn>
                </template>
              </LikeWidget>

              <template v-if="authStore.isLogin && authStore.user.userId == assemblyDetailData.userId">
                <v-btn icon="mdi-delete-outline" class="mr-5 text-red" :loading="delAssemblyLoading" @click="delAssembly"></v-btn>

                <v-btn variant="flat" :to="`/assembly/workshop/${assemblyDetailData.uuid}/edit`">
                  <v-icon icon="mdi-pencil" class="mr-2"></v-icon>
                  编辑此配装
                </v-btn>
              </template>
            </v-toolbar>
          </div>
        </div>
      </v-container>
    </template>
  </v-card>

  <!-- Assembly Preview S -->
  <v-card class="card-enlargement-flavor mt-n3 mb-5 ml-n10 mr-n10 ">
    <ZoomableCanvas
        style="height: 600px"
        :minScale=".8"
        :max-scale="1.2"
        :boundary="{
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
      <AssemblyShowWidget ref="assemblyDetailRef" :readonly="true"></AssemblyShowWidget>
    </ZoomableCanvas>
  </v-card>
  <!-- Assembly Preview E -->

  <v-container>
    <div>
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="8">
          <div class="ga-2 mb-6" v-if="assemblyDetailData.tags">
            <v-chip class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in assemblyDetailData.tags">
              {{
                asString([
                  `${i}`,
                  `assembly.teamFormationMethods.${i.split('_')[1]}`,
                  `assembly.archetypes.${i.split('_')[1]}`,
                  `assembly.modes.${i.split('_')[0]}`,
                  `assembly.damageTypes.${i.split('_')[1]}`,
                  `snb.seasons.${i.split('_')[1]}`,
                ], true)
              }}
            </v-chip>
          </div>

          <Textarea class="mt-5 mb-2"
                    :readonly="true"
                    v-model="assemblyDetailData.description"
                    placeholder="输入描述描述"></Textarea>

          <v-divider>评论</v-divider>

          <CommentWidget :id="assemblyDetailData.uuid" type="assembly"></CommentWidget>
        </v-col>
        <v-col cols="12" sm="12" lg="4" xl="4">
          <v-text-field
              label="作者"
              v-model="assemblyDetailData.username"
              readonly
              variant="underlined">
          </v-text-field>

          <v-text-field
              :value="new Date(assemblyDetailData.createdTime).toLocaleString()"
              readonly
              hide-details
              variant="underlined">
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar-range"></v-icon>
            </template>
            <template v-slot:prepend-inner>
              <p class="text-no-wrap">创建时间:</p>
            </template>
          </v-text-field>

          <v-text-field
              :value="new Date(assemblyDetailData.updatedTime).toLocaleString()"
              readonly
              hide-details
              variant="underlined">
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar-range"></v-icon>
            </template>
            <template v-slot:prepend-inner>
              <p class="text-no-wrap">更新时间:</p>
            </template>
          </v-text-field>

          <AssemblyTagsWidget
              class="mt-4"
              :readonly="true"
              :tags="assemblyDetailData.tags"></AssemblyTagsWidget>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped lang="less">

</style>
