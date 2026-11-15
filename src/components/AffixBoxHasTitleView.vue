<script setup lang="ts">
import { ref } from 'vue';
import AffixView from '@/components/AffixView.vue';
import type { AffixBoxHasTitleViewProps } from '@/assets/types/Ui';

export type AffixBoxHasTitleSlotProps = {
  prop: AffixBoxHasTitleViewProps;
  props: AffixBoxHasTitleViewProps;
  isAffix: boolean;
};

const props = withDefaults(defineProps<AffixBoxHasTitleViewProps>(), {
  disabled: false,
  disabledTitle: false,
  offsetTop: 80,
  offsetBottom: 0,
});

const emit = defineEmits<{
  (e: 'change', isAffix: boolean): void;
}>();

defineSlots<{
  default?: (scope: AffixBoxHasTitleSlotProps) => any;
  title?: (scope: AffixBoxHasTitleSlotProps) => any;
}>();

// 当前固钉吸顶激活状态
const isAffix = ref(false);

/**
 * 响应底层固钉吸顶状态变动
 *
 * @param affixed 当前是否处于吸顶状态
 */
const onAffixChange = (affixed: boolean) => {
  isAffix.value = affixed;
  emit('change', affixed);
};

defineOptions({
  name: 'AffixBoxHasTitleView',
});
</script>

<template>
  <!-- 固钉视图容器 S -->
  <AffixView
      direction="right"
      class="position-relative"
      :offsetTop="props.offsetTop"
      :offsetBottom="props.offsetBottom"
      :disabled="props.disabled || props.disabledTitle"
      @change="onAffixChange">
    <template #default="{ isAffix: innerAffix }">
      <div class="mb-3">
        <slot
            :prop="props"
            :props="props"
            :isAffix="innerAffix ?? isAffix"></slot>
      </div>
    </template>

    <template #nail="{ isAffix: innerAffix }">
      <v-card width="30" variant="text">
        <v-divider thickness="3" class="mb-3"></v-divider>

        <span class="affix-title mb-3 text-amber text-center">
          <slot
              name="title"
              :prop="props"
              :props="props"
              :isAffix="innerAffix ?? isAffix"></slot>
        </span>
      </v-card>
    </template>
  </AffixView>
  <!-- 固钉视图容器 E -->
</template>

<style scoped>
.affix-title {
  writing-mode: vertical-rl;
  display: inline-flex;
  margin: 0 auto;
  text-align: center;
  letter-spacing: 2px;
  line-height: 1.3;
}
</style>
