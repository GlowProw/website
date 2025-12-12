<script setup lang="ts">
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import {onMounted, ref} from "vue";
import {Item} from "glow-prow-data";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = defineProps<{ itemData: Item, modData: [] }>()

let modIconImages = ref({}),
    modStyleConfig = {
      'basic': 'rgba(208,255,208,0.14)',
      'advanced': 'rgba(187,220,255,0.14)',
      'special': 'rgba(249,235,255,0.14)'
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
    imageMap[key] = modImages[path].default;
  }
  modIconImages.value = imageMap;
}
</script>

<template>
  <div v-for="(mod, modIndex) in modData"
       v-show="mod.value && mod.value.id != null"
       :key="modIndex">
    <v-row no-gutters>
      <v-col cols="auto" class="d-flex justify-center align-center">
        <v-card
            class="pa-1"
            variant="flat"
            :color="modStyleConfig[mod.type]">
          <v-img :src="modIconImages[mod.type]" width="20px" height="20px"/>
        </v-card>
      </v-col>
      <v-col>
        <template v-if="mod.value">
          <v-card tile
                  variant="flat"
                  class="bg-transparent h-100 d-flex align-center">
            <ItemSlotBase size="45px">
              <ModIconWidget :id="mod.value.id"></ModIconWidget>
            </ItemSlotBase>
            <div class="w-100 text-caption">
              <ModName :id="mod.value.id" :grade="mod.value.grade"></ModName>
              <ModDescription :id="mod.value.id" :variants="mod.value.variants" :grade="mod.value.grade" :type="itemData.type"></ModDescription>
            </div>
          </v-card>
        </template>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
</style>
