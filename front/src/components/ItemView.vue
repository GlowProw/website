<script>
import {Editor} from "@tiptap/vue-3";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "./snbWidget/shipIconWidget.vue";
import ItemIconWidget from "./snbWidget/itemIconWidget.vue";
import {Items} from 'glow-prow-data/src/entity/Items.js'

export default {
  components: {ItemIconWidget, ShipWidget: ShipIconWidget, ItemSlotBase},
  props: {
    editor: {
      type: Editor,
    }
  },
  data() {
    return {
      show: false,
      items: '',
      value: ''
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
    items: () => Items,
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
    <v-card class="pl-10 pr-10 pt-10 card-flavor">
      <v-row>
        <ItemSlotBase size="60px" v-if="value">
          <ItemIconWidget :id="value"></ItemIconWidget>
        </ItemSlotBase>
        <ItemSlotBase size="60px" class="d-flex justify-center align-center" v-else>
          <v-icon icon="mdi-close-octagon-outline"/>
        </ItemSlotBase>
        <v-combobox
            v-model="value"
            v-model:search="value"
            :hide-no-data="false"
            :items="Object.values(items)"
            hide-selected
            item-value="id"
            item-title="id"
            class="ml-4"
            clearable
            persistent-hint>
          <template v-slot:details>
            请输入id来选中物体，id列表可见
            <router-link to="/display-cabinet">这里</router-link>
            <v-icon icon="mdi-share"></v-icon>
          </template>
        </v-combobox>
      </v-row>

      <v-card-actions class="mt-4">
        <v-btn @click="onFinish(value)" block :disabled="!value || !items[value]" class="bg-amber">
          确定
        </v-btn>
      </v-card-actions>
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
