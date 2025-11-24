<script setup lang="ts">
import {Items} from "glow-prow-data";
import {computed} from "vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";

const props = defineProps<{ id: string }>(),
    items = computed(() => Object.values(Items)
        .filter((i: Item) => i.type == 'shipUpgrade' && i.id.indexOf(props.id) >= 0)
    )
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2" justify="center">
    <v-card v-for="(i, index) in items" :key="index" class="bg-transparent" width="80">
      <ItemSlotBase size="80px">
        <ItemIconWidget :id="i.id"></ItemIconWidget>
      </ItemSlotBase>
      <div class="mt-1 text-center">
        <ItemName :id="i.id"></ItemName>
      </div>
    </v-card>
  </v-row>
</template>

<style scoped lang="less">

</style>
