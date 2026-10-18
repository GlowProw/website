<template>
  <div class="user-avatar" :style="`width:${size}px;height:${size}px`">
    <v-avatar
        icon="ios-person"
        :shape="shape"
        :rounded="tile ? 0 : ''"
        :size="size"
        v-if="imageStatus !== 1">
    </v-avatar>

    <v-avatar :size="size" rounded="0">
      <img :src="newSrc"
           :style="`width:${size}px;height:${size}px`"
           class="ivu-avatar-square"
           v-show="imageStatus === 1"
           @load="imageStatus = 1"
           @error="loadImageError"/>
    </v-avatar>
  </div>
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
  position: relative;
  display: flex;
}
</style>
