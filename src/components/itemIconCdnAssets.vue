<script setup lang="ts">

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const {services, setSelectedService, selectedService} = useCDNAssetsServiceStore()

const onUpdateAssetsImageServces = (value: any) => {
  setSelectedService(value.name)
}

</script>

<template>
  <v-card :variant="'text'">
    <div>
      <v-row align="center">
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
  </v-card>
</template>

<style scoped lang="less">

</style>
