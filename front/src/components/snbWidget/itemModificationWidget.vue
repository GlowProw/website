<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "./ItemSlotBase.vue";
import router from "~/router";
import {useRoute} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
      id: null,
      type: null
    }),
    route = useRoute(),
    {t} = useI18n(),
    {asString} = useI18nUtils()

let modData = ref({}),
    // 模组图标
    modIcons = ref({}),
    // 模式显示类型
    displayMode = ref(1),
    // 是否含模组
    isHasMod = computed(() => {
      return Object.keys(modData.value).length > 0
    })

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
    displayMode.value = route.query.modeShowType as string;

  // mod图标
  for (let key in Modifications) {
    if (imageMap[key]) {
      modIcons.value[key] = imageMap[key].default;
    }
  }

  // 插槽图标
  for (let key in modData.value) {
    if (imageMap[key]) {
      modIcons.value[key] = imageMap[key].default;
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
 * 模组展示方式切换
 */
const onSwitchModShow = () => {
  router.push({
    name: route.name,
    query: {...route.query, 'modeShowType': displayMode.value},
    params: {...route.params}
  })
}

</script>

<template>
  <slot name="title" v-if="isHasMod"></slot>
  <v-card border class="mod pt-3" v-if="isHasMod" variant="flat">
    <template v-for="(key, value) in modData" :key="key">
      <v-row class="px-5 title-long-flavor bg-black" align="center">
        <v-col cols="auto">
          <v-img :src="modIcons[value]" class="mt-1" width="25px" height="25px"/>
        </v-col>
        <v-col>
          {{ t(`assembly.tags.grade.${value}`) }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col align="right">
          <v-btn-toggle v-model="displayMode"
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
               :class="`grade-${mod.grade}`"
               :key="modIndex"
               :cols="{0: '12', 1: '1'}[displayMode]">
          <template v-if="route.query.debug">{{ mod }}</template>
          <template v-if="displayMode == 1">
            <ItemSlotBase size="40px" class="d-flex justify-center align-center" v-tooltip="t(`snb.modifications.${mod.id}.name`) ">
              <v-img :src="modIcons[mod.id]" width="100%" height="100%" v-if="modIcons[mod.id]"></v-img>
              <template v-else>
                <v-icon>mdi-help</v-icon>
              </template>
            </ItemSlotBase>
          </template>
          <template v-else-if="displayMode == 0">
            <v-row class="pt-0 pl-3">
              <ItemSlotBase size="50px" class="mt-3 d-flex justify-center align-center">
                <v-img :src="modIcons[mod.id]" v-if="modIcons[mod.id]"></v-img>
                <template v-else>
                  <v-icon>mdi-help</v-icon>
                </template>
              </ItemSlotBase>

              <v-col cols="10">
                <ModName :id="mod.id" :grade="mod.grade"></ModName>
                <ModDescription :id="mod.id" :variants="mod.variants" :grade="mod.grade" :type="type"></ModDescription>
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
