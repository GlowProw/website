<script setup lang="ts">
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify";
import AssemblyCompareWidget from "@/components/AssemblyCompareWidget.vue";

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  baseAssembly?: any,
  targetAssembly?: any,
  baseTitle?: string,
  targetTitle?: string,
}>(), {
  modelValue: undefined,
  baseAssembly: null,
  targetAssembly: null,
  baseTitle: '',
  targetTitle: '',
});

const emit = defineEmits(['update:modelValue', 'close']);
const {t} = useI18n();
const {mobile} = useDisplay();

const internalShow = ref(false);
const isFullscreen = ref(false);

const isControlled = () => props.modelValue !== undefined;

watch(() => props.modelValue, (val) => {
  if (val !== undefined) {
    internalShow.value = val;
  }
});

const onDialogChange = (val: boolean) => {
  internalShow.value = val;
  emit('update:modelValue', val);
  if (!val) {
    emit('close');
  }
};

const openDialog = () => {
  onDialogChange(true);
};

const closeDialog = () => {
  onDialogChange(false);
};

defineExpose({
  open: openDialog,
  close: closeDialog
});
</script>

<template>
  <span @click="openDialog" v-if="$slots.default || $slots.activator" class="d-inline-flex">
    <slot name="activator" :props="{ onClick: openDialog }">
      <slot></slot>
    </slot>
  </span>

  <v-dialog
      :model-value="isControlled() ? props.modelValue : internalShow"
      :fullscreen="true"
      @update:model-value="onDialogChange"
      scrollable
      transition="dialog-bottom-transition"
      location="bottom">
    <v-card class="assembly-compare-card"
            min-height="500px">
      <v-spacer></v-spacer>

      <!-- 弹窗顶部栏 -->
      <v-toolbar density="comfortable" color="surface" class="px-4">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold text-amber">
          {{ t('assembly.compare.title') }}
        </v-toolbar-title>

        <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="closeDialog"
        ></v-btn>
      </v-toolbar>

      <div class="overflow-y-auto">
        <AssemblyCompareWidget
            :base-assembly="baseAssembly"
            :target-assembly="targetAssembly"
            :base-title="baseTitle"
            :target-title="targetTitle"
        ></AssemblyCompareWidget>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.assembly-compare-card {
  background-color: rgb(var(--v-theme-surface));
}
</style>
