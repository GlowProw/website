<script setup lang="ts">
import {Ultimates} from "glow-prow-data"
import {computed, onMounted, ref} from "vue";
import {useAppStore} from "~/stores/appStore";

const ultimateImages = import.meta.glob('@glow-prow-assets/ultimates/*.*', {eager: true})
const props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowOpenDetail: true,
      isShowDescription: true,
      margin: 1,
      padding: 1
    }),
    appStore = useAppStore()

let ultimatesData = ref({
      images: {},
      panel: {},
      model: {}
    }),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

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
          :to="isOpenDetail ? `/codex/ultimate/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
          ]">
        <v-img :src="ultimatesData.images[props.id]" class="pointer-events-none"></v-img>
      </v-card>
    </template>
  </v-tooltip>
</template>

<style scoped lang="less">

</style>
