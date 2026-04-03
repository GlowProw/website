<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {computed, onMounted, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {Item, Items} from "glow-prow-data";
import ItemName from "@/components/snbWidget/itemName.vue";

const appStore = useAppStore(),
    items = Items

let iconId = ref('culverin1'),
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
    getItemOnlyIds = computed(() => Object.values(items).map((i: Item) => i.id)),
    itemIsOpenNewWindow = ref(false)

const openNewWindow = computed({
  get: () => appStore.itemOpenNewWindow,
  set: (value) => appStore.toggleItemOpenNewWindow(value)
})

const getIconSize = computed({
  get: () => appStore.iconSize || sizes.value[2],
  set: (value) => appStore.setIconSize(value)
})

const getItemRaw = (item: any) => item.raw

onMounted(() => {
  itemIsOpenNewWindow.value = openNewWindow.value
})
</script>

<template>
  <v-card :variant="'text'">
    <v-row>
      <v-col>
        <v-select v-model="iconId" tile hide-details class="text-center" :density="'compact'" :items="getItemOnlyIds">
          <template v-slot:item="{props, item}">
            <v-list-item v-bind="props">
              <template v-slot:title>
                <ItemName :id="item.raw"></ItemName>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item }">
            <ItemName :id="getItemRaw(item)"></ItemName>
          </template>
        </v-select>

        <div class="mt-5 opacity-60">
          <p class="text-caption">你可以调整库存物品图标的尺寸以适配大多数地方，但有些位置图标无法改动或有范围约束。</p>
        </div>
      </v-col>
      <v-col cols="auto" class="py-3 d-flex justify-center">
        <ItemSlotBase :size="`${getIconSize.icon}px`">
          <ItemIconWidget :id="iconId" :margin="getIconSize.margin" :padding="getIconSize.padding"></ItemIconWidget>
        </ItemSlotBase>
      </v-col>
    </v-row>
  </v-card>

  <v-select
      class="mt-4"
      density="compact"
      tile
      hide-details
      v-model="getIconSize.icon"
      item-value="icon"
      :items="sizes">
    <template v-slot:selection="{ item }">
      <v-list-item>
        <template v-slot:title>
          {{ (item as any).raw.icon }}
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
        <v-switch hide-details hide-spin-buttons inset v-model="openNewWindow"></v-switch>
      </v-col>
    </v-row>

    <div class="mt-0 opacity-60">
      <p class="text-caption">默认是在同一个窗口转移，如果打开，所有物品图标点击或触摸都是新窗口访问</p>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
