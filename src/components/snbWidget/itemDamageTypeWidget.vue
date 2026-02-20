<script setup lang="ts">
import {computed, nextTick, onMounted, Ref, ref} from "vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";

import EmptyView from "../EmptyView.vue";
import ItemSlotBase from "./ItemSlotBase.vue";
import {Item} from "glow-prow-data";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";

type ItemDamageTypeSize = 'mini' | 'default'

const props = withDefaults(defineProps<{ data: Item | any, iconType?: "aggressivity" | "armor" , sizeType?: ItemDamageTypeSize, size?: number }>(), {
      data: null,
      sizeType: 'default',
      size: 15,
    }),
    {asArray, sanitizeString} = useI18nUtils()

let damageRefStatus: Ref<boolean[]> = ref([]),
    damageIconImages: Ref<any[]> = ref([]),
    isEmpty = computed(() => {
      return damageRefStatus.value.filter((i: any) => i).length <= 0
    })

onMounted(() => {
  onReady()
})

const onReady = () => {
  nextTick(() => {
    if (props.data && props.data.perks) {
      props.data.perks.forEach((i: any) => {
        let key = sanitizeString(i).cleaned;
        damageIconImages.value.push({key})
      })
    }
  })
}

/**
 * 设置ref的回调函数
 * @param d
 * @param index
 */
const setDamageRef = (d: boolean, index: number) => {
  damageRefStatus.value[index] = d;
}
</script>

<template>
  <!-- 默认 -->
  <template v-if="sizeType == 'default'">
    <v-card class="bg-transparent d-flex ga-3">
      <template v-for="(i, index) in damageIconImages"
                :key="index">
        <div v-show="damageRefStatus[index]">
          <ItemSlotBase
              padding="1"
              class="mr-1 d-flex justify-center align-center card-flavor">
            <DamageIconWidget
                :id="i.key"
                :iconType="iconType"
                @readEnd="(d: boolean) => setDamageRef(d, index)"
                size="35"
            ></DamageIconWidget>
          </ItemSlotBase>
        </div>
      </template>
    </v-card>

    <template v-if="isEmpty">
      <v-card class="bg-transparent background-flavor" border>
        <EmptyView></EmptyView>
      </v-card>
    </template>
  </template>

  <!-- 浓缩 无空Widget -->
  <template v-else-if="sizeType == 'mini'">
    <v-card class="bg-transparent d-flex ga-1" v-if="damageIconImages.length > 0">
      <template
          v-for="(i, index) in damageIconImages"
          :key="index">
        <div v-show="damageRefStatus[index]">
          <ItemSlotBase
              padding="0"
              :size="size + 15"
              class="bg-transparent d-flex justify-center align-center card-flavor">
            <DamageIconWidget
                @readEnd="(d: boolean) => setDamageRef(d, index)"
                :id="i.key"
                :iconType="iconType"
                :isBorder="false"
                :size="size"
            ></DamageIconWidget>
          </ItemSlotBase>
        </div>
      </template>
    </v-card>
  </template>
</template>

<style scoped lang="less">

</style>
