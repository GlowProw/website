<script setup lang="ts">
import {ref, watch} from "vue";
import {Editor} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

const props = defineProps({
      editor: {
        type: Editor,
      }
    }),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    emit = defineEmits(['finish', 'close'])

let show = ref(false),
    data = ref({
      src: ''
    })

watch(() => [router, route], () => {
  onPanelToggle()
}, {deep: true})

/**
 * 完成
 */
const onFinish = () => {
  const src = data.value.src

  onPanelToggle();
  emit('finish', src);
}

/**
 * 打开面板
 */
const openPanel = (src) => {
  onPanelToggle()

  data.value.src = src
}

/**
 * 面板开关
 */
const onPanelToggle = () => {
  show.value = !show.value

  if (show.value === false)
    emit('close')
}

const onClose = () => {
  onPanelToggle()
  emit('close')
}

defineExpose({
  openPanel,
  onPanelToggle,
  onClose,
})
</script>

<template>
  <v-dialog v-model="show"
            class="link"
            :transitionNames="['fade']"
            :width="600"
            :mask="true"
            :closable="true"
            @update:modelValue="(status) => !status ? $emit('close') : null"
            sticky
            transfer
            footer-hide>
    <v-card>
      <v-card-text>
        <v-img :src="data.src" cover max-height="100"></v-img>
        <v-text-field v-model="data.src" label="Href"></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onPanelToggle">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn @click="onFinish">{{ t('basic.button.submit') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
