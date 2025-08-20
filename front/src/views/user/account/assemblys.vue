<script setup lang="ts">

import {useHttpToken} from "@/assets/sripts/http_util";
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

    <v-card v-for="(i,index) in userAssemblysData.data" :key="index" class="mb-2 pl-4" v-if="userAssemblysData.data && userAssemblysData.data.length > 0">
      <v-row align="stretch">
        <v-col>
          <div class="mx-5 my-3">
            <b>{{i.name}}</b>
            <p class="text-caption opacity-60">{{i.uuid}}</p>
          </div>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto" class="d-flex">
          <v-btn class="h-100 px-8" elevation="0" tile :to="`/assembly/workshop/${i.uuid}/edit`" target="_blank" icon="mdi-pencil"></v-btn>
          <v-btn class="h-100 px-8" elevation="0" tile :to="`/assembly/browse/${i.uuid}/detail`" target="_blank" icon="mdi-open-in-new"></v-btn>
          <v-divider vertical></v-divider>
          <AssemblySettingPanel :id="i.uuid">
            <v-btn class="h-100 px-10" elevation="0" tile icon="mdi-cog"></v-btn>
          </AssemblySettingPanel>
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
