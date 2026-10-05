<script setup lang="ts">
import DateRangePicker, { type DateRangePickerProps } from './DateRangePicker.vue';

const props = defineProps<DateRangePickerProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', val: string | string[] | null): void;
  (e: 'change', val: any): void;
  (e: 'clear'): void;
}>();

defineOptions({
  name: 'TimeFrame'
})
</script>

<template>
  <DateRangePicker
      v-bind="props"
      @update:model-value="(val) => emit('update:modelValue', val)"
      @change="(val) => emit('change', val)"
      @clear="() => emit('clear')"
  />
</template>
