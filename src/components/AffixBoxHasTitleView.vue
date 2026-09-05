<script setup lang="ts">
import AffixView from "@/components/AffixView.vue";

interface Props {
  disabled?: boolean
  offsetTop?: number
  offsetBottom?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  offsetTop: 80,
  offsetBottom: 0,
})

defineOptions({
  name: 'AffixBoxHasTitleView',
})
</script>

<template>
  <AffixView
      direction="right"
      class="position-relative"
      :offsetTop="props.offsetTop"
      :offsetBottom="props.offsetBottom"
      :disabled="props.disabled">
    <div>
      <slot></slot>
    </div>
    <template v-slot:nail>
      <v-card width="30" variant="text">
        <v-divider thickness="3" class="mb-3"></v-divider>

        <span class="affix-title mb-3 text-amber text-center">
          <slot name="title"></slot>
        </span>
      </v-card>
    </template>
  </AffixView>
</template>

<style scoped>
.affix-title {
  writing-mode: vertical-rl;
  display: flex;
  flex-flow: row wrap;
  margin: 0 auto;
}
</style>
