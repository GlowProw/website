<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts/index";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import Textarea from "@/components/textarea/index.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n(),
    notice = useNoticeStore()

let loading = ref(false),
    userCommentData = ref<any>({}),
    filterType = ref('all'),
    currentPage = ref(1),
    pageSize = 8

onMounted(() => {
  getMyCommentsData()
})

/**
 * 获取我的评论数据
 */
const getMyCommentsData = async () => {
  try {
    loading.value = true;
    const result = await apis.userApi().getUserComments(),
        d = result.data

    userCommentData.value = d.data || {data: []};
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MyComments'})
  } finally {
    loading.value = false;
  }
}

const allComments = computed(() => {
  return userCommentData.value?.data || []
})

const filteredList = computed(() => {
  if (filterType.value === 'all') return allComments.value
  return allComments.value.filter((i: any) => i.targetType === filterType.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

defineOptions({
  name: 'AccountComments'
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
          <v-btn-toggle
              v-model="filterType"
              density="compact"
              variant="outlined"
              color="amber"
              mandatory>
            <v-btn value="all" size="small">{{ t('basic.all') }} ({{ allComments.length }})</v-btn>
            <v-btn value="item" size="small">{{ t('codex.items.title') }}</v-btn>
            <v-btn value="ship" size="small">{{ t('codex.ships.title')}}</v-btn>
          </v-btn-toggle>

          <v-spacer></v-spacer>

          <!-- 行为按钮组 -->
          <div class="d-flex align-center ga-2">
            <v-btn
                size="small"
                variant="tonal"
                icon="mdi-refresh"
                @click="getMyCommentsData"
                :loading="loading">
            </v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <!-- 评论列表展示 S -->
    <div v-if="pagedList && pagedList.length > 0" class="d-flex flex-column ga-3">
      <v-card
          v-for="(i, index) in pagedList"
          :key="index"
          border
          rounded="lg"
          class="pa-4 hover-card transition-all">
        <div class="d-flex align-start">
          <!-- 目标实体图标插槽 -->
          <div class="mr-4 flex-shrink-0">
            <template v-if="i.targetType === 'item'">
              <ItemSlotBase size="60px">
                <ItemIconWidget :id="i.targetId"></ItemIconWidget>
              </ItemSlotBase>
            </template>
            <template v-else-if="i.targetType === 'ship'">
              <ItemSlotBase size="60px">
                <ShipIconWidget :id="i.targetId"></ShipIconWidget>
              </ItemSlotBase>
            </template>
            <template v-else>
              <v-avatar size="60" rounded="lg">
                <v-icon icon="mdi-comment-outline" size="28" color="amber"></v-icon>
              </v-avatar>
            </template>
          </div>

          <!-- 评论内容主体 -->
          <div class="flex-grow-1 min-width-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="amber" variant="tonal" class="text-uppercase font-weight-bold">
                {{ i.targetType || 'TARGET' }}
              </v-chip>
              <span class="text-caption opacity-60">ID: {{ i.targetId }}</span>
              <span v-if="i.createTime" class="text-caption opacity-40 ml-auto">{{ i.createTime }}</span>
            </div>

            <div class="text-body-1 comment-content mb-2">
              <Textarea readonly :value="i.content"></Textarea>
            </div>
          </div>

          <!-- 右侧操作栏 -->
          <div class="ml-4 flex-shrink-0">
            <v-tooltip :text="t('basic.button.view') || '前往查看'" location="top">
              <template v-slot:activator="{props}">
                <v-btn
                    v-bind="props"
                    size="small"
                    variant="tonal"
                    color="amber"
                    icon="mdi-open-in-new"
                    :to="`/codex/${i.targetType}/${i.targetId}`"
                    target="_blank">
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </div>
      </v-card>
    </div>
    <!-- 评论列表展示 E -->

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>

    <!-- 统一分页器 S -->
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
    <!-- 统一分页器 E -->
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}

.comment-content {
  line-height: 1.6;
  word-break: break-word;
}
</style>
