<script setup lang="ts">


import {onMounted, ref} from "vue";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "./ItemSlotBase.vue";
import router from "../../../router";
import {useRoute} from "vue-router";

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
      id: null,
      type: null
    }),
    route = useRoute(),
    {t} = useI18n()

let modData = ref({}),
    modIconImages = ref({}),
    showType = ref('1')

onMounted(() => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady();
})

const onReady = () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = modImages[path];
  }

  // mod图标
  for (let key in Modifications) {
    if (imageMap[key]) {
      modIconImages.value[key] = imageMap[key].default;
    }
  }

  // 插槽图标
  for (let key in modData.value) {
    if (imageMap[key]) {
      modIconImages.value[key] = imageMap[key].default;
    }
  }
}

/**
 * 初始化分类表
 * 以grade创建
 * @param data
 */
const onCategorizeByGrade = (data): {} => {
  const result = {};

  Object.values(data).forEach(item => {
    if (props.type) {
      const hasMatchingVariant = item.variants.some(variant =>
          variant.itemType.includes(props.type)
      );

      if (!hasMatchingVariant) return; // 不匹配则跳过
    }

    if (!result[item.grade]) {
      result[item.grade] = [];
    }
    result[item.grade].push(item);
  });

  return result;
}

/**
 * 模组是否可用
 */
const onIsModPossibleSlot = (data) => {
  for (const i of data.variants) {
    // console.log(props.type, i.itemType,i.itemType.indexOf(props.type))
    if (i.itemType.indexOf(props.type) > 0)
      return true;
  }
  return false;
}
</script>

<template>
  <v-card v-for="(key, value) in modData" :key="key">
    <v-row class="pl-5 pr-3 pt-2 title-long-flavor bg-black" align="center">
      <v-col>
        <img :src="modIconImages[value]" class="mt-1" width="25px" height="25px">
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        <v-btn-toggle v-model="showType" density="compact" mandatory selected-class="bg-amber">
          <v-btn value="0">
            <v-icon>mdi-format-list-bulleted-type</v-icon>
          </v-btn>

          <v-btn value="1">
            <v-icon>mdi-dots-grid</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row class="pl-5 pr-5 pb-5">
      <v-col v-for="(mod, modIndex) in key" :key="modIndex" :cols="{0: '12', 1: '2'}[showType]" v-show="onIsModPossibleSlot(mod)">
        <template v-if="route.query.debug">{{mod}}</template>
        <template v-if="showType == 1">
          <ItemSlotBase size="80">
            <v-img :src="modIconImages[mod.id]" width="100%" height="100%"></v-img>
          </ItemSlotBase>
        </template>
        <template v-else-if="showType == 0">
          <v-row>
            <v-col cols="3">
              <ItemSlotBase size="20">
                <v-img :src="modIconImages[mod.id]"></v-img>
              </ItemSlotBase>
            </v-col>
            <v-col cols="9">
              <b>{{ t(`snb.modifications.${mod.id}.name`) }}</b>
              <div v-for="(v, vIndex) in mod.variants" :key="vIndex">
                {{ t(`snb.modifications.${mod.id}.description`, {range: v.range}) }}
              </div>
            </v-col>
          </v-row>
        </template>


      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped lang="less">

</style>
