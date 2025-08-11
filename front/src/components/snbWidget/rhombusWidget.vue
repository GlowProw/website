<script setup lang="ts">
const props = withDefaults(defineProps<{ activate?: boolean, activateColor?: string, size?: string | number }>(), {
  activate: false,
  size: 6,
  activateColor: ''
})
</script>

<template>
  <div class="weapon-modification">
    <div class="weapon-modification-icon" :class="[activate ? 'activate' : '']"
         :style="activate ? `border: 1px solid hsl(from ${activateColor|| 'var(--main-color)'} h s calc(l * 1))` : ''">
      <div :style="`width: ${size}px;height: ${size}px;${activate ? `background-color: ${activateColor || 'var(--main-color)'}` : ''}`"></div>
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
