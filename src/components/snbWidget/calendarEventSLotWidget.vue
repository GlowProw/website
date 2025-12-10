<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Season} from "glow-prow-data";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {computed} from "vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";

const props = withDefaults(
        defineProps<{ data: any, currentlySeason: Season, showDropped?: boolean }>(),
        {
          showDropped: true
        }
    ),
    {t, te} = useI18n()

let showItemCount = 3,
    droppedCount = computed(() => Object.keys(props.data.droppeds).length || 0)

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
        <img class="pointer-events-none" src="@/assets/images/portal-banner-background.png">
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

      <div class="bg-black pa-5 background-flavor" v-if="data && data.id">
        <template v-if="props.currentlySeason && props.currentlySeason.id && data && data.id">
          <p class="text-amber text-h5 pointer-events-none"><b> {{ t(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.name`) }}</b></p>
        </template>

        <p class="text-pre-wrap mt-1 opacity-80 pointer-events-none">
          <template v-if="props.currentlySeason && props.currentlySeason.id && onCheckI18nValue(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.description`).code == 0">
            {{ t(`snb.calendar.${props.currentlySeason.id}.data.${data.id}.description`) }}
          </template>
        </p>

        <div class="mt-3 d-flex ga-2" v-if="data.droppeds && showDropped">
          <ItemSlotBase size="50px" class="d-flex justify-center align-center" v-for="(i, index) in Object.entries(data.droppeds).slice(0,showItemCount)" :key="index">
            <template v-if="i[1].category == 'item' && !i[1].isUnknown">
              <ItemIconWidget :padding="0" :margin="0" :id="i[0]"></ItemIconWidget>
            </template>
            <template v-else-if="i[1].category == 'material' && !i[1].isUnknown">
              <MaterialIconWidget :padding="0" :margin="0" :id="i[0]"></MaterialIconWidget>
            </template>
            <template v-else-if="i[1].category == 'cosmetic' && !i[1].isUnknown">
              <CosmeticIconWidget :padding="0" :margin="0" :id="i[0]"></CosmeticIconWidget>
            </template>
            <template v-else>
              <v-icon>mdi-help</v-icon>
            </template>
          </ItemSlotBase>

          <ItemSlotBase size="50px" class="d-flex justify-center align-center" v-if="droppedCount > showItemCount">
            +{{ droppedCount - showItemCount }}
          </ItemSlotBase>
        </div>
      </div>
    </v-card>
  </v-card>
</template>

<style scoped lang="less">

</style>
