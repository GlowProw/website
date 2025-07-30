<script setup lang="ts">
import {onMounted, ref, Ref} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items";

const props = defineProps<{ id: string }>()

let i: Ref<Item> = ref(Item.fromRawData({}))

onMounted(() => {
  onReady()
})

const onReady = () => {
  i.value = Items[props.id] || null
}

</script>

<template>
  <span :class="[`item-card-header-rarity-${i?.rarity || ''}`]">
      <slot></slot>
  </span>
</template>

<style scoped lang="less">
@rarities: common, uncommon, rare, epic, legendary;

.item-card-header-rarity {
  width: 100px;
  height: 100px;
  position: relative;

  each(@rarities, {
    &-@{value} {
      .set-rarity-color(@value);
    }
  });

  .set-rarity-color(@type) {
    & when (@type = common) {
      & {
        color: #b0b0b0;
      }
    }
    & when (@type = uncommon) {
      & {
        color: #2ecc71;
      }
    }
    & when (@type = rare) {
      & {
        color: #3498db;
      }
    }
    & when (@type = epic) {
      & {
        color: #9b59b6;
      }
    }
    & when (@type = legendary) {
      & {
        color: #f1c40f;
      }
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      border-radius: inherit;
    }
  }
}
</style>
