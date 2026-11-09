<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { Mastery } from "glow-prow-data";
import type { ByMasteryWidgetProps } from "@/assets/types/Mastery";
import MasteryView from "@/components/mastery/MasteryView.vue";
import StylizedLineBackground from "@/components/StylizedLineBackground.vue";

const props = withDefaults(defineProps<ByMasteryWidgetProps>(), {
  draggable: false,
  zoomable: false,
  initialZoom: .9,
  isolateTarget: true,
  openInMasteryView: true,
  height: 260,
});

const emit = defineEmits<{
  (e: 'node-click', node: Mastery): void;
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const currentKey = computed(() => props.targetKey || props.data?.id || props.data?.key || '');

const seasonId = computed(() => {
  return props.data?.bySeason?.id || (props.data?.season as any)?.id || (props.data?.season as any) || 'crimsonWaters';
});

const openMasteryTreeUrl = computed(() => {
  return `/mastery?season=${seasonId.value}&locate=${currentKey.value}`;
});

const onNodeClick = (node: Mastery) => {
  emit('node-click', node);
};

defineOptions({
  name: 'ByMasteryWidget'
});
</script>

<template>
  <div class="by-mastery-widget mb-4">
    <div class="d-flex align-center justify-space-between mb-2 mt-4">
      <p class="text-no-wrap font-weight-bold mb-0">
        <slot>{{ t('codex.mastery.openInTree') }}</slot>
      </p>
      <v-btn
          v-if="openInMasteryView"
          size="x-small"
          variant="text"
          color="amber"
          prepend-icon="mdi-transit-connection-variant"
          :to="openMasteryTreeUrl">
        {{ t('codex.mastery.openInTree') }}
      </v-btn>
    </div>
    <v-card :height="height" border class="position-relative overflow-hidden bg-transparent">
      <StylizedLineBackground class="w-100 h-100 position-absolute">
        <MasteryView
            :target-key="currentKey"
            :target-node="data"
            :season-id="seasonId"
            :readonly="true"
            :draggable="draggable"
            :zoomable="zoomable"
            :initial-scale="initialZoom"
            :isolate-target="isolateTarget"
            :open-in-mastery-view="openInMasteryView"
            @node-click="onNodeClick"
        />
      </StylizedLineBackground>
    </v-card>
  </div>
</template>

<style scoped lang="less">
.by-mastery-widget {
  position: relative;
}
</style>