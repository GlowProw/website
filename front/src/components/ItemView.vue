<script setup lang="ts">
import {computed, ref} from 'vue'
import {Editor} from "@tiptap/vue-3";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "./snbWidget/itemIconWidget.vue";
import {Items} from 'glow-prow-data/src/entity/Items.js'
import {useI18n} from "vue-i18n";

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
 * @param id
 */
const onFinish = (id) => {
  onPanelToggle()
  emit('finish', id)
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
            class="ship"
            class-name="ship-window-box"
            :width="600"
            @update:modelValue="(status) => !status ? $emit('close') : null"
            sticky
            footer-hide>
    <v-card class="pl-10 pr-10 pt-10 card-flavor">
      <v-row>
        <ItemSlotBase size="60px" v-if="value">
          <ItemIconWidget :id="value"></ItemIconWidget>
        </ItemSlotBase>
        <ItemSlotBase size="60px" class="d-flex justify-center align-center" v-else>
          <v-icon icon="mdi-close-octagon-outline"/>
        </ItemSlotBase>
        <v-combobox
            v-model="value"
            v-model:search="value"
            :hide-no-data="false"
            :items="Object.values(items)"
            hide-selected
            item-value="id"
            item-title="id"
            class="ml-4"
            clearable
            persistent-hint>
          <template v-slot:details>
            <span v-html="t('assembly.workshop.insertWeaponTips', {link: '/display-cabinet'})"></span>
            <v-icon icon="mdi-share"></v-icon>
          </template>
        </v-combobox>
      </v-row>

      <v-card-actions class="mt-4">
        <v-btn @click="onFinish(value)" block :disabled="!value || !items[value]" class="bg-amber">
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

.ship {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }

  .ship-tab {
    margin: -10px -16px -16px -16px;

    .ivu-tabs-bar {
      margin-bottom: 0;
    }
  }

  .ship-row-box {
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

    .ship-item {
      width: 38px;
      height: 38px;
    }
  }
}

.ship-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
