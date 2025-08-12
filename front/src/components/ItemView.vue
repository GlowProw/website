<script setup lang="ts">
import {computed, ref} from 'vue'
import {Editor} from "@tiptap/vue-3";
import {Items} from 'glow-prow-data/src/entity/Items.js'
import {useI18n} from "vue-i18n";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import {Item} from "glow-prow-data";

const props = defineProps({
      editor: {
        type: Editor,
      }
    }),
    {t} = useI18n()

const emit = defineEmits(['finish', 'close'])

const show = ref(false)
const value = ref('')

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
  show.value = !show.value

  if (show.value === false)
    emit('close')
}

/**
 * 打开面板
 */
const openPanel = () => {
  onPanelToggle()
}

const items = computed(() => Items)

defineExpose({
  openPanel,
  onPanelToggle,
})
</script>

<template>
  <v-dialog v-model="show"
            class="item"
            sticky
            footer-hide
            @update:modelValue="(status) => !status ? $emit('close') : null">
    <v-card>
      <v-card-title>
        <v-row>
          <b class="font-weight-bold text-h5 pa-5">{{ t('comment.item.title') }}</b>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn icon variant="text" class="ml-1" @click="show = false">
              <v-icon icon="mdi-close"/>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <AssemblyClassificationShowList v-model="value" :tags="[]"></AssemblyClassificationShowList>

      <v-card-actions>
        <v-btn @click="onFinish(value)" block :disabled="!value" class="bg-amber">
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

.item {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }

  .item-tab {
    margin: -10px -16px -16px -16px;

    .ivu-tabs-bar {
      margin-bottom: 0;
    }
  }

  .item-row-box {
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

    .item-item {
      width: 38px;
      height: 38px;
    }
  }
}

.item-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
