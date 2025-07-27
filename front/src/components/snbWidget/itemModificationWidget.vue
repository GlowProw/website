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
    {t, te} = useI18n()

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

  if (route.query.modeShowType)
    showType.value = route.query.modeShowType as string;

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
    if (i.itemType.indexOf(props.type) > 0)
      return true;
  }
  return false;
}

/**
 * 模组展示方式切换
 */
const onSwitchModShow = () => {
  router.push({name: route.name, query: {...route.query, 'modeShowType': showType.value}, params: {...route.params}})
}

/**
 * 百分化
 * @param data
 */
const onPercentage = (data: []): [number, number] => {
  return [Math.ceil(data[0] * 100), Math.ceil(data[1] * 100)]
}
</script>

<template>
  <v-card border class="mod">
    <template v-for="(key, value) in modData" :key="key">
      <v-row class="pl-5 pr-5 pr-0 pt-2 title-long-flavor bg-black" align="center">
        <v-col>
          <img :src="modIconImages[value]" class="mt-1" width="25px" height="25px">
        </v-col>
        <v-spacer></v-spacer>
        <v-col align="right">
          <v-btn-toggle v-model="showType"
                        style="height: 25px"
                        @update:model-value="onSwitchModShow"
                        density="compact"
                        mandatory
                        border
                        selected-class="bg-amber">
            <v-btn value="0">
              <v-icon size="20">mdi-format-list-bulleted-type</v-icon>
            </v-btn>

            <v-btn value="1">
              <v-icon>mdi-dots-grid</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-row class="pl-5 pr-5 pb-5">
        <v-col v-for="(mod, modIndex) in key"
               v-show="modIconImages[mod.id]"
               :class="`grade-${mod.grade}`"
               :key="modIndex"
               :cols="{0: '12', 1: '1'}[showType]">
          <template v-if="route.query.debug">{{ mod }}</template>
          <template v-if="showType == 1">
            <ItemSlotBase size="80" v-tooltip="t(`snb.modifications.${mod.id}.name`) ">
              <v-img :src="modIconImages[mod.id] || ''" width="100%" height="100%"></v-img>
            </ItemSlotBase>
          </template>
          <template v-else-if="showType == 0">
            <v-row class="pt-0 pl-3">
              <ItemSlotBase size="50px" class="mt-3">
                <v-img :src="modIconImages[mod.id]"></v-img>
              </ItemSlotBase>
              <v-col cols="10">
                <b :class="`grade-${mod.grade}-title`">{{ t(`snb.modifications.${mod.id}.name`) }}</b>
                <div v-for="(v, vIndex) in mod.variants" :key="vIndex" :class="`grade-${mod.grade}-description`" class="opacity-50 description">
                  <template v-if="te(`snb.modifications.${mod.id}.description`)">
                    {{
                      t(`snb.modifications.${mod.id}.description`, {
                        __: onPercentage(v.range)
                      })
                    }}
                  </template>
                </div>
              </v-col>
            </v-row>
          </template>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<style scoped lang="less">
.mod {
  .description {
    font-size: .9rem;
  }

  .grade-basic {
    .grade-basic-title {
      color: rgba(208, 255, 208, 0.8);
    }
  }

  .grade-advanced {
    .grade-advanced-title {
      color: #bbdcff;
    }
  }

  .grade-special {
    .grade-special-title {
      color: #f9ebff;
    }
  }
}

</style>
