<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {useI18n} from "vue-i18n";
import {i18n} from "../../assets/sripts";

const {t, tm, te} = useI18n()

const props = withDefaults(defineProps<{ data }>(), {
  data: null
})

/**
 * 获取词条名
 * @param p
 */
const getTitle = (p) => {
  let keys = [
        `snb.items.${p}.name`,
        `snb.perks.${p}.name`,
        `snb.perks.${i18n.sanitizeString(p).cleaned}.name`
      ];

  return i18n.asString(keys);
}

/**
 * 获取词条描述内容
 */
const getDescription = (key) => {
  const perksName = i18n.sanitizeString(key);

  return i18n.asArray([
    `snb.perks.${perksName.cleaned}.description`,
    `snb.perks.${perksName.cleaned}.description.general`,
  ])
}
</script>

<template>
  <v-card class="mt-4 background-flavor" border>
    <template v-if="props.data.perks && props.data.perks.length > 0">
      <div v-for="(p, pIndex) in props.data.perks" :key="pIndex" class="mt-4 mb-5">
        <v-row no-gutters
               style="width: calc(100% + 18px * 2);margin: -18px 0 0 -20px"
               class="bg-black text-amber title-long-flavor pt-5 pb-5 pl-10"
               v-if="getTitle(p).length > 0">
          <v-col cols="8">
            <p class=" text-pre-wrap font-weight-bold"><b>{{ getTitle(p) }}</b> - {{ p }}</p>
          </v-col>
          <v-spacer></v-spacer>
          <div class="pr-8">

          </div>
        </v-row>
        <p class="opacity-80 text-pre-wrap mt-3 pl-5" v-for="(pPkey, pPIndex) in getDescription(p)" :key="pIndex">
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
