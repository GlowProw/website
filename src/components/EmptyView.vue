<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
  <div class="empty">
    <p>{{t('empty.title')}}</p>
    <p class="mt-2 empty-subtext">{{t('empty.description')}}</p>
    <slot></slot>
  </div>
</template>

<style scoped lang="css">
.empty {
  text-align: center;
  padding: 20px 10px;

  .empty-subtext {
    font-size: 13px;
    opacity: .5;
  }
}
</style>
