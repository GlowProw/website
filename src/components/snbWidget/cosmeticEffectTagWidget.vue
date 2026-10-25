<script setup lang="ts">
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{ effect?: [] | string | unknown }>(), {effect: null}),
    {t} = useI18n()

defineOptions({
  name: 'CosmeticEffectTagWidget'
})
</script>

<template>
  <template v-if="effect">
    <template v-if="Array.isArray(effect)">
      <v-chip class="badge-flavor text-center tag-badge text-black bg-green-accent-4 text-green-darken-4"
              v-for="(i, index) in effect"
              :key="index">
        {{ t(`codex.cosmetic.effects.${i}`) || t(`codex.types.${i}`) || i }}
      </v-chip>
    </template>
    <v-chip class="badge-flavor text-center tag-badge text-black bg-green-accent-4 text-green-darken-4"
            v-else-if="typeof effect == 'string'">
      {{ t(`codex.cosmetic.effects.${effect}`) || t(`codex.types.${effect}`) || effect }}
    </v-chip>
  </template>
</template>

<style scoped lang="less">

</style>
