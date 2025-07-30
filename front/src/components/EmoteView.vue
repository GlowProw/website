<script>
import {Editor} from "@tiptap/vue-3";

import emojis from "../../public/config/emoji.json"
import EmoteItem from "./EmoteItem.vue";

export default {
  components: {EmoteItem},
  props: {
    editor: {
      type: Editor,
    }
  },
  data() {
    return {
      show: false,
      emoteTabValue: "",
      isInsertPreview: false,
      insertPreview: "",
      pos: {left: 0, top: 0}
    }
  },
  created() {
    this.emoteTabValue = this.emojis.default;
  },
  methods: {
    /**
     * 获取当前光标位于编辑器位置
     * @returns {*|null}
     */
    getCursorPosition() {
      if (this.editor) {
        const {from, to} = this.editor.state.selection;
        if (from === to) {
          return from;
        } else {
          return null;
        }
      }

      return null;
    },
    /**
     * 获取当前光标屏幕的位置
     */
    getCursorScreenCoords() {
      const cursorPosition = this.getCursorPosition();

      if (cursorPosition !== null && this.editor) {
        const domPos = this.editor.view.coordsAtPos(cursorPosition);
        this.pos = domPos;
        return;
      }

      this.pos = null
    },

    /**
     * 完成
     * @param val
     */
    onFinish(type, val) {
      this.onPanelToggle();
      this.$emit('finish', type, val)
    },

    /**
     * 面板开关
     */
    onPanelToggle() {
      this.show = !this.show;

      if (this.show === false)
        this.$emit('close');
    },
    /**
     * 打开面板
     */
    openPanel() {
      this.onPanelToggle();
      this.getCursorScreenCoords();
    },
    /**
     * 表情标题
     * @param h
     * @param i
     * @returns {*}
     */
    emoTeTabTitle(h, i) {
      return h(EmoteItem, {
        props: {
          isSpan: false,
          size: 23,
          id: i.titleEmoteName,
          isDisabledTooltip: true
        }
      });
    },

    handleMouseEnter(i, j) {
      this.isInsertPreview = true;
      this.insertPreview = `${i.name}|${j.name}`
    },
    handleMouseLeave(i, j) {
      this.isInsertPreview = false;
    }
  },
  computed: {
    emojis: () => emojis,
  }
}
</script>

<template>
  <v-dialog v-model="show"
            class="emote"
            class-name="emote-window-box"
            :transitionNames="['fade']"
            :width="600"
            :styles="{
           top: pos && pos.top ? `calc(${pos.top}px + 1.5rem)` : 'calc(20%)',
           left: isMobile ? 0 : pos && pos.left ? pos.left  + 'px' : 'calc(50% - 300px)',
           bottom: isMobile ? 0 : null,
           margin: 0,
           padding: 0
         }"
            :mask="true"
            :closable="true"
            @on-visible-change="(status) => !status ? $emit('close') : null"
            sticky
            transfer
            footer-hide>
    <v-card class="emote-tab card-enlargement-flavor pa-10 ma-n10">
      <v-tabs v-model="emoteTabValue" size="small">
        <v-tab
            :value="i.name"
            :label="(h) => emoTeTabTitle(h, i)"
            v-for="(i, index) in emojis.child" :key="index">
          {{ i.name }}
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="emoteTabValue">
        <v-tabs-window-item class="emote-row-box pt-7" v-for="(i, index) in emojis.child" :key="index"
                            :value="i.name">
          <v-card :padding="3" dis-hover class="emote-item pa-1"
                @mouseenter.native="handleMouseEnter(i,j)"
                @mouseleave.native="handleMouseLeave(i,j)"
                v-for="(j, j_index) in i.child" :key="j_index">
            <EmoteItem :isSpan="false" :size="30" :id="`${i.name}|${j.name}`"
                       @click.native="onFinish(i.name,j)"></EmoteItem>
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
    max-height: 200px;
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
