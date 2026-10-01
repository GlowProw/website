<script setup lang="ts">
import {onMounted, ref} from "vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {useAssetsStore} from "~/stores/assetsStore";

const props = withDefaults(defineProps<{
  cardWidth?: number | string;
  cardHeight?: number | string;
  count?: number;
}>(), {
  cardWidth: 300,
  cardHeight: 575,
  count: 5
});

const images = import.meta.glob('@/assets/images/apps/qqBot/*', {eager: true});
const {serializationMap} = useAssetsStore();

const contentImages = ref<Record<string, string>>({});

onMounted(() => {
  contentImages.value = serializationMap(images);
});

const getUseImage = (id: string) => {
  return contentImages.value[`use_${id}`];
};

defineOptions({name: "QQBotShowcaseWidget"});
</script>

<template>
  <div class="qq-bot-showcase-widget">
    <HorizontalScrollList :forceDraggable="true" :showControls="true">
      <v-card
          border
          :width="props.cardWidth"
          :height="props.cardHeight"
          class="bg-black qq-bot-show-card mx-2"
          v-for="i in props.count"
          :key="i">
        <v-img height="100%" :src="getUseImage(String(i))"/>
      </v-card>
    </HorizontalScrollList>
  </div>
</template>

<style scoped lang="less">
.qq-bot-showcase-widget {
  width: 100%;
  position: relative;
}

.qq-bot-show-card {
  border-radius: 8px;
  overflow: hidden;
  user-select: none;
}
</style>
