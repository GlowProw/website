import {mergeAttributes, Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
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
            },
        }
    },
    parseHTML() {
        return [{
            tag: 'span',
            getAttrs: (node) => {
                const {id} = node.dataset;
                return {
                    id,
                }
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(HTMLAttributes);
        return ['span', {}, `[${attrs.id}]`]
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
});

export {
    EmoteNode,
}
