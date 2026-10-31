<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {useAssetsStore} from "~/stores/assetsStore";
import {useDisplay} from "vuetify/framework";

const props = withDefaults(defineProps<{
  cardWidth?: number;
  cardHeight?: number;
  count?: number;
}>(), {
  cardWidth: 300,
  cardHeight: 575,
  count: 5
});

const images = import.meta.glob('@/assets/images/apps/qqBot/*', {eager: true});
const {serializationMap} = useAssetsStore();
const {mobile} = useDisplay()

const contentImages = ref<Record<string, string>>({});

let size = ref({
  width: 300,
  height: 575,
})

watch(() => mobile.value, () => {
  if (mobile.value) {
    size.value.width = props.cardWidth / 1.5;
    size.value.height = props.cardHeight / 1.5;
  } else {
    size.value.width = props.cardWidth;
    size.value.height = props.cardHeight;
  }
})

onMounted(() => {
  contentImages.value = serializationMap(images);
});

const getUseImage = (id: string) => {
  return contentImages.value[`use_${id}`];
};

defineOptions({
  name: "QQBotShowcaseWidget"
});
</script>

<template>
  <div class="qq-bot-showcase-widget">
    <HorizontalScrollList :forceDraggable="true" :showControls="true" :isIndicator="false">
      <v-card
          border
          :width="size.width"
          :height="size.height"
          class="bg-black qq-bot-show-card"
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
