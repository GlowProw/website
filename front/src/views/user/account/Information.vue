<script setup lang="ts">

import {useAuthStore} from "~/stores";

const authStore = useAuthStore()
</script>

<template>
  <div>
    <b>账户名称</b>
    <v-text-field :value="authStore.user.username"
                  variant="plain"
                  readonly></v-text-field>


    <p>👷 施工中</p>
  </div>
</template>

<style scoped lang="less">

</style>
