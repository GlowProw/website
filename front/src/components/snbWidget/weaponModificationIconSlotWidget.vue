<script setup lang="ts">
const props = withDefaults(defineProps<{ activate?: boolean, size?: string | number }>(), {
  activate: false,
  size: 6
})
</script>

<template>
  <div class="weapon-modification">
    <div class="weapon-modification-icon" :class="[activate ? 'activate' : '']">
      <div :style="`width: ${size}px;height: ${size}px;`"></div>
    </div>
  </div>
</template>

<style scoped lang="less">
.weapon-modification {
  margin: 0 2px;
}

.weapon-modification-icon {
  transform: rotate(45deg);
  padding: 1px;
  border: 1px solid #fff;

  &.activate {
    border: 1px solid hsl(from var(--main-color) h s calc(l * 1));

    > div {
      background-color: var(--main-color);
    }
  }

  > div {
    background-color: rgba(255, 255, 255, 1);
  }
}

</style>
