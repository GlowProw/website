<script setup lang="ts">
import {computed, ref, watch} from "vue"
import {useI18n} from "vue-i18n";

import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import type {ContentSelectorOption} from "@/assets/types/Codex";
import {useNoticeStore} from "~/stores/noticeStore";

const props = withDefaults(defineProps<{
  /**
   * 是否开启多选，默认关闭
   */
  multiple?: boolean
  /**
   * 多选时的最大选择数量，默认 5；未开启多选时固定为 1
   */
  multipleMax?: number
}>(), {
  multiple: false,
  multipleMax: 5
})

const {t} = useI18n(),
    emit = defineEmits(["finish", "close"]),
    noticeStore = useNoticeStore()

let model = ref(false),
    value = ref<any>(props.multiple ? [] : ""),
    type = ref<ContentSelectorOption>("item"),
    tags = ref([])

/**
 * 当前已选数量
 */
const selectedCount = computed(() => Array.isArray(value.value) ? value.value.length : (value.value ? 1 : 0))

/**
 * 是否已有可提交的选中项
 */
const hasSelection = computed(() => {
  if (!props.multiple) return Boolean(value.value)
  // 兼容子组件只回传单个对象的情况，避免只选一个时提交按钮不可用
  return Array.isArray(value.value)
      ? value.value.length > 0
      : Boolean(value.value)
})

/**
 * 当前允许选择的最大数量
 */
const maxSelectable = computed(() => props.multiple
    ? Math.max(1, Number(props.multipleMax) || 5)
    : 1)

/**
 * 选择数量达到上限
 * @param max 最大数量
 */
const onSelectionLimit = (max: number) => {
  noticeStore.warning(t('basic.selectedLimitReached', {max}))
}

/**
 * 完成
 * @param data 单选为数据对象，多选为数据对象数组
 */
const onFinish = (data: any) => {
  onPanelToggle()

  if (props.multiple) {
    // 子组件正常返回数组；兼容单个对象，避免只选一个时被当成空数组丢弃
    const selected = Array.isArray(data) ? data : (data ? [data] : [])
    emit('finish', selected.map((i: any) => i?.id || i))
    return
  }

  emit('finish', data?.id || data)
}

// 多选模式切换时重置已选内容，避免数组与单选对象串用
watch(() => props.multiple, () => {
  value.value = props.multiple ? [] : ""
})

/**
 * 面板开关
 */
const onPanelToggle = () => {
  model.value = !model.value

  if (model.value === false)
    emit('close')
}

/**
 * 打开面板
 * @param tagsRaw 可选数据类型
 * @param typeRaw 大类类型
 */
const openPanel = (tagsRaw: any[] = [], typeRaw: ContentSelectorOption = 'item') => {
  tags.value = tagsRaw
  type.value = typeRaw;

  // 多选每次打开都从空选择开始
  if (props.multiple) value.value = []

  onPanelToggle()
}

/**
 * 关闭面包
 */
const onClose = () => {
  onPanelToggle()
  emit('close')
}

defineExpose({
  openPanel,
  onPanelToggle,
})

defineOptions({
  name: 'ItemView'
})
</script>

<template>
  <v-dialog v-model="model"
            max-width="1024"
            class="content-selector"
            sticky
            scrim
            footer-hide
            :title="t(`codex.${type}s.title`)"
            @update:modelValue="(status) => !status ? onClose() : null">
    <v-card border>
      <v-card-text class="pa-0">
        <AssemblyClassificationShowList v-model="value" :tags="tags" :loadDataType="type"
                                         :multiple="multiple" :multiple-max="maxSelectable"
                                         @selectionLimit="onSelectionLimit">
          <template v-slot:close>
            <v-btn icon variant="text" class="ml-1" @click="onClose">
              <v-icon icon="mdi-close"/>
            </v-btn>
          </template>
        </AssemblyClassificationShowList>
      </v-card-text>
      <v-divider/>

      <v-card-actions>
        <span v-if="multiple && selectedCount > 0" class="text-caption opacity-70 ml-2">
          {{ t('basic.selectedCountLimit', {count: selectedCount, max: maxSelectable}) }}
        </span>
        <v-spacer></v-spacer>
        <v-btn @click="onClose">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn @click="onFinish(value)" :disabled="!hasSelection" class="bg-amber text-black">
          {{ t('basic.button.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.content-selector {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }

  .content-selector-tab {
    margin: -10px -16px -16px -16px;

    .ivu-tabs-bar {
      margin-bottom: 0;
    }
  }

  .content-selector-row-box {
    background-color: rgba(0, 0, 0, 0.01);
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-row-gap: 10px;
    grid-column-gap: 10px;
    padding: 10px;
    margin-top: -17px;
    height: calc(100% + 17px);
    max-height: 200px;
    overflow-y: auto;

    .content-selector-item {
      width: 38px;
      height: 38px;
    }
  }
}

.content-selector-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
