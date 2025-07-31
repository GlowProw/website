<script setup>
import {useLikeStore} from '~/stores/likeStore.js';
import {ref, useSlots, watch} from 'vue';
import Loading from "./Loading.vue";
import {useI18n} from "vue-i18n";
import {AxiosError} from "axios";

const props = defineProps({
  targetType: String,             // 如 'assembly', 'comment', 'teamUp'
  targetId: String,               // 对应内容的ID
  userId: String,                 // 当前用户ID
});

watch(() => props.targetId, () => {
  onReady()
})

const likeStore = useLikeStore(),
    slot = useSlots(),
    {t} = useI18n()

let isLiked = ref(false),
    likeCount = ref(0),
    likeLoading = ref(false),
    messages = ref([])

/**
 * 初始化检查点赞状态
 * @returns {Promise<void>}
 */
const onReady = async () => {
  try {
    likeLoading.value = true;

    isLiked.value = await likeStore.checkLike(props.userId, props.targetType, props.targetId);
    likeCount.value = await likeStore.getLikeCount(props.targetType, props.targetId);
  } catch (e) {
    console.error(e)
    messages.value.push({
      text: t(`basic.tips.${e.response.data.code}`, {
        context: e instanceof AxiosError ? e.response.data.code : e.code ||  e.message || ''
      }),
      color: 'error'
    })
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
    likeLoading.value = true;

    isLiked.value = await likeStore.toggleLike(props.userId, props.targetType, props.targetId);
    likeCount.value = await likeStore.getLikeCount(props.targetType, props.targetId);
  } catch (e) {
    console.error(e)
    messages.value.push({
      text: t(`basic.tips.${e.response.data.code}`, {
        context: e instanceof AxiosError ? e.response.data.code : e.code ||  e.message || ''
      }),
      color: 'error'
    })
  } finally {
    likeLoading.value = false;
  }
};
</script>

<template>
  <div @click="handleLike">
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
  </div>
  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>
