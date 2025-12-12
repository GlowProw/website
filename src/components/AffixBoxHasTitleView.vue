<template>
  <AffixView direction="right" class="position-relative" offsetTop="80">
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

<script setup>
import AffixView from "@/components/AffixView.vue";
</script>

<style scoped>
.affix-title {
  writing-mode: vertical-rl;
  display: flex;
  flex-flow: row wrap;
  margin: 0 auto;
}
</style>
