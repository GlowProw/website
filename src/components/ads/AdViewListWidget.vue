<script setup lang="ts">
import {onMounted, ref} from "vue";
import {storage_account} from "@/assets/sripts/index";
import EmptyView from "@/components/EmptyView.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

let adsList = ref([]),
    ads = ref([]),
    loading = ref(false)

onMounted(() => {
  getAdsList()
})

/**
 * 获取广告列表
 */
const getAdsList = () => {
  loading.value = true

  adsList.value = storage_account.getConfigurationAll('ad')
  ads.value = Object.entries(adsList.value).filter(i => i[0] != 'google.switch')

  loading.value = false
}

/**
 * 更新广告状态
 * @param i
 */
const updateAdStatus = (i) => {
  console.log(i)

  storage_account.updateConfiguration('ad', i[0], {
    type: i[1].type,
    value: i[1].value
  })
}
</script>

<template>
  <v-row class="mb-1">
    <v-col>
      <p class="text-caption opacity-60">{{ t('setting.ad.closedAdsHint') }}</p>
    </v-col>
    <v-spacer></v-spacer>
    <v-col cols="auto">
      <v-btn @click="getAdsList">
        <v-icon icon="mdi-refresh" size="20" :class="[loading ? 'spin-icon-load' : '']"/>
      </v-btn>
    </v-col>
  </v-row>
  <div>
    <v-list v-if="ads.length > 0" class="bg-transparent">
      <template v-for="(i, index) in ads" :key="index">
        <v-list-item @click="i[1].value = !i[1].value">
          <template v-slot:prepend>
            <v-chip variant="tonal" density="compact">AD</v-chip>
          </template>
          <template v-slot:title>
            <div class="ml-4">{{ i[0] }}</div>
          </template>
          <template v-slot:append>
            <v-switch v-model="i[1].value" hide-details inset @update:modelValue="updateAdStatus(i)"></v-switch>
          </template>
        </v-list-item>
        <v-divider inset v-if="index < ads.length - 1"></v-divider>
      </template>

    </v-list>
    <EmptyView v-else></EmptyView>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";
</style>
