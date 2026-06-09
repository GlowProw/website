import {mergeAttributes, Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const LangNode = Node.create({
    name: 'Lang',
    group: 'block',
    content: 'block+',
    addAttributes() {
        return {
            lang: {
                default: 'zh-CN',
                parseHTML: element => element.getAttribute('data-lang'),
                renderHTML: attributes => {
                    if (!attributes.lang) return {}
                    return {'data-lang': attributes.lang}
                }
            },
        }
    },
    parseHTML() {
        return [{
            tag: 'div[data-lang]',
            getAttrs: (node) => {
                if (typeof node === 'string') return null
                return {
                    lang: node.getAttribute('data-lang')
                }
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        return ['div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'lang' }),
            0
        ]
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertLang: (options: { lang: string }) => ({commands, editor}: { commands: any, editor: any }) => {
                if (editor.isActive('Lang')) {
                    return false
                }
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        lang: options.lang
                    },
                    content: [
                        {
                            type: 'paragraph'
                        }
                    ]
                })
            },
        } as Partial<RawCommands>
    },
})

export {
    LangNode,
}
