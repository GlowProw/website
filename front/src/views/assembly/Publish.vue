<script setup lang="ts">
import Textarea from "../../components/textarea/index.vue"
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
      tags: []
    } as {
      uuid: string,
      name: string,
      description: string,
      tags: [],
      data: {}
    }),
    dataLoading = ref(false),
    publishLoading = ref(false),
    assemblyData = ref(null),
    assemblyWorkshopRef = ref(null),
    messages = ref([]),
    formRules = {
      name: [
        v => !!v || 'Name is required',
      ]
    },
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

    // 处理数据
    editPublishData.data = JSON.stringify(editPublishData.assembly) // as JSON

    const result = await httpToken.post(api['assembly_edit'], {
          data: editPublishData
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d.message || d.code);

    messages.value.push(t(`basic.tips.${d.code}`))
    storageAssembly.delete(editPublishData.uuid as string, StorageAssemblyType.Data)
    await router.push(`/assembly/browse/${publishData.value.uuid}/detail`)
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(e.message)
  } finally {
    publishLoading.value = false
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
            tags: publishData.value.tags.join(','),
          }
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d.message || d.code);

    messages.value.push(t(`basic.tips.${d.code}`))
    storageAssembly.delete(uid as string, StorageAssemblyType.Data)

    await router.push(`/assembly/browse/${d.data.id}/detail`)
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
  <v-container>
    <v-row align="start">
      <v-col>
        <h1>预览</h1>
        <p class="opacity-80">
          设置配装信息
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="elevated" v-if="isEditModel" @click="router.go(-1)">
          返回编辑
        </v-btn>
        <v-btn variant="elevated" :color="`var(--main-color)`" class="ml-2" :loading="publishLoading" @click="() => isEditModel ? onEdit() : onPublish()">
          发布
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <!-- Workshop Share Preview S -->
  <v-container>
    <div class="ml-n2 mr-n2">
      <AssemblyShowWidget class="card-flavor mb-5 ml-n10 mr-n10"
                          ref="assemblyWorkshopRef" :readonly="true">
      </AssemblyShowWidget>
    </div>

    <v-container>
      <v-form>
        <v-row>
          <v-col cols="12" sm="12" lg="6">
            <v-text-field
                v-model="publishData.name"
                label="配置名称"
                placeholder="配置名称"
                :rules="formRules.name"
                variant="underlined">
              <template v-slot:details>
                船长，设置一个酷炫名字，好名字配好船
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" sm="12" lg="6" align="right">
            <v-combobox
                label="标签"
                chips
                multiple
                clearable
                v-model="publishData.tags"
                variant="underlined"
                item-title="label"
                item-value="value"
                :hide-no-data="true">
              <template v-slot:details>
                输入标签敲下回车键，即可创建新标签
              </template>
            </v-combobox>
          </v-col>
          <v-col cols="12">
            <div class="mt-4 mb-3 font-weight-bold">描述</div>

            <v-card class="pl-5 pr-5">
              <Textarea class="mt-5 mb-2"
                        height="300px"
                        v-model="publishData.description"
                        placeholder="输入描述描述"></Textarea>
              <template v-if="route.query.debug">
                {{ publishData.description }}
              </template>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </v-container>
  </v-container>
  <!-- Workshop Share Preview E -->

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
