<template>
  <v-avatar
      icon="ios-person"
      class="user-avatar d-flex justify-center align-center bg-black"
      :shape="shape"
      :rounded="tile ? 0 : ''"
      :size="size"
      :image="newSrc">
    <img :src="newSrc"
         width="100%"
         height="100%"
         v-show="imageStatus === 1"
         class="ivu-avatar-square"
         @load="imageStatus = 1"
         @error="loadImageError"/>
    <v-icon :size="size / 2.4" class="opacity-60" v-show="imageStatus === 0">mdi-account</v-icon>
  </v-avatar>
</template>

<script>
import Loading from "@/components/Loading.vue";
import {normalizeAvatarUrl} from "@/assets/sripts/avatar";

export default {
  components: {Loading},
  props: {
    size: {
      type: [Number, String],
      default: 150
    },
    tile: {
      type: Boolean,
      default: false
    },
    shape: {
      type: String,
      validator(value) {
        return 'circle';
      },
      default: 'square'
    },
    src: {
      type: String,
      default: ""
    },
  },
  data() {
    return {
      imageStatus: 0,
      newSrc: '',

      jxIndex: 0,
      jx: [
        "https://gravatar.loli.net/avatar/",
        "https://cdn.v2ex.com/gravatar/",
        "https://cdn.sep.cc/avatar/",
      ]
    }
  },
  watch: {
    src: {
      immediate: true,
      handler(value) {
        this.imageStatus = 0;
        this.jxIndex = 0;
        this.newSrc = normalizeAvatarUrl(value);
      }
    }
  },
  created() {
    this.newSrc = normalizeAvatarUrl(this.src);
  },
  methods: {
    loadImageError() {
      if (this.jxIndex >= -1) {
        this.newSrc = this.newSrc.replaceAll(
            this.jxIndex === 0 ? 'https://www.gravatar.com/avatar/' : this.jx[this.jxIndex - 1],
            this.jx[this.jxIndex]
        )
        this.jxIndex += 1;
      }
    },
  }
}
</script>

<style scoped lang="less">
.user-avatar {
}
</style>
