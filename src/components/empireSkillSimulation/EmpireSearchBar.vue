<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import FullscreenBtn from '@/components/FullscreenBtn.vue';

const props = defineProps<{
  modelValue: string;
  items: any[];
  mobile: boolean;
  viewRef?: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search-input', value: any): void;
  (e: 'search-enter'): void;
}>();

const {t} = useI18n();
</script>

<template>
  <v-card
      border
      class="d-flex skill-tree-search-bar"
      :width="mobile ? 'calc(100% - 50px)' : 450"
      :style="{'top': mobile ? '70px' : '70px'}"
  >
    <v-combobox
        :model-value="modelValue"
        :items="items"
        :placeholder="t('empireSkillSimulation.searchPlaceholder')"
        tile
        elevation="0"
        hide-details
        variant="solo"
        clearable
        density="comfortable"
        :menu-props="{ maxHeight: '450px' }"
        prepend-inner-icon="mdi-magnify"
        @update:model-value="emit('search-input', $event); emit('update:modelValue', typeof $event === 'string' ? $event : ($event?.title || ''))"
        @keydown.enter="emit('search-enter')"
    ></v-combobox>
    <FullscreenBtn :viewRef="viewRef"></FullscreenBtn>
  </v-card>
</template>

<style scoped lang="less">
.skill-tree-search-bar {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 100;
}
</style>
