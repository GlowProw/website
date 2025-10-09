<script setup lang="ts">

import ZoomableCanvas from "@/components/ZoomableCanvas.vue";
import RankingDesignedView from "@/components/RankingDesignedView.vue";
import {computed, nextTick, onMounted, Ref, ref, useAttrs} from "vue";
import {useDisplay} from "vuetify/framework";

const
    props = defineProps<{readonly: boolean}>(),
    {mobile} = useDisplay(),
    attrs = useAttrs(),
    emit = defineEmits(['update:item-change', 'ready'])

let isWorkshopFillScreen = ref(false),
    workshopHeight = ref(700),
    zoomableAreaRef: Ref<ZoomableCanvas> = ref(null),
    rankingDesignedView: Ref<RankingDesignedView> = ref(null),
    hasReadyEvent = computed(() => !!attrs.onReady),
    refs = ref({
      zoomableAreaRef: null,
      rankingDesignedRef: null
    })

onMounted(() => {
  nextTick(() => {
    refs.value = {
      zoomableAreaRef: zoomableAreaRef.value,
      rankingDesignedRef: rankingDesignedView.value,
    };

    if (hasReadyEvent)
      emit('ready', refs)
  });
});

defineExpose({
  refs,
});
</script>

<template>
  <ZoomableCanvas
      ref="zoomableAreaRef"
      :style="isWorkshopFillScreen ? 'height: calc(100vh - 50px)' : `height: ${mobile ? 300 : workshopHeight}px`"
      :min-scale="mobile ? .1 : .8"
      :max-scale="1.4"
      :default-scale="mobile ? .4 : 1"
      :is-show-tool="tab == 'assembly'"
      :boundary="mobile ? {
                left: -100,
                right: 100,
                top: -100,
                bottom: 100
              } : {
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
    <RankingDesignedView ref="rankingDesignedView" :readonly="readonly"></RankingDesignedView>
  </ZoomableCanvas>
</template>

<style scoped lang="less">

</style>
