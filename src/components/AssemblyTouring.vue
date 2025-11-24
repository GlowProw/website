<script setup lang="ts">

</script>

<template>
  <div class="assembly-touring">
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="less">
.assembly-touring {
  max-height: 200px;
  cursor: pointer;
  margin-bottom: -10px;
  position: relative;
  width: 100%;

  > div {
    overflow: hidden !important;
    position: relative;
    outline: 0;
    border: 0;
    width: 300%;
    height: 300%;
    transform: scale(0.4);
    transform-origin: top left;
  }
}
</style>
