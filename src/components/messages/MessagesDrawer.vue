<script setup lang="ts">
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import SwipeDrawer from "@/components/SwipeDrawer.vue";
import MessagesPanel from "@/components/messages/MessagesPanel.vue";
import {useMessagesDrawerStore} from "~/stores/messagesDrawerStore";

const {t} = useI18n();
const drawerStore = useMessagesDrawerStore();
const {open} = storeToRefs(drawerStore);

defineOptions({name: 'MessagesDrawer'});
</script>

<template>
  <SwipeDrawer v-model="open" side="right">
    <v-card tile variant="text" class="messages-drawer d-flex flex-column h-100 border-l">
      <!-- 抽屉标题栏 -->
      <div class="d-flex align-center px-4 py-2 border-bottom flex-shrink-0">
        <span class="text-h6">{{ t('account.messages.title') }}</span>
        <v-spacer></v-spacer>
        <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('common.close')"
            @click="drawerStore.setOpen(false)"></v-btn>
      </div>

      <!-- 消息面板 -->
      <div class="messages-drawer__body flex-grow-1 mx-3">
        <MessagesPanel embedded :active="open"></MessagesPanel>
      </div>
    </v-card>
  </SwipeDrawer>
</template>

<style scoped>
.messages-drawer__body {
  min-height: 0;
  overflow-y: auto;
}

/* lg 断点以上两栏固定，由面板内部列表/消息区自行滚动 */
@media (min-width: 1280px) {
  .messages-drawer__body {
    overflow-y: hidden;
  }
}
</style>
