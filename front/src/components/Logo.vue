<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps({
      size: {
        type: [Number, String],
        default: 25
      },
      class: {
        type: String,
        default: ''
      }
    })
</script>

<template>
  <router-link to="/" class="logo" :class="props.class">
    <img src="/favicon.png" class="mr-1 icon"
         :style="`height:${size}px;width:${size}px`"/>
  </router-link>
</template>

<style scoped lang="less">
.logo {
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
