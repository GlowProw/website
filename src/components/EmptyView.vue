<script lang="ts">
export default { name: 'EmptyView' }
</script>

<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useSlots} from "vue";

const {t} = useI18n(),
    slots = useSlots()
</script>

<template>
  <div class="empty">
    <template v-if="slots.title">
      <p><slot name="title"></slot></p>
    </template>
    <template v-else>
      <p>{{t('empty.title')}}</p>
    </template>
    <template v-if="slots.description">
      <p class="empty-subtext mt-1"><slot name="description"></slot></p>
    </template>
    <template v-else>
      <p class="empty-subtext mt-1">{{t('empty.description')}}</p>
    </template>
  </div>
</template>

<style scoped lang="less">
.empty {
  text-align: center;
  padding: 20px 10px;

  .empty-subtext {
    font-size: 13px;
    opacity: .5;
  }
}
</style>
