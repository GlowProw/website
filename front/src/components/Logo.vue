<script setup lang="ts">
import {useI18n} from "vue-i18n";
import ShinyText from "@/components/ShinyText.vue";

const {t} = useI18n()
</script>

<template>
  <router-link to="/" class="logo ml-sm-1 ml-md-1 ml-lg-2 mr-5">
    <img src="/favicon.png" class="mr-1 icon"/>
  </router-link>
</template>

<style scoped lang="less">
.logo {
  margin-left: 10px;
  display: flex;
  align-self: center;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.61);

  &:hover,
  & {
    color: #fff;
    text-decoration: none;
  }

  .icon {
    margin-left: 10px;
    margin-right: 5px;
    height: 25px;
    width: 25px;
  }

  .name {
    line-height: 30px;
    font-size: 14px;
    font-weight: bold;
    opacity: 0.9;
    font-family: "Playwrite_IN", monospace, sans-serif, "Microsoft YaHei", "微软雅黑", "Arial", sans-serif;
  }
}
</style>
