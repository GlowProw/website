<script setup lang="ts">

</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">首页</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>展示柜</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 overview">
    <h1>展示柜</h1>
    <p class="mb-10 opacity-80">嗨，船长，还在努力施工中</p>

    <div class="fill-height">
      <v-btn block class="btn-flavor" to="/display-cabinet/ships">船</v-btn>
      <v-btn block class="btn-flavor" to="/display-cabinet/items">物品</v-btn>
    </div>

  </v-container>
</template>

<style scoped lang="less">
.overview {
}
</style>
