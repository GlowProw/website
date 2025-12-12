<template>
  <AffixView direction="right" class="position-relative" offsetTop="80" affix-bg-class="thin-diagonal">
    <div>
      <slot></slot>
    </div>
    <template v-slot:nail>
      <v-card width="30" variant="text">
        <v-divider thickness="3" class="mb-3"></v-divider>

        <h1 class="text-h5 mb-3 text-amber text-center">
          <slot name="title"></slot>
        </h1>
      </v-card>
    </template>
<!--    <template v-slot:nail-footer>-->
<!--      <v-divider thickness="3"></v-divider>-->
<!--    </template>-->
  </AffixView>
</template>

<script setup>
import AffixView from "@/components/AffixView.vue";
</script>

<style>
.thin-diagonal {
  --width: 4px;
  --color: hsl(from var(--main-color) h s l / .03);

  background-image: repeating-linear-gradient(45deg,
  transparent,
  transparent var(--width),
  var(--color) var(--width),
  var(--color) calc(var(--width) * 2));
}

</style>
