<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {Editor, EditorContent, EditorOptions} from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import {EmoteNode as EmoteWidget} from './emote/index'
import {ItemNode as ItemWidget} from './item/index'
import {ShipNode as ShipWidget} from './ship/index'
import ShipView from '../ShipView.vue'
import ItemView from '../ItemView.vue'
import EmoteView from '../EmoteView.vue'
import SafeSpan from "./SafeSpan";

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
    default: 500
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
  modelValue: {
    type: String,
    default: ''
  },
  toolbar: {
    type: Array as () => Array<string | ToolbarItem>,
    default: () => ['emote', 'item', 'ship']
  }
})

const emit = defineEmits(['update:modelValue'])

const tiptap = ref<Editor | null>(null)
const isOpenEmoji = ref(false)
const isOpenShip = ref(false)
const isOpenItem = ref(false)
const editorContent = ref(props.modelValue)
const emoteWidget = ref<InstanceType<typeof EmoteView> | null>(null)
const shipWidget = ref<InstanceType<typeof ShipView> | null>(null)
const itemWidget = ref<InstanceType<typeof ItemView> | null>(null)
const tiptapTextEditor = ref<HTMLElement | null>(null)

const editor = computed(() => tiptap.value)

const toolbarAs = computed(() => {
  return flatMap(props.toolbar, item => {
    if (typeof item === 'string') return item
    return item.map((obj: ToolbarItem) => obj.list || obj || '')
  })
})

const flatMap = (array: any[], callback: (item: any) => any) => {
  return array.reduce((acc: any[], item: any) => {
    const result = callback(item)
    return acc.concat(Array.isArray(result) ? result : [result])
  }, [])
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

const onItem = () => {
  if (itemWidget.value && !editor.value?.isFocused) {
    itemWidget.value.openPanel()
    isOpenItem.value = true
  }
}

const onInsertItem = (id: string) => {
  editor.value?.commands.insertItem({id})
  isOpenShip.value = false
}

const onInsertShip = (id: string) => {
  editor.value?.commands.insertShip({id})
  isOpenShip.value = false
}

const onInsertEmote = (type: string, val: { name: string }) => {
  editor.value?.commands.insertEmote({id: `${type}|${val.name}`})
  isOpenEmoji.value = false
}

const onEditorChange = (data: string) => {
  if (props.disabled && !data) return

  emit('update:modelValue', data)
}

onMounted(() => {
  tiptap.value = new Editor({
    content: editorContent.value,
    parseOptions: {
      preserveWhitespace: 'full'
    },
    editable: !props.readonly,
    enablePasteRules: ['code'],
    injectCSS: false,
    editorProps: {},
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        heading: false
      }),
      Paragraph,
      Placeholder.configure({
        placeholder: props.placeholder
      }),
      ItemWidget,
      ShipWidget,
      // EmoteWidget
    ],
    onCreate({editor}) {
      editor.options.keyboardShortcuts = {}
    },
    onUpdate({editor}) {
      onEditorChange(editor.isEmpty ? '' : editor.getHTML())
    }
  } as Partial<EditorOptions>)
  tiptap.value.options.keyboardShortcuts = {}
})

onBeforeUnmount(() => {
  tiptap.value?.destroy()
})

watch(() => props.modelValue, (newVal) => {
  if (newVal !== editorContent.value) {
    editorContent.value = newVal
    if (tiptap.value?.getHTML() !== newVal) {
      tiptap.value?.commands.setContent(newVal, false)
    }
  }
})
</script>

<template>
  <v-card v-if="tiptap" class="container html-widget-box bg-transparent">
    <div class="mb-3 control-group editor-toolbar" v-if="!props.readonly">
      <v-row :gutter="20" type="flex" align="middle">
        <v-col>
          <div class="bg-transparent">
            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onEmote"
                :disabled="isOpenEmoji"
                v-if="toolbarAs.indexOf('emote') >= 0"
            >
              <v-icon icon="mdi-emoticon-happy-outline"></v-icon>
            </v-btn>

            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onShip"
                :disabled="isOpenEmoji"
                v-if="toolbarAs.indexOf('ship') >= 0"
            >
              <v-icon icon="mdi-ship-wheel"></v-icon>
            </v-btn>

            <v-btn
                icon
                class="btn mr-2"
                density="compact"
                @click="onItem"
                :disabled="isOpenEmoji"
                v-if="toolbarAs.indexOf('item') >= 0"
            >
              <v-icon icon="mdi-cube-outline"></v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </div>

    <slot></slot>
    <EditorContent
        class="editor pt-2 html-widget-size-default timeline-description"
        ref="tiptapTextEditor"
        :style="`min-height:${height}`"
        :editor="tiptap"/>

    <ItemView ref="itemWidget" :editor="tiptap" @finish="onInsertItem" @close="() => isOpenItem = false"/>
    <ShipView ref="shipWidget" :editor="tiptap" @finish="onInsertShip" @close="() => isOpenEmoji = false"/>
    <EmoteView ref="emoteWidget" :editor="tiptap" @finish="onInsertEmote" @close="() => isOpenEmoji = false"/>
  </v-card>
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
      text-indent: 0px !important;
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
