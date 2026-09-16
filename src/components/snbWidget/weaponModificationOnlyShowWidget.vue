<script setup lang="ts">
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import {onMounted, ref} from "vue";
import {Item} from "glow-prow-data";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = defineProps<{ itemData: Item, modData: any[] }>()

let modIconImages = ref({}),
    modStyleConfig: Record<string, string> = {
      'basic': 'rgba(208,255,208,0.14)',
      'advanced': 'rgba(187,220,255,0.14)',
      'special': 'rgba(249,235,255,0.14)',
      'mythic': 'rgba(255,183,77,0.14)'
    }

onMounted(() => {
  onReady()
})

const onReady = () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '')
    imageMap[key] = (modImages[path] as any).default;
  }
  modIconImages.value = imageMap;
}

defineOptions({name: 'WeaponModificationOnlyShowWidget'})
</script>

<template>
  <div v-for="(mod, modIndex) in modData"
       v-show="mod.value && mod.value.id != null"
       :key="modIndex">
    <v-row no-gutters dense align="start">
      <v-col cols="auto" class="d-flex justify-center align-center pt-2">
        <RhombusWidget
            :size="28"
            :type="mod?.rarity || (mod?.value ? 'normal' : 'none')"></RhombusWidget>
      </v-col>
      <v-col cols="auto" class="d-flex justify-center align-center">
        <ItemSlotBase size="45px"
                      class="pa-1"
                      :margin="0"
                      :is-auto-size="false">
          <v-card
              class="pa-1 w-100 h-100"
              :color="`color-mix(in srgb, ${modStyleConfig[mod.type]} 5%, #000 95%)`">
            <v-img :src="modIconImages[mod.type]"/>
          </v-card>
        </ItemSlotBase>
        <ItemSlotBase size="45px"
                      :margin="0"
                      :is-auto-size="false">
          <ModIconWidget :id="mod.value.id"></ModIconWidget>
        </ItemSlotBase>
      </v-col>
      <v-col v-if="mod.value">
        <div class="w-100 text-caption">
          <ModName :id="mod.value.id" :grade="mod.value.grade"></ModName>
          <ModDescription class="opacity-50" :id="mod.value.id" :variants="mod.value.variants" :grade="mod.value.grade" :type="itemData.type"></ModDescription>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
</style>
