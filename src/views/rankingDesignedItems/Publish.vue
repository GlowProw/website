<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {computed, Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storageIntermediateTransfer} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useNoticeStore} from "@/../stores/noticeStore";

import Textarea from "@/components/textarea/index.vue"
import Silk from "@/components/Silk.vue";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";

// workshop data processing S
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import RankingDesignedMainSubjectView from "@/components/RankingDesignedMainSubjectView.vue";
// workshop data processing E

const route = useRoute(),
    router = useRouter(),
    noticeStore = useNoticeStore(),
    {asString} = useI18nUtils(),
    {t, locale} = useI18n()

let // 发布信息
    publishData = ref({
      ranking: {
        visibility: 'publicly',
        tags: [],
        attr: {
          useVersion: RankingDesignedItemsDataProcessing.nowVersion,
          language: locale.value,
          isComment: true,
          isLike: true
        }
      },
    } as {
      uuid: string,
      name: string,
      description: string,
      ranking: {
        tags: any[],
        visibility: string,
        attr: any,
        data: any
      },
    }),
    dataLoading = ref(false),
    publishLoading = ref(false),
    rankingDesignedMainSubjectView: Ref<any> = ref(null),
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
        case 'EditRankingDesignedItems':
          return true
        default:
        case 'PublishRankingDesignedItems':
          return false
      }
    })

watch(() => publishData.value.ranking.attr, () => {
  onSetRankingData()
}, {deep: true})

watch(() => route, () => {
  onLoadData()
})

/**
 * 加载数据
 */
const onLoadData = () => {
  dataLoading.value = true

  const {uid} = route.params;

  if (uid) {
    const getLocalAssemblyData = storageIntermediateTransfer.get(uid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: 'ranking'
    })

    if (getLocalAssemblyData.code != 0)
      return noticeStore.error(t('basic.tips.ranking.error', {
        context: 'read local data error'
      }))

    const {uuid, ranking, name, description, tags} = getLocalAssemblyData.data;

    publishData.value.uuid = uuid
    publishData.value.name = name || ''
    publishData.value.description = description || ''

    publishData.value.ranking.data = ranking;
    publishData.value.ranking.tags = tags || [];

    if (publishData && publishData.value) {
      onSetRankingData()
    }
  }

  dataLoading.value = false
}

/**
 * 设置排行视图数据
 */
const onSetRankingData = () => {
  console.log(rankingDesignedMainSubjectView.value.refs)
  rankingDesignedMainSubjectView.value.refs.rankingDesignedRef
      .setSetting({
        useVersion: publishData.value.ranking.attr?.assemblyUseVersion || publishData.value.ranking.data.__version || RankingDesignedItemsDataProcessing.nowVersion,
      })
      .onLoad(publishData.value.ranking.data)
}

/**
 * 编辑保存
 */
const onEdit = async () => {
  try {
    publishLoading.value = true
    let editPublishData: any = publishData.value;

    // const result = await httpToken.post(api['assembly_edit'], {
    //       data: editPublishData
    //     }),
    //     d = result.data;
    //
    // if (d.error == 1)
    //   throw Error(d.message || d.code);
    //
    // storageAssembly.delete(editPublishData.uuid as string, StorageAssemblyType.Data)
    // await router.push(`/assembly/browse/${editPublishData.uuid}/detail`)

    noticeStore.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      noticeStore.error(e.message)
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

    // const result = await http.post(api['assembly_publish'], {
    //       data: onePublishData
    //     }),
    //     d = result.data;
    //
    // if (d.error == 1)
    //   throw Error(d);
    //
    // storageAssembly.delete(uid as string, StorageAssemblyType.Data)
    // await router.push(
    //     d.data['assembly.uuid'] ?
    //         `/assembly/browse/${d.data['assembly.uuid']}/detail` :
    //         `/assembly/browse`
    // )

    noticeStore.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      noticeStore.error(t(`basic.tips.${e.response.data.code}`, {
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

  <!-- Ranking Designed Widget Preview S -->
  <RankingDesignedMainSubjectView ref="rankingDesignedMainSubjectView" @ready="onLoadData" readonly></RankingDesignedMainSubjectView>
  <!-- Ranking Designed Widget Preview E -->

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
          </v-row>
        </v-col>
        <v-col cols="12" lg="4" sm="12">
          <div class="mb-5">
            <v-combobox
                v-model="publishData.tags"
                :counter="100"
                :hide-no-data="true"
                chips
                clearable
                item-title="label"
                item-value="value"
                label="标签"
                multiple
                placeholder="输入标签敲下回车键，即可创建新标签"
                variant="underlined">
              <template v-slot:chip="{item}">
                <v-chip color="primary" size="x-large">
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
