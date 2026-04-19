<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {number} from "@/assets/sripts/index"

const {asString, asArray, sanitizeString, tm} = useI18nUtils()

const {t, te, locale} = useI18n(),
    route = useRoute(),
    props = withDefaults(defineProps<{ data: any }>(), {
      data: null
    }),
    unwatch = watch(
        () => locale.value,
        async () => {
        },
        {immediate: true}
    )

onUnmounted(() => unwatch())

/**
 * 获取词条名
 * @param key
 */
const getTitle = (key: string) => {
  const perksName = sanitizeString(key)

  let keys = [
        `snb.perks.${key}.name`,
        `snb.perks.${perksName.cleaned}.name`
      ],
      lv = perksName.removedNumbers[0];

  if (!asString(keys))
    return ''

  return `${asString(keys)}${number.intToRoman(Number.parseInt(lv))}` || '';
}

/**
 * 获取词条描述内容
 */
const getDescription = (key: any) => {
  const perksName = sanitizeString(key)
  let keys = []

  switch (props.data?.type) {
    case "shipUpgrade":
      keys = [
        `snb.perks.${perksName.cleaned}.description.${props.data?.tier}`,
        `snb.perks.${perksName.cleaned}.description.general`,
      ]

      return asArray(keys)
    default:
      keys = [
        `snb.perks.${key}.description.general`,
        `snb.perks.${perksName.cleaned}.description.general`,
        `snb.perks.${perksName.cleaned}.description.${perksName.removedNumbers[0]}`
      ]

      return asArray(keys)
  }
}

defineOptions({
  name: "PerksWidget"
})
</script>

<template>
  <v-card class="bg-translate" variant="text" border>
    <template v-if="props.data.perks && props.data.perks.length > 0">
      <div v-for="(p, pIndex) in props.data.perks" :key="pIndex" class="mb-3">
        <!-- 词条标题 S -->
        <v-row no-gutters
               style="width: calc(100% + 18px * 2);margin: 0 0 0 -20px"
               class="bg-black title-long-flavor py-2 pl-10"
               v-if="getTitle(p).length > 0">
          <v-col cols="11">
            <v-row no-gutters class="d-flex text-pre-wrap font-weight-bold">
              <v-col>
                <b class="text-amber">{{ getTitle(p) }}</b>
                <template v-if="route.query.debug">
                  - {{ p }}
                </template>
              </v-col>
              <v-col cols="auto">
                <v-icon icon="mdi-identifier" v-tooltip="p"></v-icon>
              </v-col>
            </v-row>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>
        <!-- 词条标题 E -->

        <!-- 词条描述 S -->
        <p class="opacity-80 text-pre-wrap mt-3 pl-5 pr-5" v-for="(pPkey, pIndex) in getDescription(p)" :key="pIndex">
          {{ pPkey }}
        </p>
        <!-- 词条描述 E -->
      </div>
    </template>
    <template v-else>
      <EmptyView></EmptyView>
    </template>
  </v-card>
</template>

<style scoped lang="less">

</style>
