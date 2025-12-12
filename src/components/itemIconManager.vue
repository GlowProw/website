<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {computed, onMounted, ref} from "vue";

let iconSize = ref({}),
    sizes = ref([{
      icon: 48,
      padding: 1,
      margin: 0,
    }, {
      icon: 60,
      padding: 1,
      margin: 0,
    }, {
      icon: 99,
      padding: 1,
      margin: 1,
    }, {
      icon: 120,
      padding: 1,
      margin: 1,
    }]),
    getSize = computed(() => `${iconSize.value.icon}px`),
    itemIsOpenNewWindow = ref()

onMounted(() => {
  iconSize.value = sizes.value[2]
})

const onItemIsOpenNewWindow = () => {

}

</script>

<template>
  <v-card border class="py-3 px-8 d-flex align-center justify-center">
    <div>
      <ItemSlotBase :size="getSize">
        <ItemIconWidget id="culverin1" :margin="iconSize.margin" :padding="iconSize.padding"></ItemIconWidget>
      </ItemSlotBase>
    </div>
  </v-card>

  <div class="mt-5 opacity-60">
    <p class="text-caption">你可以调整库存物品图标的尺寸以适配大多数地方，但有些位置图标无法改动。</p>
  </div>

  <v-select
      class="mt-4"
      density="comfortable"
      v-model="iconSize"
      :items="sizes">
    <template v-slot:selection="{item,props}">
      <v-list-item v-bind="props">
        <template v-slot:title>
          {{ item.raw.icon }}
        </template>
      </v-list-item>
    </template>
    <template v-slot:item="{item,props}">
      <v-list-item v-bind="props">
        <template v-slot:title>
          {{ item.raw.icon }}
        </template>
      </v-list-item>
    </template>
  </v-select>

  <div>
    <v-row align="center">
      <v-col>新窗口</v-col>
      <v-col cols="auto">
        <v-switch hide-details hide-spin-buttons inset v-model="itemIsOpenNewWindow" @update:modelValue="onItemIsOpenNewWindow"></v-switch>
      </v-col>
    </v-row>

    <div class="mt-0 opacity-60">
      <p class="text-caption">默认是在同一个窗口转移，如果打开，所有物品图标点击或触摸都是新窗口访问</p>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
