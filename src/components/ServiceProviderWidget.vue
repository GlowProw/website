<script lang="ts">
export default { name: 'ServiceProviderWidget' }
</script>

<script setup lang="ts">
import {Service_provider, type ServiceProviderItem} from "@/assets/sripts/service_provider";
import {useAssetsStore} from "~/stores/assetsStore";
import {onMounted, ref, computed} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n()

const serviceProviders = new Service_provider().services,
    {serializationMap} = useAssetsStore()

const service_providers = ref<ServiceProviderItem[]>([])

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

const groups = computed(() => {
  const groupOrder = ['openSource', 'techSupport']
  const map: Record<string, ServiceProviderItem[]> = {}

  service_providers.value.forEach(item => {
    if (!map[item.type]) {
      map[item.type] = []
    }
    map[item.type].push(item)
  })

  const orderedTypes = [
    ...groupOrder.filter(type => map[type]?.length),
    ...Object.keys(map).filter(type => !groupOrder.includes(type) && map[type]?.length)
  ]

  return orderedTypes.map(type => ({
    type,
    list: map[type]
  }))
})
</script>

<template>
  <div class="service-provider d-flex align-center flex-nowrap ga-8">
    <template v-for="(group, gIndex) in groups" :key="group.type">
      <div class="service-group d-flex align-center flex-nowrap ga-5">
        <span class="service-label text-no-wrap text-caption font-weight-medium">
          {{ t(`footer.serviceProvider.${group.type}`) }}
        </span>
        <div class="service-items d-flex align-center flex-nowrap ga-8">
          <a :href="i.src" target="_blank" v-for="(i, index) in group.list" :key="index" :title="i.name">
            <img :alt="i.name" :src="i.icon" height="30px"/>
          </a>
        </div>
      </div>
      <v-divider
          v-if="gIndex < groups.length - 1"
          vertical
          class="mx-2 align-self-center opacity-20"
          style="height: 24px;"
      ></v-divider>
    </template>
  </div>
</template>

<style scoped lang="less">
.service-provider {
  .service-label {
    opacity: .6;
    letter-spacing: .5px;
    user-select: none;
  }

  .service-items {
    a {
      opacity: .7;
      display: inline-flex;
      align-items: center;
      transition: opacity .25s ease, transform .25s ease;

      &:hover {
        opacity: 1;
        transform: translateY(-1px);
      }
    }
  }
}
</style>
