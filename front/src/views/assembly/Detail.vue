<script setup lang="ts">

import AssemblyShowWidget from "@/components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {nextTick, onMounted, ref, watch} from "vue";
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
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";

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
    password = ref(''),
    messages = ref([])

watch(() => route.params, (value) => {
  getAssemblyDetail()
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
    const {password} = route.query;
    assemblyLoading.value = true;

    const result = await http.get(api['assembly_item'], {
          params: {
            uuid,
            password
          },
        }),
        d = result.data;

    if (d.error == 1) {
      assemblyDetailData.value = d.data;
      return
    }

    assemblyDetailData.value = d.data;
    assemblyDetailData.value.description = unescape(assemblyDetailData.value.description || '这个人很懒什么,对此配装什么都没说')

    await nextTick(() => {
      assemblyDetailRef.value.onLoadJson(d.data.data || d.data.assembly, d.data.attr.assemblyUseVersion)
    })
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.data.code}`, {
        context: e.response.data.code
      }))
  } finally {
    assemblyLoading.value = false
  }
}

/**
 * 直访，无密码重输
 */
const onPenPassword = () => {
  router.push({name: route.name, query: {...route.query, 'password': password.value}})

  getAssemblyDetail()
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

      <v-container class="pt-7">
        <v-overlay
            :model-value="assemblyLoading"
            transition
            scrim
            class="align-center justify-center background-flavor">
          <Loading size="120"></Loading>
        </v-overlay>

        <div v-show="!assemblyLoading">
          <div class="ml-n2 mr-n2">
            <v-toolbar class="bg-transparent">
              <div>
                <h1 :title="assemblyDetailData.name || ''" class="text-amber text-h4 singe-line">{{ assemblyDetailData.name || '' }}</h1>

                <div class="d-flex ga-2">
                  <v-chip-group>
                    <v-chip density="compact" v-if="assemblyDetailData.isOwner">
                      所有者
                    </v-chip>
                    <v-chip density="compact" v-if="assemblyDetailData.isPassword">
                      包含密码
                    </v-chip>
                    <v-chip :to="`/assembly/browse/${assemblyDetailData.cloningUuid}/detail`" density="compact" v-if="assemblyDetailData.cloningUuid">
                      克隆: {{ assemblyDetailData.cloningUuid }}
                    </v-chip>
                  </v-chip-group>
                </div>
              </div>

              <v-spacer></v-spacer>

              <LikeWidget targetType="assembly"
                          v-if="authStore.isLogin && assemblyDetailData.isVisibility && assemblyDetailData.attr.isLike"
                          :targetId="assemblyDetailData.uuid"
                          :userId="authStore.user.userId">
                <template v-slot:activate>
                  <v-btn icon="mdi-thumb-up"></v-btn>
                </template>
                <template v-slot:unActivate>
                  <v-btn icon="mdi-thumb-up-outline"></v-btn>
                </template>
              </LikeWidget>

              <template v-if="assemblyDetailData.isVisibility && authStore.isLogin && assemblyDetailData.isOwner">
                <v-btn class="ml-3" variant="flat" :to="`/assembly/workshop/${assemblyDetailData.uuid}/edit`">
                  <v-icon icon="mdi-pencil" class="mr-2"></v-icon>
                  编辑此配装
                </v-btn>

                <AssemblySettingPanel :id="assemblyDetailData.uuid"
                                      :assembly-data="assemblyDetailData?.assembly || {}"
                                      @change="getAssemblyDetail">
                  <v-btn variant="flat" class="ml-3">
                    <v-icon icon="mdi-cog"></v-icon>
                  </v-btn>
                </AssemblySettingPanel>
              </template>
            </v-toolbar>
          </div>
        </div>
      </v-container>
    </template>
  </v-card>

  <!-- Assembly Preview S -->
  <v-card class="card-enlargement-flavor mt-n3 mb-5 ml-n10 mr-n10" v-if="assemblyDetailData.isVisibility">
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
      <AssemblyShowWidget ref="assemblyDetailRef" :readonly="true">
        <template v-slot:image v-if="assemblyDetailData.attr.backgroundPresentation">
          <v-img cover class="pointer-events-none" :src="assemblyDetailData.attr.backgroundPresentation"></v-img>
        </template>
      </AssemblyShowWidget>
    </ZoomableCanvas>
  </v-card>
  <!-- Assembly Preview E -->

  <v-container v-if="assemblyDetailData.isVisibility">
    <div>
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="8">
          <div class="ga-2 mb-6" v-if="assemblyDetailData.tags">
            <v-chip class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in assemblyDetailData.tags" :key="index">
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

          <template v-if="assemblyDetailData.attr.isComment">
            <v-divider>评论</v-divider>
            <CommentWidget :id="assemblyDetailData.uuid" placeholder="你对此有何见解？"
                           type="assembly"></CommentWidget>
          </template>
        </v-col>
        <v-col cols="12" sm="12" lg="4" xl="4">
          <v-text-field
              size="lg"
              class="text-h5"
              :value="assemblyDetailData.username || '匿名'"
              placeholder="作者"
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

  <v-container v-if="!assemblyDetailData.isPassword && !assemblyDetailData.isVisibility && !assemblyDetailData.assembly">
    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">抱歉,此配装不存在或不公开</h1>
      <p>未能找到
        <v-chip density="compact">{{ route.params.uuid }}</v-chip>
        ，它可能为私有或不存在
      </p>
    </v-card>
  </v-container>
  <v-container v-else-if="assemblyDetailData.isPassword">
    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">抱歉此配装，需要密码</h1>
      <p>你可以输入密码来解密</p>

      <div class="mt-8">
        <v-text-field placeholder="******" class="ma-auto" v-model="password" max-width="400">
          <template v-slot:append-inner>
            <v-btn @click="onPenPassword">确定</v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card>
  </v-container>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
