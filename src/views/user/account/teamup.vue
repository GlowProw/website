<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    userTeamUpData = ref<any>({
      data: []
    }),
    searchQuery = ref(''),
    currentPage = ref(1),
    pageSize = 8

onMounted(() => {
  getMyTeamUpsData()
})

/**
 * 获取我的组队招募信息
 */
const getMyTeamUpsData = async () => {
  try {
    loading.value = true;
    const result = await apis.userApi().getMeTeamups(),
        d = result.data

    userTeamUpData.value = d.data || { data: [] };
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyTeamUps' })
  } finally {
    loading.value = false;
  }
}

const allTeamUps = computed(() => {
  return userTeamUpData.value?.data || []
})

const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return allTeamUps.value
  const q = searchQuery.value.toLowerCase().trim()
  return allTeamUps.value.filter((i: any) => {
    return (i.description && i.description.toLowerCase().includes(q)) ||
        (i.player && i.player.toLowerCase().includes(q))
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

defineOptions({
  name: 'AccountTeamUps'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained class="d-flex align-center justify-center">
      <Loading></Loading>
    </v-overlay>

    <!-- Toolbar S -->
    <AffixContainerView>
      <v-card class="mb-4 pa-2">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              :placeholder="t('basic.button.search')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-width: 280px;"
              class="flex-grow-1">
          </v-text-field>

          <v-spacer></v-spacer>

          <!-- 行为按钮组 -->
          <div class="d-flex align-center ga-2">
            <v-btn
                color="amber"
                variant="tonal"
                prepend-icon="mdi-plus"
                to="/team">
              {{ t('team.create') || '发布招募' }}
            </v-btn>

            <v-btn
                size="small"
                variant="tonal"
                icon="mdi-refresh"
                @click="getMyTeamUpsData"
                :loading="loading">
            </v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <!-- 组队卡片列表 S -->
    <div v-if="pagedList && pagedList.length > 0" class="d-flex flex-column ga-3">
      <v-card
          v-for="(i, index) in pagedList"
          :key="index"
          border
          rounded="lg"
          class="pa-4 hover-card transition-all">
        <div class="d-flex align-start justify-between flex-wrap ga-3">
          <div class="flex-grow-1 min-width-0">
            <h3 class="font-weight-bold text-h6 text-amber singe-line mb-2">
              {{ i.description }}
            </h3>

            <div class="d-flex align-center flex-wrap ga-2 text-caption opacity-80 mb-2">
              <span class="d-flex align-center font-weight-medium">
                <v-icon size="16" class="mr-1">mdi-account</v-icon>
                {{ i.player }}
              </span>

              <v-divider vertical class="mx-1"></v-divider>

              <span class="d-flex align-center opacity-60">
                <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                {{ i.createdTime || '—' }}
              </span>
            </div>

            <!-- 标签列表 -->
            <div class="d-flex align-center flex-wrap ga-1" v-if="i.tags && i.tags.length > 0">
              <v-chip
                  v-for="(tag, tagIndex) in i.tags"
                  :key="tagIndex"
                  size="x-small"
                  variant="tonal"
                  color="amber">
                {{ tag }}
              </v-chip>
            </div>
          </div>

          <div class="d-flex align-center ga-2 flex-shrink-0">
            <v-btn
                size="small"
                variant="tonal"
                color="amber"
                prepend-icon="mdi-arrow-right"
                to="/team">
              {{ t('team.title') }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    <!-- 组队卡片列表 E -->

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>

    <!-- 分页 S -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination
          v-model="currentPage"
          :length="totalPages"
          density="comfortable"
          active-color="amber"
          rounded="circle"
          variant="tonal">
      </v-pagination>
    </div>
    <!-- 分页 E -->
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}
</style>
