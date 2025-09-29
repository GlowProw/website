<script setup>
import {useLikeStore} from '~/stores/likeStore.js';
import {onMounted, ref, useSlots, watch} from 'vue';
import Loading from "./Loading.vue";
import {useI18n} from "vue-i18n";
import {AxiosError} from "axios";
import {useNoticeStore} from "~/stores/noticeStore.js";

const props = defineProps({
  class: String,
  isShowCount: Boolean,
  targetType: String,             // 如 'assembly', 'comment', 'teamUp', 'mod' , 'material'
  targetId: String,               // 对应内容的ID
  userId: String,                 // 当前用户ID
});

watch(props.targetId, () => {
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
 * 初始化检查点赞状态
 * @returns {Promise<void>}
 */
const onReady = async () => {
  try {
    if (!props.userId || !props.targetType || !props.targetId) {
      console.log('not id', props)
      return ;
    }

    likeLoading.value = true;

    isLiked.value = await likeStore.checkLike(props.userId, props.targetType, props.targetId);
    likeCount.value = await likeStore.getLikeCount(props.targetType, props.targetId);
  } catch (e) {
    if (e instanceof AxiosError)
      notice.error({
        text: t(`basic.tips.${e.response.data.code}`, {
          context: e instanceof AxiosError ? e.response.data.code : e.code || e.message || ''
        }),
        color: 'error'
      })
    console.error(e)
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
    if (e instanceof AxiosError)
      notice.error({
        text: t(`basic.tips.${e.response.data.code}`, {
          context: e instanceof AxiosError ? e.response.data.code : e.code || e.message || ''
        }),
        color: 'error'
      })
    console.error(e)
  } finally {
    likeLoading.value = false;
  }
};
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
