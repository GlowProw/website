<script setup lang="ts">

</script>

<template>
  <div class="empty">
    <p>空空如也</p>
    <p class="empty-subtext">这里什么都没有</p>
    <slot></slot>
  </div>
</template>

<style scoped lang="css">
.empty {
  text-align: center;
  padding: 20px 10px;

  .empty-subtext {
    font-size: 12;
    opacity: .5;
  }
}
</style>
