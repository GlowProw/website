<script setup lang="ts">
import {computed, ref} from "vue";
import {Editor} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {normalizeVideoUrl} from "./textarea/video/index";

const props = defineProps({
      editor: {
        type: Editor,
      }
    }),
    {t} = useI18n(),
    emit = defineEmits(['finish', 'close'])

let show = ref(false),
    data = ref({
      src: ''
    })

const resolved = computed(() => normalizeVideoUrl(data.value.src))

const onFinish = () => {
  if (!resolved.value.ok) return

  onPanelToggle()
  emit('finish', resolved.value.embed ? resolved.value.url : data.value.src)
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

/**
 * 关闭面板
 */
const onClose = () => {
  onPanelToggle()
  emit('close')
}

defineExpose({
  openPanel,
  onPanelToggle,
  onClose,
})

defineOptions({
  name: 'VideoView'
})
</script>

<template>
  <v-dialog v-model="show"
            class="video"
            :transitionNames="['fade']"
            :width="600"
            :mask="true"
            :closable="true"
            @update:modelValue="(status) => !status ? $emit('close') : null"
            sticky
            transfer
            footer-hide>
    <v-card border>
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5">
        <v-icon size="80">mdi-video</v-icon>
      </v-card-title>
      <v-card-text>
        <div v-if="resolved.ok && resolved.embed" class="video-embed-preview mb-2">
          <iframe :src="resolved.url"
                  class="border-0 w-100"
                  allow="fullscreen; picture-in-picture"
                  allowfullscreen
                  sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms allow-fullscreen"
                  referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>

        <!-- 该网页禁止被 iframe 内嵌（frame-ancestors 'self'），将以链接卡片插入 -->
        <div v-else-if="resolved.ok && !resolved.embed" class="video-external-preview mb-2">
          <v-card variant="tonal" color="amber" class="pa-3 d-flex align-center ga-2">
            <v-icon icon="mdi-open-in-new" size="22" color="amber-darken-1"></v-icon>
            <span class="text-body-2">{{ t('videoEmbed.externalHint') }}</span>
          </v-card>
        </div>

        <v-text-field v-model="data.src"
                      :label="t('videoEmbed.label')"
                      @keyup.enter="onFinish"/>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onPanelToggle">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="amber" :disabled="!resolved.ok" @click="onFinish">{{ t('basic.button.submit') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.video-embed-preview {
  border-radius: 8px;
  overflow: hidden;
  background: #000;

  iframe {
    display: block;
    aspect-ratio: 16 / 9;
    height: auto;
    min-height: 0;
  }
}
</style>
