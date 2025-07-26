<script setup lang="ts">

import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api, storageAssembly} from "../../assets/sripts";
import {StorageAssemblyType} from "../../assets/sripts/storage_assembly";
import {useHttpToken} from "../../assets/sripts/httpUtil";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    {t} = useI18n()

let publishData = ref({
      name: '',
      description: ''
    }),
    assemblyData = ref(null),
    assemblyWorkshopRef = ref(null)

onMounted(() => {
  onLoadData()
})

/**
 * 加载数据
 */
const onLoadData = () => {
  const {uid} = route.params;

  if (uid) {
    assemblyData.value = storageAssembly.get(uid as string, StorageAssemblyType.Data)
    assemblyWorkshopRef.value.onLoadJson(assemblyData.value.data.data)
  }
}

/**
 * 发布
 */
const onPublish = async () => {
  const {uid} = route.params;

  const result = await http.post(api['assembly_publish'], {
        data: {
          name: publishData.value.name,
          description: publishData.value.description,
          data: JSON.stringify(assemblyData.value.data.data),
          localUid: uid
        }
      }),
      d = result.result;
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly/workshop">{{ t('assembly.workshop.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.workshop.publish.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <!-- Workshop Share Preview S -->
  <v-container>
    <div class="ml-n2 mr-n2">
      <AssemblyShowWidget class="card-flavor mb-5 ml-n10 mr-n10"
                          ref="assemblyWorkshopRef" :readonly="true">
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
              v-model="publishData.name"
              label="配置名称"
              placeholder="配置名称"
              variant="underlined">
            <template v-slot:details>
              船长，设置一个酷炫名字，好名字配好船
            </template>
          </v-text-field>

          <v-textarea
              v-model="publishData.description"
              label="描述"
              placeholder="输入描述描述"
              length="500"
              variant="underlined">
            <template v-slot:details>
              这是一个可选项，给予描述配置特别之处
            </template>
          </v-textarea>
        </v-col>
        <v-col align="right">
          <v-btn @click="onPublish">
            发布
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
  <!-- Workshop Share Preview E -->
</template>

<style scoped lang="less">

</style>
