<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, storageIntermediateTransfer} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {ApiError} from "@/assets/types/Api";
import {handleApiError} from "@/assets/sripts/error_handler";
import {useNoticeStore} from "~/stores/noticeStore";

import Textarea from "@/components/textarea/index.vue"
import AssemblyMainSubjectView from "@/components/AssemblyMainSubjectView.vue";
import Silk from "@/components/Silk.vue";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyTagChip from "@/components/AssemblyTagChip.vue";
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing"
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing"
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing"
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing"
import {useGoTo} from "vuetify/framework";
import {useAppStore} from "~/stores/appStore";

const route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    appStore = useAppStore(),
    {asString} = useI18nUtils(),
    {t, locale} = useI18n(),
    goto = useGoTo()

let // 发布信息
    publishData = ref<any>({
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
      },
      mastery: {
        attr: {
          masteryUseVersion: MasteryDataProcessing.nowVersion
        }
      }
    }),
    dataLoading = ref(false),
    publishLoading = ref(false),
    assemblyMainSubjectView = ref(null),
    formRules = {
      name: [
        v => !!v || t('basic.assembly.publish.nameRequired'),
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
const onLoadData = async () => {
  dataLoading.value = true

  const {uid} = route.params;

  if (!uid) {
    dataLoading.value = false
    return
  }

  try {
    let localData: any = storageIntermediateTransfer.get(uid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: 'assembly'
    });

    let assemblyData = localData.code === 0 ? localData.data : null;

    if (!assemblyData) {
      // 从服务中查询数据
      const {password} = route.query;
      const result = await apis.assemblyApi().getAssemblyItem(<string>uid, {
        password: <string>password,
      });
      const d = result.data;

      assemblyData = {
        uuid: d.data.uuid,
        assembly: d.data.assembly.data,
        name: d.data.name,
        description: d.data.description,
        tags: d.data.tags,
        wheel: d.data.wheel?.data,
        warehouse: d.data.warehouse?.data,
        mastery: d.data.mastery?.data
      };
    }

    // 应用数据
    publishData.value.uuid = assemblyData.uuid
    publishData.value.name = assemblyData.name || ''
    publishData.value.description = assemblyData.description || ''
    publishData.value.assembly.data = assemblyData.assembly;
    publishData.value.assembly.tags = assemblyData.tags || [];

    if (assemblyData.wheel) {
      publishData.value.wheel = {
        ...publishData.value.wheel,
        data: assemblyData.wheel
      };
    }

    if (assemblyData.warehouse) {
      publishData.value.warehouse = {
        ...publishData.value.warehouse,
        data: assemblyData.warehouse
      };
    }

    if (assemblyData.mastery) {
      publishData.value.mastery = {
        ...publishData.value.mastery,
        data: assemblyData.mastery
      };
    }

    await onSetAssemblyData()
    onSetWheelData()
    onSetWarehouseData()
    onSetMasteryData()

    await goto('#info', {duration: 2000, offset: -120})
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblyPublish' })
  } finally {
    dataLoading.value = false
  }
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
 * 设置精通视图数据
 */
const onSetMasteryData = () => {
  assemblyMainSubjectView.value.refs.mastery
      ?.setSetting({
        masteryUseVersion: publishData.value.mastery?.attr?.masteryUseVersion || publishData.value.mastery?.data?.__version || MasteryDataProcessing.nowVersion,
      })
      ?.onLoad(publishData.value.mastery?.data)
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
    handleApiError(e, notice, t, { component: 'AssemblyPublish' })
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
    handleApiError(e, notice, t, { component: 'AssemblyPublish' })
  } finally {
    publishLoading.value = false
  }
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
          <v-breadcrumbs-item>{{ t('basic.assembly.publish.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <v-container class="pa-7">
          <v-row align="start" no-gutters>
            <v-col>
              <h1 class="text-amber">{{ t('basic.assembly.publish.preview') }}</h1>
              <p class="opacity-80 mt-5">{{ t('basic.assembly.publish.subtitle') }}</p>
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
      </v-container>
    </template>
  </v-card>

  <!-- 工坊分享预览 开始 -->
  <AssemblyMainSubjectView ref="assemblyMainSubjectView"
                           @ready="onLoadData"></AssemblyMainSubjectView>
  <!-- 工坊分享预览 结束 -->

  <!-- 悬浮 提交 S -->
  <v-card variant="text" tile class="position-fixed left-0 bottom-0 w-100 bg-black" style="z-index: 5">
    <v-divider></v-divider>
    <v-container class="py-5">
      <v-row align="start" no-gutters>
        <v-spacer></v-spacer>
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
  </v-card>
  <!-- 悬浮 提交 E -->

  <v-container>
    <v-form class="mb-10" id="info">
      <v-row>
        <v-col cols="12" lg="8" sm="12">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model="publishData.name"
                  :rules="formRules.name"
                  :label="t('basic.assembly.publish.name')"
                  size="l-large"
                  hide-details
                  :placeholder="t('basic.assembly.publish.namePlaceholder')"
                  variant="underlined">
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">{{ t('basic.assembly.publish.description') }}</div>

              <v-card :color="`hsl(from var(--main-color) h s calc(l * 0.05))`" border class="pl-3 pr-3">
                <Textarea v-model="publishData.description"
                          :maxlength="10000"
                          class="mt-3 mb-2"
                          :placeholder="t('basic.assembly.publish.descriptionPlaceholder')"></Textarea>
                <template v-if="appStore.isDebug">
                  {{ publishData.description }}
                </template>
              </v-card>
            </v-col>
            <v-col>
              <v-divider>{{ t('basic.assembly.publish.extra') }}</v-divider>
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
                :label="t('basic.assembly.publish.tags')"
                multiple
                :placeholder="t('basic.assembly.publish.tagsPlaceholder')"
                variant="underlined">
              <template v-slot:prepend>
                <v-icon>mdi-tag-multiple</v-icon>
              </template>
              <template v-slot:chip="{item}">
                <AssemblyTagChip color="var(--main-color)" :tag="item.raw"/>
              </template>
            </v-combobox>
          </div>

          <AssemblyTagsWidget
              v-model="publishData.assembly.tags"></AssemblyTagsWidget>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<style lang="less" scoped>
</style>
