<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {computed, Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, storageIntermediateTransfer} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {useHttpToken} from "@/assets/sripts/http_util";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

import Textarea from "@/components/textarea/index.vue"
import AssemblyMainSubjectView from "@/components/AssemblyMainSubjectView.vue";
import Silk from "@/components/Silk.vue";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing"
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing"
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing"
import type {PublishAssemblyData} from "@/assets/types";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    notice = useNoticeStore(),
    {asString} = useI18nUtils(),
    {t, locale} = useI18n()

let // 发布信息
    publishData: Ref<PublishAssemblyData> = ref({
      assembly: {
        visibility: 'publicly',
        tags: [],
        attr: {
          password: '',
          assemblyUseVersion: AssemblyDataProcessing.nowVersion,
          language: locale.value,
          isComment: true,
          isLike: true
        }
      },
      wheel: {
        attr: {
          wheelUseVersion: WheelDataProcessing.nowVersion
        }
      },
      warehouse: {
        attr: {
          warehouseUseVersion: WarehouseDataProcessing.nowVersion
        }
      }
    }),
    dataLoading = ref(false),
    publishLoading = ref(false),
    assemblyMainSubjectView = ref(null),
    formRules = {
      name: [
        v => !!v || 'Name is required',
      ]
    },
    // 发布前检查 是否可发布
    isPush = computed(() => {
      return publishData.value?.name == ''
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

watch(() => publishData.value.assembly.attr, () => {
  onSetAssemblyData()
}, {deep: true})

/**
 * 加载数据
 */
const onLoadData = () => {
  dataLoading.value = true

  const {uid} = route.params;

  if (uid) {
    const getLocalAssemblyData: any = storageIntermediateTransfer.get(uid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: 'assembly'
    })

    if (getLocalAssemblyData.code != 0)
      return notice.error(t('basic.tips.assembly.error', {
        context: 'Unable to read the local data' // 无法读取到本地数据
      }))

    const {uuid, assembly, name, description, tags} = getLocalAssemblyData.data;

    publishData.value.uuid = uuid
    publishData.value.name = name || ''
    publishData.value.description = description || ''

    publishData.value.assembly.data = assembly;
    publishData.value.assembly.tags = tags || [];

    if (getLocalAssemblyData.data.wheel)
      publishData.value.wheel = {
        ...publishData.value.wheel,
        data: getLocalAssemblyData.data.wheel || null
      };
    if (getLocalAssemblyData.data.warehouse)
      publishData.value.warehouse = {
        ...publishData.value.warehouse,
        data: getLocalAssemblyData.data.warehouse || null
      }

    if (publishData && publishData.value) {
      onSetAssemblyData()
      onSetWheelData()
      onSetWarehouseData()
    }
  }

  dataLoading.value = false
}

/**
 * 设置配装视图数据
 */
const onSetAssemblyData = async () => {
  assemblyMainSubjectView.value.refs.assembly
      .setSetting({
        assemblyUseVersion: publishData.value.assembly.attr?.assemblyUseVersion || publishData.value.assembly.data.__version || AssemblyDataProcessing.nowVersion,
        isShowItemName: publishData.value.assembly.attr?.isShowItemName || false
      })
      .onLoad(publishData.value.assembly?.data)
}

/**
 * 设置轮盘视图数据
 */
const onSetWheelData = () => {
  assemblyMainSubjectView.value.refs.wheel
      .setSetting({
        wheelUseVersion: publishData.value.wheel?.attr?.wheelUseVersion || publishData.value.wheel.data.__version || WheelDataProcessing.nowVersion,
      })
      .onLoad(publishData.value.wheel?.data)
}

/**
 * 设置船仓视图数据
 */
const onSetWarehouseData = () => {
  assemblyMainSubjectView.value.refs.warehouse
      .setSetting({
        warehouseUseVersion: publishData.value.warehouse?.attr?.warehouseUseVersion || publishData.value.warehouse.data.__version || WarehouseDataProcessing.nowVersion,
      })
      .onLoad(publishData.value.warehouse?.data)
}

/**
 * 编辑保存
 */
const onEdit = async () => {
  try {
    publishLoading.value = true
    let editPublishData: any = publishData.value;

    const result = await apis.assemblyApi().editAssembly(editPublishData),
        d = result.data;

    storageIntermediateTransfer.delete(editPublishData.uuid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: 'assembly'
    })

    await router.push(`/assembly/browse/${editPublishData.uuid}/detail`)

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
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
    const onePublishData = publishData.value;

    const result = await apis.assemblyApi().publishAssembly(onePublishData),
        d = result.data;

    storageIntermediateTransfer.delete(uid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: 'assembly'
    })

    await router.push(
        d.data['assembly.uuid'] ?
            `/assembly/browse/${d.data['assembly.uuid']}/detail` :
            `/assembly/browse`
    )

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    publishLoading.value = false
  }
}

/**
 * 处理tab事件
 * @param data
 */
const onUpdateTags = (data: any) => {
  publishData.value.assembly.tags = data;
}
</script>

<template>
  <v-card height="250px">
    <template v-slot:image>
      <Silk
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          :scale=".7"
          :speed="3"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs>
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
        <v-row align="start" no-gutters>
          <v-col>
            <h1 class="text-amber">预览</h1>
            <p class="opacity-80 mt-5">设置配装信息</p>
          </v-col>
          <v-col cols="auto">
            <v-btn v-if="isEditModel" variant="elevated" @click="router.go(-1)">
              {{ t('basic.button.prev') }}
            </v-btn>
            <v-btn :color="`var(--main-color)`" :disabled="isPush" :loading="publishLoading" class="ml-2" variant="elevated" @click="() => isEditModel ? onEdit() : onPublish()">
              {{ t('basic.button.commit') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- Workshop Share Preview S -->
  <AssemblyMainSubjectView ref="assemblyMainSubjectView"
                           @ready="onLoadData"></AssemblyMainSubjectView>
  <!-- Workshop Share Preview E -->

  <v-container>
    <v-form class="mb-10">
      <v-row>
        <v-col cols="12" lg="8" sm="12">
          <v-row>
            <v-col cols="12" lg="6" sm="12">
              <v-text-field
                  v-model="publishData.name"
                  :rules="formRules.name"
                  label="配置名称"
                  placeholder="配置名称"
                  variant="underlined">
                <template v-slot:details>
                  船长，设置一个酷炫名字，好名字配好船
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">描述</div>

              <v-card :color="`hsl(from var(--main-color) h s calc(l * 0.05))`" border class="pl-3 pr-3">
                <Textarea v-model="publishData.description"
                          :maxlength="10000"
                          class="mt-3 mb-2"
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
        <v-col cols="12" lg="4" sm="12">
          <div class="mb-5">
            <v-combobox
                v-model="publishData.assembly.tags"
                :counter="100"
                :hide-no-data="true"
                hide-details
                hide-selected
                :details="false"
                chips
                clearable
                item-title="label"
                item-value="value"
                label="标签"
                multiple
                placeholder="输入标签敲下回车键，即可创建新标签"
                variant="underlined">
              <template v-slot:prepend>
                <v-icon>mdi-tag-multiple</v-icon>
              </template>
              <template v-slot:chip="{item}">
                <v-chip color="primary">
                  {{
                    asString([
                      `${item.raw}`,
                      `assembly.tags.teamFormationMethods.${item.raw.toString().split('_')[1]}`,
                      `assembly.tags.archetypes.${item.raw.toString().split('_')[1]}`,
                      `assembly.tags.modes.${item.raw.toString().split('_')[0]}`,
                      `assembly.tags.damageTypes.${item.raw.toString().split('_')[1]}`,
                      `snb.seasons.${item.raw.toString().split('_')[1]}`,
                    ], {
                      backRawKey: true
                    })
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
</template>

<style lang="less" scoped>
</style>
