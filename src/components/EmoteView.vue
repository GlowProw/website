<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Editor} from "@tiptap/vue-3";
import {onMounted, PropType, ref} from "vue";
import emojisRaw from "@/config/emoji.json";
import EmoteItem from "@/components/EmoteItem.vue";

interface EmojiItem {
  name: string;
  key?: string;
  child?: EmojiItem[];
}

interface EmojiConfig {
  default: string;
  child: EmojiChild[];
}

interface EmojiChild {
  name: string;
  titleEmoteName?: string;
  child: EmojiItem[];
}

interface Position {
  left: number;
  top: number;
}

const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    required: false,
  },
});

const emit = defineEmits<{
  (e: "finish", type: string, val: EmojiItem): void;
  (e: "close"): void;
}>();

const {t} = useI18n();

const emojis = emojisRaw as EmojiConfig;

const show = ref<boolean>(false);
const emoteTabValue = ref<string>("");
const isInsertPreview = ref<boolean>(false);
const insertPreview = ref<string>("");
const pos = ref<Position>({left: 0, top: 0});

onMounted(() => {
  emoteTabValue.value = emojis.default;
});

// Methods
/**
 * 获取当前光标位于编辑器位置
 * @returns {number|null}
 */
const getCursorPosition = (): number | null => {
  if (props.editor) {
    const {from, to} = props.editor.state.selection;
    if (from === to) {
      return from;
    }
    return null;
  }
  return null;
};

/**
 * 获取当前光标屏幕的位置
 */
const getCursorScreenCoords = (): void => {
  const cursorPosition = getCursorPosition();

  if (cursorPosition !== null && props.editor) {
    const domPos = props.editor.view.coordsAtPos(cursorPosition);
    pos.value = domPos;
    return;
  }

  pos.value = {left: 0, top: 0};
};

/**
 * 完成
 * @param type - 表情类型
 * @param val - 表情值
 */
const onFinish = (type: string, val: EmojiItem): void => {
  onPanelToggle();
  emit("finish", type, val);
};

/**
 * 面板开关
 */
const onPanelToggle = (): void => {
  show.value = !show.value;

  if (show.value === false) {
    emit("close");
  }
};

/**
 * 打开面板
 */
const openPanel = (): void => {
  onPanelToggle();
  getCursorScreenCoords();
};

defineExpose({
  openPanel,
});
</script>

<template>
  <v-dialog
      v-model="show"
      class="emote"
      class-name="emote-window-box"
      :transitionNames="['fade']"
      :width="600"
      :styles="{
      top: pos && pos.top ? `calc(${pos.top}px + 1.5rem)` : 'calc(20%)',
      left: pos && pos.left ? pos.left + 'px' : 'calc(50% - 300px)',
      bottom: 0,
      margin: 0,
      padding: 0,
    }"
      :mask="true"
      :closable="true"
      @update:modelValue="(status: boolean) => !status ? emit('close') : null"
      sticky
      transfer
      footer-hide>
    <v-card border class="emote-tab">
      <v-tabs v-model="emoteTabValue" size="small">
        <v-tab
            v-for="(item, index) in emojis.child"
            :key="index"
            :value="item.name">
          {{ t(`emote.${item.name}`) }}
        </v-tab>
      </v-tabs>
      <v-divider/>
      <v-tabs-window v-model="emoteTabValue" class="bg-black">
        <v-tabs-window-item
            v-for="(item, index) in emojis.child"
            :key="index"
            class="emote-row-box pt-7"
            :value="item.name">
          <v-card
              v-for="(childItem, childIndex) in item.child"
              :key="childIndex"
              :padding="3"
              dis-hover
              class="emote-item pa-1"
              elevation="0"
              @click="onFinish(item.name, childItem)">
            <EmoteItem
                :isSpan="false"
                :size="30"
                :id="`${item.name}|${childItem.name}`"
            />
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.emote {
  .emote-tab {
    margin: -10px -16px -16px -16px;

    .ivu-tabs-bar {
      margin-bottom: 0;
    }
  }

  .emote-row-box {
    background-color: rgba(0, 0, 0, 0.01);
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-row-gap: 10px;
    grid-column-gap: 10px;
    padding: 10px;
    margin-top: -17px;
    height: calc(100% + 17px);
    overflow-y: auto;

    .emote-item {
      width: 38px;
      height: 38px;
    }
  }
}

.emote-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
