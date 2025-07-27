<script setup>
import {useLikeStore} from '../../stores/likeStore';
import {ref, useSlots, watch} from 'vue';
import Loading from "./Loading.vue";
import {useI18n} from "vue-i18n";

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
    messages.value.push(t(`basic.tips.${'like.error'.replaceAll('.', '_')}`, {
      context: e.message || ''
    }))
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
    messages.value.push(t(`basic.tips.${'like.error'.replaceAll('.', '_')}`, {
      context: e.message || ''
    }))
  } finally {
    likeLoading.value = false;
  }
};
</script>

<template>
  <div @click="handleLike">
    <Loading size="25px" v-if="likeLoading"></Loading>
    <template v-else>
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
