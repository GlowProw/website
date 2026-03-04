import {Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const EmoteNode = Node.create({
    name: 'Emote',
    group: 'inline',
    topNode: false,
    atom: true,
    inline: true,
    selectable: true,
    draggable: false,
    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => {
                    const text = element.textContent?.trim() || '';
                    return text.match(/^\[(.*?)\]$/)?.[1] || element.getAttribute('data-id') || null;
                },
                renderHTML: attributes => {
                    if (!attributes.id) return {}
                    return {'data-id': attributes.id}
                }
            },
        }
    },
    parseHTML() {
        return [{
            tag: 'span[data-type="emote"]',
            getAttrs: (node) => {
                const {id} = node.dataset;
                return {id}
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        return ['span',
            {
                'data-type': 'emote',
            },
            `[${HTMLAttributes.id || HTMLAttributes['data-id']}]`
        ]
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertEmote: ({id}: { id: any }) => ({commands}: { commands: any }) => {
                return commands.insertContent({
                    type: 'Emote',
                    attrs: {
                        id,
                    }
                })
            },
        } as Partial<RawCommands>
    },
})

export {
    EmoteNode,
}
