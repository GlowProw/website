import {mergeAttributes, Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const ImgNode = Node.create({
    name: 'Img',
    group: 'inline',
    topNode: false,
    atom: true,
    inline: true,
    selectable: true,
    draggable: false,
    addAttributes() {
        return {
            src: {
                default: null
            }
        }
    },
    parseHTML() {
        return [{
            tag: 'img',
            getAttrs: (node) => {
                return {
                    src: node.getAttribute('src'),
                }
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(HTMLAttributes);
        return ['img', {src: attrs.src}, attrs.src || '']
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertImg: (src) => ({chain}: { commands: any }) => {
                return chain()
                    .insertContent([
                        {
                            type: this.name,
                            updateSelection: true,
                            attrs: {
                                src
                            }
                        },
                        {type: 'paragraph'}
                    ])
                    .run();
            },
        } as Partial<RawCommands>
    },
});

export {
    ImgNode,
}
