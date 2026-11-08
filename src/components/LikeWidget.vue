<script setup lang="ts">
import {useLikeStore} from '~/stores/likeStore.js';
import {computed, onMounted, ref, useSlots, watch} from 'vue';
import Loading from "./Loading.vue";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore.js";
import {handleApiError} from "@/assets/sripts/error_handler";

const props = defineProps({
  class: String,
  isShowCount: Boolean,
  targetType: String,             // 如 'assembly', 'comment', 'teamUp', 'mod' , 'material'
  targetId: String,               // 对应内容的ID
  userId: String,                 // 当前用户ID
}),
    emit = defineEmits(['change'])

watch(() => props.targetId, () => {
  onReady()
}, {deep: true})

onMounted(() => {
  onReady()
})

const likeStore = useLikeStore(),
    slot = useSlots(),
    {t} = useI18n(),
    notice = useNoticeStore()

let isLiked = ref(false),
    likeCount = ref(0),
    likeLoading = ref(false)

/**
 * 校验目标类型与目标ID是否有效，拦截 null/undefined 伪造字符串与空值
 */
const isValidTarget = computed(() => {
  const t = String(props.targetType || '').trim().toLowerCase();
  const id = String(props.targetId || '').trim().toLowerCase();
  return Boolean(
    t &&
    t !== 'null' &&
    t !== 'undefined' &&
    id &&
    id !== 'null' &&
    id !== 'undefined'
  );
});

/**
 * 初始化检查点赞状态
 * @returns {Promise<void>}
 */
const onReady = async () => {
  try {
    if (!isValidTarget.value) {
      return;
    }

    likeLoading.value = true;

    isLiked.value = await likeStore.checkLike(props.targetType!, props.targetId!)
    likeCount.value = await likeStore.getLikeCount(props.targetType!, props.targetId!)

    emit('change', { isLiked: isLiked.value, likeCount: likeCount.value })
  } catch (e) {
    handleApiError(e, notice, t, { component: 'LikeWidget' })
  } finally {
    likeLoading.value = false;
  }
}

/**
 * 点赞/取消点赞
 * @returns {Promise<void>}
 */
const handleLike = async () => {
  try {
    if (!isValidTarget.value) {
      return;
    }

    likeLoading.value = true;

    isLiked.value = await likeStore.toggleLike(props.userId || '', props.targetType!, props.targetId!)
    likeCount.value = await likeStore.getLikeCount(props.targetType!, props.targetId!)
    
    emit('change', { isLiked: isLiked.value, likeCount: likeCount.value })
  } catch (e) {
    handleApiError(e, notice, t, { component: 'LikeWidget' })
  } finally {
    likeLoading.value = false;
  }
};

defineOptions({
  name: 'LikeWidget'
})
</script>

<template>
  <div @click="handleLike" :class="props.class">
    <v-btn v-if="likeLoading" icon>
      <Loading size="25px"></Loading>
    </v-btn>
    <template v-if="!likeLoading">
      <template v-if="isLiked">
        <slot name="activate"></slot>
      </template>
      <template v-else>
        <slot name="unActivate"></slot>
      </template>
    </template>
    <template v-if="props.isShowCount">
      <span class="ml-1">
        {{ likeCount }}
      </span>
    </template>
  </div>
</template>
