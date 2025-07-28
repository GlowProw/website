<script>
import {Editor} from "@tiptap/vue-3";

import {Ships} from "glow-prow-data";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "./snbWidget/shipIconWidget.vue";

export default {
  components: {ShipWidget: ShipIconWidget, ItemSlotBase},
  props: {
    editor: {
      type: Editor,
    }
  },
  data() {
    return {
      show: false,
    }
  },
  created() {
  },
  methods: {
    /**
     * 完成
     * @param val
     */
    onFinish(id) {
      this.onPanelToggle();
      this.$emit('finish', id)
    },
    /**
     * 面板开关
     */
    onPanelToggle() {
      this.show = !this.show;

      if (this.show === false)
        this.$emit('close');
    },
    /**
     * 打开面板
     */
    openPanel() {
      this.onPanelToggle();
    },
  },
  computed: {
    ships: () => Ships,
  }
}
</script>

<template>
  <v-dialog v-model="show"
            class="ship"
            class-name="ship-window-box"
            :width="600"
            @on-visible-change="(status) => !status ? $emit('close') : null"
            sticky
            transfer
            footer-hide>
    <v-card class="pa-10 card-flavor">
      <v-row>
        <v-col v-for="(i, index) in ships" :key="index">
          <ItemSlotBase size="80px"
                        @click="onFinish(i.id)">
            <ShipWidget :id="i.id" :is-show-open-detail="false"
                        :is-click-open-detail="false"></ShipWidget>
          </ItemSlotBase>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.ship {
  .insert-preview {
    position: absolute;
    top: -50px;
    left: 1px;
  }

  .ship-tab {
    margin: -10px -16px -16px -16px;

    .ivu-tabs-bar {
      margin-bottom: 0;
    }
  }

  .ship-row-box {
    background-color: rgba(0, 0, 0, 0.01);
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-row-gap: 10px;
    grid-column-gap: 10px;
    padding: 10px;
    margin-top: -17px;
    height: calc(100% + 17px);
    max-height: 200px;
    overflow-y: auto;

    .ship-item {
      width: 38px;
      height: 38px;
    }
  }
}

.ship-window-box {
  .ivu-modal {
    margin: 0 !important;
  }
}
</style>
