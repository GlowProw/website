<script setup lang="ts">
import {useI18n} from "vue-i18n";
import type {Season} from "@skullandbonestools/snbdata/dist/daos/seasons";

const props = defineProps<{ data: any, currentlySeason: Season }>(),
    {t, te} = useI18n()

/**
 * 检查翻译
 * @param key
 */
const onCheckI18nValue = (key) => {
  if (te(key)) {
    return {code: 0, value: t(key)};
  } else {
    return {code: -1}
  }
};
</script>

<template>
  <v-card max-width="420" min-width="420" class="pa-2 mb-2 background-flavor">
    <v-card border color="hsl(from var(--main-color) h s calc(l * 0.3))">
      <template v-slot:image>
        <img class="pointer-events-none" src="../../assets/images/portal-banner-background.png">
      </template>
      <template v-slot:title>
        <v-row class="text-lg-body-1" style="min-height: 60px">
          <v-col>
            <v-icon icon="mdi-calendar-badge"></v-icon>
          </v-col>
          <v-col align="right">
            <slot name="header-right-btn"></slot>
          </v-col>
        </v-row>
      </template>

      <div class="bg-black pa-5 background-flavor pointer-events-none" v-if="data && data.id">
        <p class="text-amber text-h5"><b> {{ t(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.name`) }}</b></p>

        <p class="text-pre-wrap mt-1 opacity-80">
          <template v-if="onCheckI18nValue(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.description`).code == 0">
            {{ t(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.description`) }}
          </template>
        </p>
      </div>
    </v-card>
  </v-card>
</template>

<style scoped lang="less">

</style>
