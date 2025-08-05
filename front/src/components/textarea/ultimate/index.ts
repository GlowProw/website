import {Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const UltimateNode = Node.create({
    name: 'Ultimate',
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
            tag: 'span[data-type="ultimate"]',
            getAttrs: (node) => {
                if (typeof node === 'string') return null
                const id = node.getAttribute('data-id')
                return {id}
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        return ['span',
            {
                'data-type': 'ultimate',
            },
            `[${HTMLAttributes.id || HTMLAttributes['data-id']}]`
        ]
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertUltimate: (options: { id: string }) => ({commands}: { commands: any }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        id: options.id
                    }
                })
            },
        } as Partial<RawCommands>
    },
});

export {
    UltimateNode,
}
