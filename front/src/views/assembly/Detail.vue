<script setup lang="ts">

import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {computed, nextTick, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api} from "../../assets/sripts";
import {useHttpToken} from "../../assets/sripts/httpUtil";
import {useAuthStore} from "../../../stores";
import LikeWidget from "../../components/LikeWidget.vue";
import {DisqusComments, DisqusCount} from "vue3-disqus";
import Textarea from "../../components/textarea/index.vue";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    authStore = useAuthStore(),
    {t, locale} = useI18n()

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
  const {uuid} = route.params;

  const result = await http.get(api['assembly_item'], {
        params: {
          uuid,
        },
      }),
      d = result.data;

  if (d.error == 1)
    return;

  assemblyDetailData.value = d.data;
  assemblyDetailData.value.description = unescape(assemblyDetailData.value.description)

  nextTick(() => {
    assemblyDetailRef.value.onLoadJson(d.data.assembly)
  })
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
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <!-- Assembly Preview S -->
  <v-container>
    <div class="ml-n2 mr-n2">
      <v-toolbar color="" class="bg-transparent">
        <h1 class="text-amber">{{ assemblyDetailData.name || 'none' }}</h1>

        <v-spacer></v-spacer>

        <LikeWidget targetType="assembly"
                    class="ml-2"
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

        <v-btn to="#commit" class="ml-2">
          <v-icon icon="mdi-comment-outline" class="mr-2"></v-icon>
          <DisqusCount :lazy="true"
                       :language="language"
                       :identifier="`/assembly/uuid/${assemblyDetailData.uuid}`"></DisqusCount>
        </v-btn>
      </v-toolbar>

      <AssemblyShowWidget class="card-flavor mb-5 ml-n10 mr-n10"
                          ref="assemblyDetailRef" :readonly="true">
        <template v-slot:image>
        </template>
      </AssemblyShowWidget>
    </div>

    <v-container>
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="4">
          <div id="commit">
            <DisqusComments :lazy="true"
                            :language="language"
                            :sso-config="sso"
                            :identifier="`/assembly/uuid/${assemblyDetailData.uuid}`"/>
          </div>
        </v-col>
        <v-col cols="12" sm="12" lg="4" xl="4">
          <v-text-field
              label="作者"
              v-model="assemblyDetailData.username"
              readonly
              variant="underlined">
          </v-text-field>

          <div class="ga-2 mb-6">
            <v-badge color="transparent" dot class="badge-flavor mr-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in assemblyDetailData.tags">
              {{ i }}
            </v-badge>
          </div>

          <v-text-field
              label="创建时间"
              v-model="assemblyDetailData.createdTime"
              readonly
              variant="underlined">
          </v-text-field>

          <v-text-field
              label="更新时间"
              v-model="assemblyDetailData.updatedTime"
              readonly
              variant="underlined">
          </v-text-field>

          <Textarea class="mt-5 mb-2"
                    height="400px"
                    :readonly="true"
                    v-model="assemblyDetailData.description"
                    placeholder="输入描述描述"></Textarea>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
  <!-- Assembly Preview E -->
</template>

<style scoped lang="less">

</style>
