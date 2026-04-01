<script setup lang="ts">
import {useRoute} from "vue-router";
import ItemCardDetail from "@/components/snbWidget/itemCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || 'culverin1';
</script>

<template>
  <div class="item-widget d-flex justify-center">
    <ItemCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped lang="less">
.item-widget {
  background-color: transparent;
}
.item-widget > :first-child {
  min-width: 500px;
  max-width: 550px;
  width: 100%;
}
</style>
