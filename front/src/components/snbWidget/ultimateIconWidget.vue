<script setup lang="ts">
import {Ultimates} from "glow-prow-data"
import {onMounted, ref} from "vue";

const ultimateImages = import.meta.glob('@glow-prow-assets/ultimates/*.*', {eager: true});
const props = withDefaults(defineProps<{
  id: string,
  isClickOpenDetail?: boolean,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  padding?: number
}>(), {
  id: 'dhow',
  isClickOpenDetail: true,
  isShowOpenDetail: true,
  isShowDescription: true,
  padding: 3
})

let ultimatesData = ref({
  images: {},
  panel: {},
  model: {}
});

onMounted(() => {
  onReady()
})

const onReady = async () => {
  for (let key in Ultimates) {
    const imageKey = `/node_modules/glow-prow-assets/ultimates/${key}.webp`;

    ultimatesData.value.panel[key] = 0;
    ultimatesData.value.model[key] = false;

    if (ultimateImages[imageKey]) {
      ultimatesData.value.images[key] = ultimateImages[imageKey].default;
    } else {
      ultimatesData.value.images[key] = '';
    }
  }
}
</script>

<template>
  <v-tooltip
      v-model="ultimatesData.model[props.id]"
      min-width="450"
      max-width="450"
      interactive
      :offset="[30,10]"
      location="right top"
      content-class="pa-0" target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          tile
          border
          variant="text"
          :to="isClickOpenDetail ? `/codex/ultimate/${id}` : ''"
          :class="`pa-${props.padding} cursor-pointer`"
          height="100%"
          width="100%">
        <v-img :src="ultimatesData.images[props.id]" class="pointer-events-none"></v-img>
      </v-card>
    </template>
  </v-tooltip>
</template>

<style scoped lang="less">

</style>
