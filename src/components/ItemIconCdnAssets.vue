<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const {t} = useI18n()
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
          {{ t('setting.routine.cdnTitle') }}
          <div class="mt-2 opacity-60">
            <p class="text-caption">{{ t('setting.routine.cdnDesc') }}</p>
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
