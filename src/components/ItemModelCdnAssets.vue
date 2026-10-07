<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const {t} = useI18n();
const {modeServices, setSelectedModeService, selectedModeService} = useCDNAssetsServiceStore();

const onUpdateAssetsModeServices = (value: any) => {
  setSelectedModeService(value.name || value);
};
</script>

<template>
  <v-card :variant="'text'">
    <div>
      <v-row align="center">
        <v-col cols="12">
          {{ t('setting.routine.modelCdnTitle') }}
          <div class="mt-2 opacity-60">
            <p class="text-caption">{{ t('setting.routine.modelCdnDesc') }}</p>
          </div>
        </v-col>
        <v-col cols="12">
          <v-select :value="selectedModeService" :items="modeServices" @update:modelValue="onUpdateAssetsModeServices">
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
