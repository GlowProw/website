import {mergeAttributes, Node, type RawCommands, VueNodeViewRenderer} from "@tiptap/vue-3"
import Component from "./view.vue";

const VideoNode = Node.create({
    name: 'Video',
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
            tag: 'video',
            getAttrs: (node) => {
                return {
                    src: node.getAttribute('src'),
                }
            },
        }]
    },
    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(HTMLAttributes)
        return ['video', {src: attrs.src}, attrs.src || '']
    },
    addNodeView() {
        return VueNodeViewRenderer(Component)
    },
    addCommands() {
        return {
            insertVideo: (src) => ({chain}: { commands: any }) => {
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
                    .run()
            },
        } as Partial<RawCommands>
    },
})

export {
    VideoNode,
}
