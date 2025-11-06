<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, Ref, ref, watch} from 'vue'
import {Editor, EditorContent, EditorOptions, Extension} from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {ItemNode as ItemWidget} from './item/index'
import {ShipNode as ShipWidget} from './ship/index'
import {EmoteNode as EmoteWidget} from './emote/index'
import {UltimateNode as UltimatesWidget} from './ultimate/index'
import {ModNode as ModWidget} from './mod/index'
import {LinkNode as LinkWidget} from './link/index'
import {ImgNode as ImgWidget} from './img/index'
import {VideoNode as VideoWidget} from './video/index'

import ShipView from '../ShipView.vue'
import ItemView from '../ItemView.vue'
import EmoteView from '../EmoteView.vue'
import UltimateView from "../UltimateView.vue";
import ModView from "../ModView.vue"
import {useI18n} from "vue-i18n";
import LinkView from "@/components/LinkView.vue";
import ImgView from "@/components/ImgView.vue";
import VideoView from "@/components/VideoView.vue";

interface ToolbarItem {
  list?: any

  [key: string]: any
}

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  maxlength: {
    type: Number,
    default: 5000
  },
  minHeight: {
    type: String,
    default: '200px'
  },
  height: {
    type: String,
    default: '200px'
  },
  readonly: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  value: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  toolbar: {
    type: Array as () => Array<string | ToolbarItem>,
    default: () => ['link', 'img', 'video', 'emote', 'item', 'ship', 'mod', 'ultimate']
  }
})

const emit = defineEmits([
      'update:modelValue',
      'focused', 'ready', 'blur'
    ]),
    {t} = useI18n(),

    tiptap: Ref<Editor> = ref<Editor | null>(null),
    isOpenEmoji = ref(false),
    isOpenMod = ref(false),
    isOpenUltimate = ref(false),
    isOpenLink = ref(false),
    isOpenImg = ref(false),
    isOpenVideo = ref(false),
    isOpenShip = ref(false),
    isOpenItem = ref(false),

    // editor widgets
    editorContent = ref(props.modelValue),
    linkWidget = ref<InstanceType<typeof LinkWidget> | null>(null),
    imgWidget = ref<InstanceType<typeof ImgWidget> | null>(null),
    videoWidget = ref<InstanceType<typeof VideoWidget> | null>(null),
    emoteWidget = ref<InstanceType<typeof EmoteView> | null>(null),
    shipWidget = ref<InstanceType<typeof ShipView> | null>(null),
    itemWidget = ref<InstanceType<typeof ItemView> | null>(null),
    modWidget = ref<InstanceType<typeof ModView> | null>(null),
    ultimateWidget = ref<InstanceType<typeof UltimateView> | null>(null)

const
    tiptapTextEditor = ref<HTMLElement | null>(null),
    editor = computed(() => tiptap.value),
    toolbarAs = computed(() => {
      return flatMap(props.toolbar, item => {
        if (typeof item === 'string') return item
        return item.map((obj: ToolbarItem) => obj.list || obj || '')
      })
    })

watch(() => props.readonly, (value) => {
  tiptap.value.options.editable = !value;
})

watch(() => props.value, (value) => {
  if (value) {
    editorContent.value = value
    tiptap.value?.commands.setContent(value, false)
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal !== editorContent.value) {
    editorContent.value = newVal
    if (tiptap.value?.getHTML() !== newVal) {
      tiptap.value?.commands.setContent(newVal, false)
    }
  }
})

onMounted(() => {
  onInitEdit()
})

onBeforeUnmount(() => {
  tiptap.value?.destroy()
})

const MaxLength = Extension.create({
  addKeyboardShortcuts() {
    return {
      Enter: ({editor}) => {
        if (editor.getText().length >= props.maxlength) {
          // 阻止换行
          return true;
        }
        return false;
      },
    };
  },
  addCommands() {
    return {
      enforceMaxLength: () => ({commands}) => {
        const html = this.editor.getHTML();
        if (html.length > props.maxlength) {
          return commands.setContent(html.slice(0, props.maxlength - 3));
        }
        return true;
      },
    };
  },
  onUpdate() {
    this.editor.commands.enforceMaxLength();
  },
});

const flatMap = (array: any[], callback: (item: any) => any) => {
  return array.reduce((acc: any[], item: any) => {
    const result = callback(item)
    return acc.concat(Array.isArray(result) ? result : [result])
  }, [])
}

const onLink = () => {
  if (linkWidget.value && !editor.value?.isFocused) {
    linkWidget.value.openPanel()
    isOpenLink.value = true
  }
}

const onImg = () => {
  if (imgWidget.value && !editor.value?.isFocused) {
    imgWidget.value.openPanel()
    isOpenImg.value = true
  }
}

const onVideo = () => {
  if (videoWidget.value && !editor.value?.isFocused) {
    videoWidget.value.openPanel()
    isOpenVideo.value = true
  }
}

const onEmote = () => {
  if (emoteWidget.value && !editor.value?.isFocused) {
    emoteWidget.value.openPanel()
    isOpenEmoji.value = true
  }
}

const onShip = () => {
  if (shipWidget.value && !editor.value?.isFocused) {
    shipWidget.value.openPanel()
    isOpenShip.value = true
  }
}

const onItem = (tags = []) => {
  if (itemWidget.value && !editor.value?.isFocused) {
    itemWidget.value.openPanel(tags)
    isOpenItem.value = true
  }
}

const onMod = () => {
  if (modWidget.value && !editor.value?.isFocused) {
    modWidget.value.openPanel()
    isOpenMod.value = true
  }
}

const onUltimate = () => {
  if (ultimateWidget.value && !editor.value?.isFocused) {
    ultimateWidget.value.openPanel()
    isOpenUltimate.value = true
  }
}

const onInsertLink = (href: string, text: string) => {
  editor.value?.commands.insertLink(href, text)
  isOpenLink.value = false
}

const onInsertImg = (src: string) => {
  editor.value?.commands.insertImg(src)
  isOpenImg.value = false
}

const onInsertVideo = (src: string) => {
  editor.value?.commands.insertVideo(src)
  isOpenVideo.value = false
}

const onInsertItem = (id: string) => {
  editor.value?.commands.insertItem({id})
  isOpenItem.value = false
}

const onInsertShip = (id: string) => {
  editor.value?.commands.insertShip({id})
  isOpenShip.value = false
}

const onInsertEmote = (type: string, val: { name: string }) => {
  editor.value?.commands.insertEmote({id: `${type}|${val.name}`})
  isOpenEmoji.value = false
}

const onInsertUltimate = (id: string) => {
  editor.value?.commands.insertUltimate({id})
  isOpenUltimate.value = !isOpenUltimate
}

const onInsertMod = (id: string) => {
  editor.value?.commands.insertMod({id})
  isOpenMod.value = !isOpenMod
}

const onEditorChange = (data: string) => {
  if (props.disabled && !data) return

  emit('update:modelValue', data)
}

const onInitEdit = () => {
  tiptap.value = new Editor({
    content: editorContent.value || props.value,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editable: !props.readonly,
    enablePasteRules: ['code'],
    injectCSS: false,
    editorProps: {},
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        heading: false,
        paragraph: true
      }),
      Placeholder.configure({
        placeholder: props.placeholder
      }),
      MaxLength,

      LinkWidget,
      ImgWidget,
      VideoWidget,
      ItemWidget,
      ShipWidget,
      EmoteWidget,
      UltimatesWidget,
      ModWidget
    ],
    onCreate({editor}) {
      editor.options.keyboardShortcuts = {}
      emit('ready', editor)
    },
    onBlur({editor}) {
      emit('blur', editor.isEmpty ? '' : editor.getHTML())
    },
    onFocus({editor}) {
      emit('focused', editor.isEmpty ? '' : editor.getHTML())
    },
    onUpdate({editor}) {
      // const html = editor.getHTML();
      // if (html.length > props.maxlength) {
      //   // 撤销最后一步操作
      //   editor.commands.undo();
      //   // 截断 HTML
      //   const truncatedHTML = html.slice(0, props.maxlength);
      //   editor.commands.setContent(truncatedHTML);
      // }

      onEditorChange(editor.isEmpty ? '' : editor.getHTML())
    }
  } as Partial<EditorOptions>)
  tiptap.value.options.keyboardShortcuts = {}
}
</script>

<template>
  <div v-if="tiptap" class="container html-widget-box bg-transparent">
    <div class="mb-3 control-group editor-toolbar" v-if="!props.readonly">
      <v-row :gutter="20" type="flex" align="center">
        <v-col>
          <div class="bg-transparent">
            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onLink"
                :disabled="isOpenLink"
                v-if="toolbarAs.indexOf('link') >= 0">
              <v-icon icon="mdi-link"></v-icon>
            </v-btn>
            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onImg"
                :disabled="isOpenImg"
                v-if="toolbarAs.indexOf('img') >= 0">
              <v-icon icon="mdi-image-outline"></v-icon>
            </v-btn>
            <v-btn
                icon
                class="btn mr-5"
                density="compact"
                @click="onVideo"
                :disabled="isOpenVideo"
                v-if="toolbarAs.indexOf('video') >= 0">
              <v-icon icon="mdi-video-outline"></v-icon>
            </v-btn>

            <v-btn
                icon
                class="btn mr-5"
                density="compact"
                @click="onEmote"
                :disabled="isOpenEmoji"
                v-if="toolbarAs.indexOf('emote') >= 0">
              <v-icon icon="mdi-emoticon-happy-outline"></v-icon>
            </v-btn>

            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onShip"
                v-tooltip="'船'"
                :disabled="isOpenShip"
                v-if="toolbarAs.indexOf('ship') >= 0">
              <v-icon icon="mdi-ship-wheel"></v-icon>
            </v-btn>

            <v-menu location="bottom right">
              <template v-slot:activator="{ props }">
                <v-btn
                    icon
                    class="btn mr-2"
                    density="compact"
                    v-tooltip="'物品'"
                    v-bind="props"
                    :disabled="isOpenItem"
                    v-if="toolbarAs.indexOf('item') >= 0">
                  <v-icon icon="mdi-cube-outline"></v-icon>
                </v-btn>
              </template>

              <v-list min-width="300" density="compact">
                <v-list-item link>
                  <v-list-item-title
                      @click="onItem(['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo'])">
                    {{ t('assembly.workshop.weaponTitle') }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-open-in-new</v-icon>
                  </template>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title @click="onItem(['shipUpgrade'])">
                    {{ t('codex.type.shipUpgrade') }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-open-in-new</v-icon>
                  </template>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title @click="onItem([ 'majorFurniture','offensiveFurniture', 'utilityFurniture'])">
                    {{ t('codex.type.offensiveFurniture') }},
                    {{ t('codex.type.offensiveFurniture') }},
                    {{ t('codex.type.utilityFurniture') }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-open-in-new</v-icon>
                  </template>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title @click="onItem([ 'consumable'])">
                    {{ t('codex.type.consumable') }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-open-in-new</v-icon>
                  </template>
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title @click="onItem(['tool','chest'])">
                    {{ t('codex.type.tool') }},
                    {{ t('codex.type.chest') }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-open-in-new</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>


            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onMod"
                v-tooltip="'模组'"
                :disabled="isOpenMod"
                v-if="toolbarAs.indexOf('mod') >= 0">
              <v-icon icon="mdi-puzzle-outline"></v-icon>
            </v-btn>

            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onUltimate"
                v-tooltip="'终结技能'"
                :disabled="isOpenUltimate"
                v-if="toolbarAs.indexOf('ultimate') >= 0">
              <v-icon icon="mdi-multiplication"></v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </div>

    <slot></slot>
    <EditorContent
        class="editor pt-2 html-widget-size-default timeline-description"
        ref="tiptapTextEditor"
        :style="`min-height:${minHeight}`"
        :editor="tiptap"/>

    <LinkView ref="linkWidget" :editor="tiptap" @finish="onInsertLink" @close="() => isOpenLink = false"/>
    <ImgView ref="imgWidget" :editor="tiptap" @finish="onInsertImg" @close="() => isOpenImg = false"/>
    <VideoView ref="videoWidget" :editor="tiptap" @finish="onInsertVideo" @close="() => isOpenVideo = false"/>
    <ItemView ref="itemWidget" :editor="tiptap" @finish="onInsertItem" @close="() => isOpenItem = false"/>
    <ShipView ref="shipWidget" :editor="tiptap" @finish="onInsertShip" @close="() => isOpenShip = false"/>
    <UltimateView ref="ultimateWidget" :editor="tiptap" @finish="onInsertUltimate" @close="() => isOpenUltimate = false"/>
    <ModView ref="modWidget" :editor="tiptap" @finish="onInsertMod" @close="() => isOpenMod = false"/>
    <EmoteView ref="emoteWidget" :editor="tiptap" @finish="onInsertEmote" @close="() => isOpenEmoji = false"/>
  </div>
</template>

<style lang="less">
.tiptap {
  font-family: "Ionicons", sans-serif;

  :first-child {
    margin-top: 0;
  }

  &:focus-visible {
    outline: none !important;
    border: none !important;
  }

  :first-child {
    margin-top: 0;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin: 0 1rem 1.25rem 0.4rem;

    ::marker {
      unicode-bidi: isolate;
      font-variant-numeric: tabular-nums;
      text-transform: none;
      text-indent: 0 !important;
      text-align: start !important;
      text-align-last: start !important;
    }

    li p {
      outline: none;
      margin-top: 0.1em;
      margin-bottom: 0.1em;
    }
  }

  p.is-editor-empty:first-child::before {
    white-space: break-spaces;
    color: var(--gray-4);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    line-height: 1.5;
    pointer-events: none;
    opacity: .8;
  }

  p .ProseMirror-separator {
    display: none;
  }
}
</style>
