<script setup lang="ts">

import ItemName from "@/components/snbWidget/itemName.vue";
import {computed, nextTick, onMounted, ref, type Ref, watch} from "vue";
import {Cosmetic, Item, Material} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";

const props = withDefaults(
        defineProps<{ data: Item | Material | Cosmetic, byType: string }>(),
        {
          byType: ''
        }
    ),
    {t} = useI18n()

let obtainable = computed(() => {
      return filterByObtainable(props.data)
    })

watch(() => props.data, (value) => {
  // if (value)
  //   detailData.value = value
})

onMounted(() => {
  // nextTick(() => {
  //   detailData.value = props.data
  // })
})

/**
 * 处理数据
 * @param item
 */
const filterByObtainable = (item: Item | Material | Cosmetic) => {
  let array = []
  console.log(item)
  if (!item || !item.id) return [];

  const obtainable = item.obtainable;

  if (typeof obtainable === 'string') {

    array.push({
      id: obtainable,
      to: `/display-cabinet/${props.byType}/obtainable/${obtainable}`
    });

  } else if (obtainable && typeof obtainable === 'object' && 'id' in obtainable) {

    array.push({
      id: obtainable.id,
      to: `/display-cabinet/${props.byType}/${obtainable.id}`,
      item: items[obtainable.id]
    })

  } else if (Array.isArray(obtainable)) {

    const flatArray = obtainable.flat();

    flatArray.forEach(element => {
      if (typeof element === 'string') {
        array.push({
          id: element,
          to: `/display-cabinet/${props.byType}/obtainable/${element}`
        });
      } else if (element && typeof element === 'object' && 'id' in element) {
        array.push({
          id: element.id,
          to: `/display-cabinet/${props.byType}/${element.id}`,
          item: items[element.id]
        });
      }
    });
  }

  return array;
};

</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('displayCabinet.item.obtainable') }}</p>
  <v-chip v-for="(o,oIndex) in obtainable"
          class="d-inline-flex mb-1 mr-1"
          :key="oIndex"
          :to="o.to">
    <template v-if="o.item">
      <ItemName :id="o.item.id"></ItemName>
    </template>
    <template v-else>
      {{ t(`snb.locations.${o.id}`) }}
    </template>
  </v-chip>
  <EmptyView v-if="obtainable.length <= 0"></EmptyView>
</template>

<style scoped lang="less">

</style>
