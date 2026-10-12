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
        return ['img', mergeAttributes(HTMLAttributes)]
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertImg: (src: string | { src: string }) => ({ commands }: any) => {
                const imgSrc = typeof src === 'string' ? src : (src as any)?.src;
                return commands.insertContent({
                    type: 'Img',
                    attrs: {
                        src: imgSrc,
                    },
                });
            },
        } as Partial<RawCommands>
    },
})

export {
    ImgNode,
}
