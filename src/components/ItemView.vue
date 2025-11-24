<script setup lang="ts">
import {ref} from "vue"
import {useI18n} from "vue-i18n";
import {Item} from "glow-prow-data";

import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";

// 选择器所加载的类型
type ContentSelectorOption = "item" | "material" | "cosmetic" | "ultimate" | "modification"

const {t} = useI18n(),
    emit = defineEmits(["finish", "close"])

let model = ref(false),
    value = ref(""),
    type: ContentSelectorOption = ref("item"),
    tags = ref([])

/**
 * 完成
 * @param data
 */
const onFinish = (data: Item) => {
  onPanelToggle()
  emit('finish', data.id)
}

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
  if (!tagsRaw || !typeRaw)
    return console.warn('panel not id')

  tags.value = tagsRaw
  type.value = typeRaw;

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
</script>

<template>
  <v-dialog v-model="model"
            max-width="1024"
            class="content-selector"
            sticky
            scrim
            footer-hide
            @update:modelValue="(status) => !status ? onClose() : null">
    <v-card>
      <v-card-title>
        <v-row>
          <b class="font-weight-bold text-h5 pa-5">{{ t(`codex.${type}s.title`) }}</b>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn icon variant="text" class="ml-1" @click="onClose">
              <v-icon icon="mdi-close"/>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <AssemblyClassificationShowList v-model="value" :tags="tags" :loadDataType="type"></AssemblyClassificationShowList>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onClose">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn @click="onFinish(value)" :disabled="!value" class="bg-amber">
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
