<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {computed, onMounted, ref} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {Item, Items} from "glow-prow-data";
import ItemName from "@/components/snbWidget/itemName.vue";

const appStore = useAppStore(),
    {services, setSelectedService, currentService: currentImageService, selectedService} = useCDNAssetsServiceStore(),
    items = Items

let iconId = ref('culverin1'),
    iconSize = ref({
      margin: 0,
      padding: 0,
    }),
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
    getItemOnlyIds = computed(() => Object.values(items).map((i: Item) => i.id)),
    itemIsOpenNewWindow = ref(false)

const openNewWindow = computed({
  get: () => appStore.itemOpenNewWindow,
  set: (value) => appStore.toggleItemOpenNewWindow(value)
})

onMounted(() => {
  iconSize.value = sizes.value[2]
  itemIsOpenNewWindow.value = openNewWindow.value
})

const onUpdateAssetsImageServces = (value: any) => {
  setSelectedService(value.name)
}

</script>

<template>
  <v-card  :variant="'text'">
    <div class="py-3 px-8 mb-5 d-flex align-center justify-center">
      <ItemSlotBase :size="getSize">
        <ItemIconWidget :id="iconId" :margin="iconSize.margin" :padding="iconSize.padding"></ItemIconWidget>
      </ItemSlotBase>
    </div>
    <v-select v-model="iconId" tile hide-details class="text-center" :density="'compact'" :items="getItemOnlyIds">
      <template v-slot:item="{props, item}">
        <v-list-item v-bind="props">
          <template v-slot:title>
            <ItemName :id="item.raw"></ItemName>
          </template>
        </v-list-item>
      </template>
      <template v-slot:selection="{props,item}">
        <v-list-item v-bind="props">
          <template v-slot:title>
            <ItemName :id="item.raw"></ItemName>
          </template>
        </v-list-item>
      </template>
    </v-select>
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
        <v-switch hide-details hide-spin-buttons inset v-model="openNewWindow"></v-switch>
      </v-col>
    </v-row>

    <div class="mt-0 opacity-60">
      <p class="text-caption">默认是在同一个窗口转移，如果打开，所有物品图标点击或触摸都是新窗口访问</p>
    </div>

    <v-row align="center" class="mt-10">
      <v-col cols="12">
        资源来源
        <div class="mt-2 opacity-60">
          <p class="text-caption">决定图标等资源获取来源,不同的资源可能存在图标风格差异以及响应速度等,在修改后需要重新载入网页</p>
        </div>
      </v-col>
      <v-col cols="12">
        <v-select :value="selectedService" :items="services" @update:modelValue="onUpdateAssetsImageServces">
          <template v-slot:item="{props, item}">
            <v-list-item v-bind="props" :title="item.raw.name"></v-list-item>
          </template>
          <template v-slot:selection="{item}">
            {{ item.raw.name }}
          </template>
        </v-select>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">

</style>
