<script setup lang="ts">
import {computed, ref} from 'vue'
import {Editor} from "@tiptap/vue-3";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import {Modifications} from 'glow-prow-data/src/entity/Modifications'
import {useI18n} from "vue-i18n";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";

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

const modifications = computed(() => Modifications)

defineExpose({
  openPanel,
  onPanelToggle,
})
</script>

<template>
  <v-dialog v-model="show"
            class="mod"
            class-name="mod-window-box"
            :width="600"
            @update:modelValue="(status) => !status ? $emit('close') : null"
            sticky
            footer-hide>
    <v-card class="pl-10 pr-10 pt-10 card-flavor">
      <v-row>
        <ItemSlotBase size="60px" v-if="value">
          <ModIconWidget :id="value"></ModIconWidget>
        </ItemSlotBase>
        <ItemSlotBase size="60px" class="d-flex justify-center align-center" v-else>
          <v-icon icon="mdi-close-octagon-outline"/>
        </ItemSlotBase>
        <v-combobox
            v-model="value"
            v-model:search="value"
            :hide-no-data="false"
            :items="Object.values(modifications)"
            hide-selected
            item-value="id"
            item-title="id"
            class="ml-4"
            clearable
            persistent-hint>
          <template v-slot:details>
            <span v-html="t('assembly.workshop.insertWeaponTips', {link: '/codex'})"></span>
            <v-icon icon="mdi-share"></v-icon>
          </template>
        </v-combobox>
      </v-row>

      <v-card-actions class="mt-4">
        <v-btn @click="onFinish(value)" block :disabled="!value || !modifications[value]" class="bg-amber">
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

.mod {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }

  .mod-row-box {
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

    .mod-item {
      width: 38px;
      height: 38px;
    }
  }
}

.mod-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
