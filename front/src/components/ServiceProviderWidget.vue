<script setup lang="ts">

import {ServiceProvider} from "@/assets/sripts/serviceProvider";
import {useItemAssetsStore} from "~/stores/itemAssetsStore";
import {onMounted, ref} from "vue";


const serviceProviders = new ServiceProvider().services,
    {serializationMap} = useItemAssetsStore()

let service_providers = ref([])

onMounted(() => {
  const logosMap = import.meta.glob('/src/assets/images/logos/*.*', {eager: true}),
      logosSerialization = serializationMap(logosMap)

  service_providers.value = serviceProviders.map(i => {
    console.log(i.name, logosSerialization[i.name])
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
      <img :src="i.icon" height="30px"/>
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
