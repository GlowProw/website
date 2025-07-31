<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18nUtil.ts";
import {onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";

const {asArray, asString, sanitizeString} = useI18nUtils()

const {t, te, locale} = useI18n(),
    route = useRoute(),
    props = withDefaults(defineProps<{ data }>(), {
      data: null
    }),
    unwatch = watch(
        () => locale.value,
        async (newVal) => {
          console.log('语言已切换至:', newVal)
        },
        {immediate: true}
    )

let v = ref(1);

onUnmounted(() => unwatch()) // 手动停止监听

/**
 * 获取词条名
 * @param key
 */
const getTitle = (key) => {
  let keys = [
    `snb.perks.${sanitizeString(key).cleaned}.name`
  ];

  return asArray(keys)[0] || '';
}

/**
 * 获取词条描述内容
 */
const getDescription = (key) => {
  const perksName = sanitizeString(key);
  let keys = []

  if (props.data.type == "shipUpgrade") {
    keys = [
      `snb.perks.${perksName.cleaned}.description.${props.data.tier}`,
      `snb.perks.${perksName.cleaned}.description.general`,
    ]
  } else {
    let tString: any = [
      `snb.items.${perksName.cleaned}.name`,
      `snb.perks.${perksName.cleaned}.name`,
      `snb.perks.${perksName.cleaned}.description.${perksName.removedNumbers[0]}`,
    ];

    for (let tKey: any of tString) {
      if (te(tKey)) {
        keys = [
          `snb.perks.${key}.description.general`,
          `snb.perks.${perksName.cleaned}.description.general`,
          `snb.perks.${perksName.cleaned}.description.${perksName.removedNumbers[0]}`,
        ]
      }
    }
  }

  return asArray(keys)
}
</script>

<template>
  <v-card class="mt-4 background-flavor" border>
    <template v-if="props.data.perks && props.data.perks.length > 0">
      <div v-for="(p, pIndex) in props.data.perks" :key="pIndex" class="mb-5">
        <v-row no-gutters
               style="width: calc(100% + 18px * 2);margin: 0 0 0 -20px"
               class="bg-black text-amber title-long-flavor pt-5 pb-5 pl-10"
               v-if="getTitle(p).length > 0">
          <v-col cols="8">
            <p class=" text-pre-wrap font-weight-bold"><b>{{ getTitle(p) }}</b>
              <template v-if="route.query.debug">
                - {{ p }}
              </template>
            </p>
          </v-col>
          <v-spacer></v-spacer>
          <div class="pr-8">

          </div>
        </v-row>
        <p class="opacity-80 text-pre-wrap mt-3 pl-5 pr-5" v-for="(pPkey, pPIndex) in getDescription(p)" :key="pIndex">
          {{ pPkey }}
        </p>
      </div>
    </template>
    <template v-else>
      <EmptyView></EmptyView>
    </template>
  </v-card>
</template>

<style scoped lang="less">

</style>
