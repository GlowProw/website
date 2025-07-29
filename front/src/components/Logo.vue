<script setup lang="ts">

</script>

<template>
  <router-link to="/" class="logo mr-5">
    <img src="/favicon.svg" class="mr-1 icon"/>
    <h1 class="name">{{ $t('name') }}</h1>
  </router-link>
</template>

<style scoped lang="less">
.logo {
  margin-left: 10px;
  display: flex;
  align-self: center;

  &:hover,
  & {
    color: #fff;
    text-decoration: none;
  }

  .icon {
    margin-right: 5px;
    height: 30px;
    width: 30px;
  }

  .name {
    line-height: 30px;
    font-size: 16px;
    font-weight: bold;
    opacity: 0.9;
  }
}
</style>
