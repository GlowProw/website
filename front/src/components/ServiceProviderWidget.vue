<script setup lang="ts">

import {Service_provider} from "@/assets/sripts/service_provider";
import {useItemAssetsStore} from "~/stores/itemAssetsStore";
import {onMounted, ref} from "vue";


const serviceProviders = new Service_provider().services,
    {serializationMap} = useItemAssetsStore()

let service_providers = ref([])

onMounted(() => {
  const logosMap = import.meta.glob('/src/assets/images/logos/*.*', {eager: true}),
      logosSerialization = serializationMap(logosMap)

  service_providers.value = serviceProviders.map(i => {
    return {
      ...i,
      icon: logosSerialization[i.name]
    }
  })
})
</script>

<template>
  <div class="service-provider d-flex ga-10 overflow-x-auto">
    <a :href="i.src" target="_blank" v-for="(i, index) in service_providers" :key="index">
      <img :alt="i.name" :src="i.icon" height="30px"/>
    </a>
  </div>
</template>

<style scoped lang="less">
.service-provider {
  a {
    opacity: .7;
    animation: all .25s;
  }

  a:hover {
    opacity: 1;
  }
}
</style>
