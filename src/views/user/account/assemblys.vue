<script setup lang="ts">

import {useHttpToken} from "@/assets/sripts/http_util";
import {nextTick, onMounted, ref, watch} from "vue";
import {api} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {ResultData} from "@/assets/types";

import Loading from "@/components/Loading.vue";
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";
import EmptyView from "@/components/EmptyView.vue";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";

const http = useHttpToken(),
    {t} = useI18n()

let loading = ref(false),
    userAssemblysData = ref({}),
    userAssemblyWidgetRefs = ref([])

onMounted(() => {
  getMyAssemblysData()
})

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

/**
 * 获取账户相关配装信息
 */
const getMyAssemblysData = async () => {
  try {
    loading.value = true;
    const result = await http.get(api['user_me_assemblys']),
        d = result.data

    if (d.error == 1)
      return;

    userAssemblysData.value = d.data;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained>
      <Loading></Loading>
    </v-overlay>

    <v-row
        v-if="userAssemblysData.data && userAssemblysData.data.length > 0">
      <v-col cols="12" md="6" lg="6" v-for="(i, index) in userAssemblysData.data"
             :key="index" class="">
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
                    class=" mb-5 ml-n10 mr-n10"
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

          <!-- 管理按钮 S -->
          <v-row align="stretch">
            <v-spacer></v-spacer>
            <v-col cols="auto" class="d-flex">
              <v-card border height="50">
                <v-btn class="h-100 px-8" elevation="0" tile :to="`/assembly/workshop/${i.uuid}/edit`" target="_blank" icon="mdi-pencil"></v-btn>
                <v-btn class="h-100 px-8" elevation="0" tile :to="`/assembly/browse/${i.uuid}/detail`" target="_blank" icon="mdi-open-in-new"></v-btn>
                <v-divider vertical></v-divider>
                <AssemblySettingPanel :id="i.uuid">
                  <v-btn class="h-100 px-10" elevation="0" tile icon="mdi-cog"></v-btn>
                </AssemblySettingPanel>
              </v-card>
            </v-col>
          </v-row>
          <!-- 管理按钮 E -->
        </v-card>
      </v-col>
    </v-row>
    <div class="text-center" v-else>
      <EmptyView></EmptyView>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
