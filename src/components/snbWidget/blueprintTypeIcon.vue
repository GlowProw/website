<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  data: any,
  size?: number | string
}>(), {
  size: 32
});

const blueprintIcons = import.meta.glob('../../assets/images/snb/blueprint/*.png', { eager: true, import: 'default' });

const dic: Record<string, string[]> = {
  'bombard': ['bombard'],
  'gun': ['culverin', 'demicannon', 'longGun'],
  'mortar': ['mortar'],
  'ballista': ['ballista'],
  'furniture': ['majorFurniture', 'offensiveFurniture', 'tilityFurniture', 'utilityFurniture'],
  'springloader': ['springloader'],
  'armor': ['armor'],
  'ship': ['ships'],
  'torpedo': ['torpedo']
};

const iconUrl = computed(() => {
  if (!props.data) return null;

  const iconKey = Object.keys(dic).find(key => dic[key].includes(props.data));
  if (!iconKey) return null;

  const path = Object.keys(blueprintIcons).find(p => p.includes(`${iconKey}.png`));
  return path ? (blueprintIcons[path] as string) : null;
});

defineOptions({
  name: 'BlueprintTypeIcon'
});
</script>

<template>
  <div class="blueprint-type-icon d-inline-flex align-center justify-center">
    <v-img
      v-if="iconUrl"
      :src="iconUrl"
      :width="size"
      :height="size"
      aspect-ratio="1/1"
      cover
      class="prohibit-drag">
      <template v-slot:placeholder>
        <div class="d-flex align-center justify-center fill-height">
          <v-progress-circular indeterminate color="grey-lighten-4" size="16"></v-progress-circular>
        </div>
      </template>
    </v-img>
    <v-icon v-else :size="size" color="grey-lighten-1">mdi-help-circle-outline</v-icon>
  </div>
</template>

<style scoped lang="less">
.blueprint-type-icon {
  user-select: none;
}
</style>
