<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";

// 选择器所加载的类型
type ContentSelectorOption = "item" | "material" | "cosmetic" | "ultimate" | "modification"

const { t } = useI18n()
const emit = defineEmits(["finish", "close"])

const model = ref(false)
const value = ref("")
const type = ref<ContentSelectorOption>("modification")
const tags = ref<any[]>([])

const onFinish = (data: any) => {
  onPanelToggle()
  emit('finish', data.id || data)
}

const onPanelToggle = () => {
  model.value = !model.value
  if (model.value === false) {
    emit('close')
  }
}

const openPanel = (tagsRaw: any[] = [], typeRaw: ContentSelectorOption = 'modification') => {
  tags.value = tagsRaw
  type.value = typeRaw
  onPanelToggle()
}

const onClose = () => {
  onPanelToggle()
  emit('close')
}

defineExpose({
  openPanel,
  onPanelToggle,
})

defineOptions({
  name: "ModView",
})
</script>

<template>
  <v-dialog v-model="model"
            class="content-selector"
            sticky
            scrim
            footer-hide
            max-width="1024"
            @update:modelValue="(status) => !status ? onClose() : null">
    <v-container>
      <v-card>
        <v-card-title>
          <v-row align="center">
            <b class="font-weight-bold text-h5 pa-5">{{ t(`codex.${type}s.title`) }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="onClose">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>

        <AssemblyClassificationShowList
            v-model="value"
            load-data-type="modification"
            :tags="tags"
        ></AssemblyClassificationShowList>

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
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">
.content-selector {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }
}
</style>
