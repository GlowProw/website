<script setup lang="ts">

import {useHttpToken} from "@/assets/sripts/httpUtil";
import {onMounted, ref} from "vue";
import {api} from "@/assets/sripts/index";

import Loading from "@/components/Loading.vue";
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";
import EmptyView from "@/components/EmptyView.vue";

const http = useHttpToken()

let loading = ref(false),
    userAssemblysData = ref({})

onMounted(() => {
  getMyAssemblysData()
})

/**
 * 获取账户相关配装信息
 */
const getMyAssemblysData = async () => {
  try {
    loading.value = true;
    const result = await http.post(api['user_assemblys']),
        d = result.data

    if (d.error == 1)
      return;

    userAssemblysData.value = d.data;
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

    <v-card v-for="(i,index) in userAssemblysData.data" :key="index" class="mb-2 pa-2 pl-4" v-if="userAssemblysData.data && userAssemblysData.data.length > 0">
      <v-row align="center">
        <v-col>
          <b>{{i.name}}</b>
          <p class="text-body-1 opacity-60">{{i.uuid}}</p>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <div class="d-flex ga-2">
            <v-btn :to="`/assembly/workshop/${i.uuid}/edit`" target="_blank" icon="mdi-pencil"></v-btn>
            <v-btn :to="`/assembly/browse/${i.uuid}/detail`" target="_blank" icon="mdi-open-in-new"></v-btn>
            <AssemblySettingPanel :id="i.uuid">
              <v-btn icon="mdi-cog"></v-btn>
            </AssemblySettingPanel>
          </div>
        </v-col>
      </v-row>
    </v-card>
    <div class="text-center" v-else>
      <EmptyView></EmptyView>
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
