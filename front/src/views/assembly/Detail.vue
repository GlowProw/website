<script setup lang="ts">

import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {nextTick, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api} from "../../assets/sripts";
import {useHttpToken} from "../../assets/sripts/httpUtil";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    {t} = useI18n()

let assemblyDetailData = ref({
      name: '',
      description: '',
      username: '',
      createdTime: Date.now(),
      updatedTime: Date.now(),
    }),
    assemblyDetailRef = ref(null)

onMounted(() => {
  getAssemblyDetail()
})

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  const {uid} = route.params;

  const result = await http.get(api['assembly_item'], {
        params: {
          id: uid,
        },
      }),
      d = result.data;

  if (d.error == 1)
    return;

  assemblyDetailData.value = d.data;

  nextTick(() => {
    assemblyDetailRef.value.onLoadJson(d.data.assembly)
  })
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <!-- Assembly Preview S -->
  <v-container>
    <div class="ml-n2 mr-n2">
      <v-text-field
          v-model="assemblyDetailData.name"
          readonly
          variant="underlined">
      </v-text-field>

      <AssemblyShowWidget class="card-flavor mb-5 ml-n10 mr-n10"
                          ref="assemblyDetailRef" :readonly="true">
        <template v-slot:image>
          <v-img
              style="position: relative;z-index: 2;"
              class=" workshop-ships-show-image pointer-events-none"
              src="/Users/cabbagelol/Desktop/835f1991017f393b685a275d9a342e56.jpeg"
              width="100%"/>
        </template>
      </AssemblyShowWidget>
    </div>

    <v-container>
      <v-row>
        <v-col cols="6">
          <v-text-field
              v-model="assemblyDetailData.username"
              readonly
              variant="underlined">
          </v-text-field>

          <v-text-field
              label="创建时间"
              v-model="assemblyDetailData.createdTime"
              readonly
              variant="underlined">
          </v-text-field>

          <v-text-field
              label="更新时间"
              v-model="assemblyDetailData.updatedTime"
              readonly
              variant="underlined">
          </v-text-field>

          <v-textarea
              v-model="assemblyDetailData.description"
              :rows="10"
              label="描述"
              readonly
              placeholder="输入描述描述"
              length="500"
              variant="underlined">
          </v-textarea>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
  <!-- Assembly Preview E -->
</template>

<style scoped lang="less">

</style>
