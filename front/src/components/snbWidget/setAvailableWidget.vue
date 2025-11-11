<script setup lang="ts">
import {Cosmetic, Cosmetics} from "glow-prow-data";
import {computed} from "vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";

const props = defineProps<{ id: string }>(),
    cosmetics = computed(() => Object.values(Cosmetics)
        .filter((i: Cosmetic) => i.set && i.set.id == props.id)
    )
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2" justify="center">
    <v-card v-for="(i, index) in cosmetics" :key="index" class="bg-transparent" width="80">
      <ItemSlotBase size="80px">
        <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
      </ItemSlotBase>
      <div class="mt-1 text-center">
        <CosmeticName :id="i.id"></CosmeticName>
      </div>
    </v-card>
  </v-row>
</template>

<style scoped lang="less">

</style>
