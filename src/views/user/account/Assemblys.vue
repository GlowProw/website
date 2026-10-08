<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {ResultData} from "@/assets/types";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";
import EmptyView from "@/components/EmptyView.vue";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    searchQuery = ref(''),
    userAssemblysData = ref<any>({}),
    userAssemblyWidgetRefs = ref<any[]>([])

onMounted(() => {
  getMyAssemblysData()
})

const filteredList = computed(() => {
  const list = userAssemblysData.value?.data || []
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((i: any) => (i.name || '').toLowerCase().includes(q))
})

watch(() => filteredList.value, (newList: any) => {
  if (newList && newList.length > 0) {
    nextTick(() => {
      const processBatch = (index = 0) => {
        if (index >= newList.length) return;

        const widget = userAssemblyWidgetRefs.value[index];
        if (widget?.onLoad) {
          widget
              .setSetting({
                assemblyUseVersion: newList[index]?.attr?.assemblyUseVersion,
                isShowItemName: newList[index]?.attr?.isShowItemName,
              })
              .onLoad(newList[index]?.assembly || {})
        }

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

    const result = await apis.userApi().getMeAssemblys(),
        d = result.data

    userAssemblysData.value = d.data;
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyAssemblys' })
  } finally {
    loading.value = false;
  }
}

defineOptions({
  name: 'AccountAssemblys'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained>
      <Loading></Loading>
    </v-overlay>

    <!-- Toolbar S -->
    <AffixContainerView>
      <v-card class="pa-3 mb-4">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              :placeholder="t('basic.button.search')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-width: 260px;"
              class="flex-grow-1">
          </v-text-field>

          <v-spacer></v-spacer>

          <div class="d-flex align-center ga-2">
            <v-btn
                color="amber"
                variant="tonal"
                to="/assembly/workshop"
                target="_blank">
              {{ t('assembly.create') }}
            </v-btn>

            <v-btn
                size="small"
                variant="tonal"
                icon="mdi-refresh"
                @click="getMyAssemblysData"
                :loading="loading">
            </v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <v-row v-if="filteredList && filteredList.length > 0">
      <v-col cols="12" md="6" lg="6" v-for="(i, index) in filteredList"
             :key="i.uuid || index" class="">
        <v-card class="card-enlargement-mask-flavor pa-5">
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
