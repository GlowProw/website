<script setup lang="ts">

import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api, storageAssembly} from "../../assets/sripts";
import {StorageAssemblyType} from "../../assets/sripts/storage_assembly";
import {useHttpToken} from "../../assets/sripts/httpUtil";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    {t} = useI18n(),
    httpToken = useHttpToken()

let publishData = ref({
      name: '',
      description: '',
      data: {}
    }),
    dataLoading = ref(false),
    publishLoading = ref(false),
    assemblyData = ref(null),
    assemblyWorkshopRef = ref(null),
    messages = ref([]),
    isEditModel = computed(() => {
      switch (route.name) {
        case 'EditAssembly':
          return true
        default:
        case 'PublishAssembly':
          return false
      }
    })

onMounted(() => {
  onLoadData()
})

/**
 * 加载数据
 */
const onLoadData = () => {
  dataLoading.value = true

  const {uid} = route.params;

  if (uid) {
    assemblyData.value = storageAssembly.get(uid as string, StorageAssemblyType.Data)
    if (assemblyData && assemblyData.value) {
      assemblyWorkshopRef.value.onLoadJson(assemblyData.value.data.data)
      publishData.value = {
        ...publishData.value,
        ...assemblyData.value.data,
      }
    }
  }

  dataLoading.value = false
}

/**
 * 编辑保存
 */
const onEdit = async () => {
  try {
    publishLoading.value = true

    let editPublishData: any = publishData.value;
    editPublishData.data = JSON.stringify(editPublishData.assembly) // as JSON

    const result = await httpToken.post(api['assembly_edit'], {
          data: editPublishData
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d.message || d.code);

    messages.value.push(t(`basic.tips.${d.code}`))
    await router.push(`/assembly/browse/${publishData.value.uuid}/detail`)
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(e.message)
  } finally {
    publishLoading.value = true
  }
}

/**
 * 发布
 */
const onPublish = async () => {
  try {
    publishLoading.value = true

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

    if (d.error == 1)
      throw Error(d.message || d.code);

    messages.value.push(t(`basic.tips.${d.code}`))
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(e.message)
  } finally {
    publishLoading.value = false
  }
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
      <v-breadcrumbs-item>{{ t('assembly.publish.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <!-- Workshop Share Preview S -->
  <v-container>
    <v-toolbar class="bg-transparent">
      <v-btn variant="elevated" v-if="isEditModel" @click="router.go(-1)">
        返回编辑
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn variant="elevated" :color="`var(--main-color)`" :loading="publishLoading" @click="() => isEditModel ? onEdit() : onPublish()">
        发布
      </v-btn>
    </v-toolbar>

    <div class="ml-n2 mr-n2">
      <AssemblyShowWidget class="card-flavor mb-5 ml-n10 mr-n10"
                          ref="assemblyWorkshopRef" :readonly="true">
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
        </v-col>
      </v-row>
    </v-container>
  </v-container>
  <!-- Workshop Share Preview E -->

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
