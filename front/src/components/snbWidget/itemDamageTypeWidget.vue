<script setup lang="ts">
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, nextTick, onMounted, ref, watch} from "vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";

import EmptyView from "../EmptyView.vue";
import ItemSlotBase from "./ItemSlotBase.vue";
import {Item} from "glow-prow-data";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";

type ItemDamageTypeSize = 'mini' | 'default'

const props = withDefaults(defineProps<{ data: Item | any, sizeType?: ItemDamageTypeSize, size?: number }>(), {
      data: null,
      sizeType: 'default',
      size: 15,
    }),
    damageIconImages = ref([]),
    route = useRoute(),
    {t} = useI18n(),
    {asArray, sanitizeString} = useI18nUtils()

let damageRefs = ref<Record<string, any>>([]),
    damageIsShowList = ref<boolean[]>([]),
    isEmpty = computed(() => {
      return damageRefs.value.filter(i => i.isShow).length <= 0
    });

watch(() => damageIconImages.value, (newVal) => {
  if (newVal && newVal.length > 0) {
    nextTick(() => {
      damageIsShowList.value = newVal.map((item, index) => {
        const widget = damageRefs.value[item.key || index];
        return widget?.isShow ?? false;
      });
    });
  }
}, {deep: true});

onMounted(() => {
  onReady()
})

const onReady = () => {
  if (props.data && props.data.perks) {
    props.data.perks.forEach(i => {
      let key = sanitizeString(i).cleaned;
      damageIconImages.value.push({
        key
      });
    })
  }
}

/**
 * 获取属性名
 * @param key
 */
const getTitle = (key) => {
  let keys = [
    `snb.perks.${sanitizeString(key).cleaned}.name`
  ];

  return asArray(keys)[0] || '';
}

/**
 * 设置ref的回调函数
 * @param el
 * @param index
 */
const setDamageRef = (el: any, index: string | number) => {
  if (el) {
    damageRefs.value[index] = el;
  }
}
</script>

<template>
  <!-- 正常 -->
  <template v-if="sizeType == 'default'">
    <v-card class="bg-transparent d-flex ga-3">
      <template v-for="(i, index) in damageIconImages"
                :key="index">
        <div v-show="damageRefs[index] && damageRefs[index]?.isShow || false">
          <ItemSlotBase
              padding="1"
              class="mr-1 d-flex justify-center align-center card-flavor"
              v-tooltip="getTitle(i.key)">
            <DamageIconWidget
                :id="i.key"
                :ref="(el) => setDamageRef(el, index)"
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
        <div v-show="damageRefs[index] && damageRefs[index]?.isShow || false">
          <ItemSlotBase
              padding="0"
              :size="size + 15"
              class="d-flex justify-center align-center card-flavor"
              v-tooltip="getTitle(i.key)">

            <DamageIconWidget
                :id="i.key"
                :ref="(el) => setDamageRef(el, index)"
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
