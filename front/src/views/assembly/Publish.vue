<script setup lang="ts">
import Textarea from "@/components/textarea/index.vue"
import AssemblyShowWidget from "@/components/AssemblyShowWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {api, storageAssembly} from "@/assets/sripts";
import {StorageAssemblyType} from "@/assets/sripts/storage_assembly";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";
import Silk from "@/components/Silk.vue";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";
import assemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing"
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    {asString} = useI18nUtils(),
    {t, locale} = useI18n(),
    httpToken = useHttpToken()

let publishData = ref({
      tags: [],
      visibility: 'publicly',
      attr: {
        password: '',
        assemblyUseVersion: assemblyDataProcessing.nowVersion,
        language: locale.value
      }
    } as {
      uuid: string,
      name: string,
      description: string,
      tags: any[],
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
    // 发布前检查 是否可发布
    isPush = computed(() => {
      return publishData.value.name == ''
    }),
    // 是否编辑模式
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
      assemblyWorkshopRef.value.onLoadJson(assemblyData.value.data.data, assemblyData.value.data?.attr?.assemblyUseVersion || assemblyData.value.data.data.__version || AssemblyDataProcessing.nowVersion)

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
            data: assemblyData.value.data.data,
            tags: publishData.value.tags,
            attr: {
              ...publishData.value.attr,
            }
          }
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d);

    messages.value.push(t(`basic.tips.${d.code}`))
    storageAssembly.delete(uid as string, StorageAssemblyType.Data)

    await router.push(`/assembly/browse/${d.data.id}/detail`)
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.data.code}`, {
        context: e.response.data.code
      }))
  } finally {
    publishLoading.value = false
  }
}

/**
 * 处理tab事件
 * @param data
 */
const onUpdateTags = (data: any) => {
  publishData.value.tags = data;
}
</script>

<template>
  <v-card height="250px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs class="pa-2">
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly/workshop">{{ t('assembly.workshop.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.publish.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pa-7">
        <v-row no-gutters align="start">
          <v-col>
            <h1 class="text-amber">预览</h1>
            <p class="opacity-80 mt-5">设置配装信息</p>
          </v-col>
          <v-col cols="auto">
            <v-btn variant="elevated" v-if="isEditModel" @click="router.go(-1)">
              {{ t('basic.button.prev') }}
            </v-btn>
            <v-btn variant="elevated" :color="`var(--main-color)`" class="ml-2" :disabled="isPush" :loading="publishLoading" @click="() => isEditModel ? onEdit() : onPublish()">
              {{ t('basic.button.commit') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- Workshop Share Preview S -->
  <div class="card-enlargement-flavor mt-n3 ml-n2 mr-n2">
    <ZoomableCanvas
        style="height: 600px"
        :minScale=".8"
        :max-scale="1.2"
        :boundary="{
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
      <div class="card-enlargement-flavor mb-5 ml-n10 mr-n10">
        <AssemblyShowWidget ref="assemblyWorkshopRef" :readonly="true"></AssemblyShowWidget>
      </div>
    </ZoomableCanvas>
  </div>
  <!-- Workshop Share Preview E -->

  <v-container>
    <v-form class="mt-10 mb-10">
      <v-row>
        <v-col cols="12" sm="12" lg="8">
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
            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">描述</div>

              <v-card border class="pl-3 pr-3" :color="`hsl(from var(--main-color) h s calc(l * 0.05))`">
                <Textarea class="mt-3 mb-2"
                          :maxlength="10000"
                          v-model="publishData.description"
                          placeholder="输入描述描述"></Textarea>
                <template v-if="route.query.debug">
                  {{ publishData.description }}
                </template>
              </v-card>
            </v-col>
            <v-col>
              <v-divider>额外</v-divider>
              <AssemblySettingWidget v-model="publishData" :is-show-delete="false"></AssemblySettingWidget>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" sm="12" lg="4">
          <div class="mb-5">
            <v-combobox
                placeholder="输入标签敲下回车键，即可创建新标签"
                chips
                multiple
                clearable
                label="标签"
                v-model="publishData.tags"
                variant="underlined"
                item-title="label"
                item-value="value"
                :counter="100"
                :hide-no-data="true">
              <template v-slot:chip="{item}">
                <v-chip size="x-large" color="primary">
                  {{
                    asString([
                      `${item.raw}`,
                      `assembly.teamFormationMethods.${item.raw.toString().split('_')[1]}`,
                      `assembly.archetypes.${item.raw.toString().split('_')[1]}`,
                      `assembly.modes.${item.raw.toString().split('_')[0]}`,
                      `assembly.damageTypes.${item.raw.toString().split('_')[1]}`,
                      `snb.seasons.${item.raw.toString().split('_')[1]}`,
                    ], true)
                  }}
                </v-chip>
              </template>
            </v-combobox>
          </div>

          <p class="font-weight-bold  mt-5 text-amber">快速选择标签</p>
          <p class="font-weight-light mt-1 mb-1 opacity-80">通过快速选择模版来创建配装标签</p>

          <AssemblyTagsWidget
              :tags="publishData.tags"
              @change="onUpdateTags"></AssemblyTagsWidget>
        </v-col>
      </v-row>
    </v-form>
  </v-container>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">
</style>
