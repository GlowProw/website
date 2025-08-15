<script setup lang="ts">

import {useHttpToken} from "@/assets/sripts/http_util";
import {onMounted, ref} from "vue";
import {api} from "@/assets/sripts/index";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";

const http = useHttpToken()

let loading = ref(false),
    userTeamUpData = ref({})

onMounted(() => {
  getMyTeamUpsData()
})

/**
 * 获取账户相关配装信息
 */
const getMyTeamUpsData = async () => {
  try {
    loading.value = true;
    const result = await http.get(api['user_teamups']),
        d = result.data

    if (d.error == 1)
      return;

    userTeamUpData.value = d.data;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained>
      <Loading></Loading>
    </v-overlay>

    <v-card v-for="(i,index) in userTeamUpData.data" :key="index" class="mb-2 pa-2 pl-4" v-if="userTeamUpData.data && userTeamUpData.data.length > 0">
      <v-row align="center">
        <v-col cols="12">
          <div class="font-weight-bold text-h5 text-amber">{{ i.description }}</div>
          <v-row class="text-body-1 opacity-60">
            <v-col cols="auto">
              {{ i.createdTime }}
            </v-col>
            <v-col cols="auto">
              {{ i.player }}
            </v-col>
            <v-col cols="auto">
              <v-chip density="compact" v-for="(i, index) in i.tags" :key="index">
                {{ i }}
              </v-chip>
            </v-col>
          </v-row>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>
    </v-card>
    <div class="text-center" v-else>
      <EmptyView></EmptyView>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
