<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {io, Socket} from "socket.io-client";
import {useRoute} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import {useMessagesUnreadStore} from "~/stores/messagesUnreadStore";
import {type Conversation, type MessageItem, useMessagesApi} from "@/assets/sripts/api/messages_service";
import {storage} from "@/assets/sripts";
import AffixContainerView from "@/components/AffixContainerView.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useDisplay} from "vuetify/framework";

const {t} = useI18n();
const auth = useAuthStore();
const unreadStore = useMessagesUnreadStore();
const route = useRoute();
const api = useMessagesApi();
const {height} = useDisplay()

const filterTab = ref<'all' | 'user' | 'system'>('all');
const conversations = ref<Conversation[]>([]);
const activeConv = ref<Conversation | null>(null);
const pendingPeerId = ref<string | null>(null); // 还没有会话但准备发消息的对象
const pendingPeerName = ref<string | null>(null); // pendingPeerId 对应的显示名
const messages = ref<MessageItem[]>([]);
const input = ref('');
const sending = ref(false);
const loading = ref(false);
const loadingHistory = ref(false);
const hasMoreMessages = ref(false); // 是否还有更早的消息可以加载
const totalMessages = ref(0);
const bottomEl = ref<HTMLElement | null>(null);
const confirmDelete = ref<Conversation | null>(null); // 待删除的会话

const myId = computed(() => String(auth.user?.userId || ''));
const isSystemConv = computed(() => activeConv.value?.type === 'system');
const canSendMessage = computed(() => activeConv.value && !isSystemConv.value || !!pendingPeerId.value);

const displayedConvs = computed(() => {
  if (filterTab.value === 'all') return conversations.value;
  return conversations.value.filter(c => filterTab.value === 'user' ? c.type === 'user' : c.type === 'system');
});

const totalUnread = computed(() =>
    displayedConvs.value.reduce((s, c) => s + (c.unreadCount || 0), 0)
);

const endpoint = computed(() => {
  if (typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.host}`;
});

const notifyIconMap: Record<string, string> = {
  reply: 'mdi-reply',
  like: 'mdi-heart',
  warn: 'mdi-alert',
  info: 'mdi-information',
};

let socket: Socket | null = null;
// 本地缓存 messages — key 按会话 ID 区分
const LS_MSGS_PREFIX = 'gp:msgs:';
const LS_MAX_MSGS_PER_CONV = 200; // 本地最多存 200 条

watch(filterTab, () => loadConversations());

onMounted(async () => {
  await loadConversations();
  const peerId = route.query.peerId as string;
  if (peerId) {
    await openOrCreateUserConv(peerId);
  }
  initSocket();
});

onBeforeUnmount(() => {
  socket?.disconnect();
  socket = null;
});

const scrollToBottom = async () => {
  await nextTick();
  if (bottomEl.value) bottomEl.value.scrollIntoView({behavior: 'smooth'});
};

const cacheMessagesLocal = (convId: number, msgs: MessageItem[]) => {
  try {
    const key = LS_MSGS_PREFIX + convId;
    // 合并已有缓存，去重
    const existing = loadMessagesLocal(convId);
    const merged = [...existing];
    for (const m of msgs) {
      if (!merged.find(x => Number(x.id) === Number(m.id))) merged.push(m);
    }
    merged.sort((a, b) => Number(a.id) - Number(b.id));
    // 只保留最新的 LS_MAX 条
    storage.local.set(key, merged.slice(-LS_MAX_MSGS_PER_CONV));
  } catch {
  }
};

const loadMessagesLocal = (convId: number): MessageItem[] => {
  try {
    const res = storage.local.get(LS_MSGS_PREFIX + convId);
    if (res.code !== 0 || !Array.isArray(res.data?.value)) return [];
    return res.data.value as MessageItem[];
  } catch {
    return [];
  }
};

const loadConversations = async () => {
  loading.value = true;
  try {
    const rows = await api.getConversations();
    conversations.value = rows;
    // 与未读状态机对账（全部会话维度，不受 filterTab 影响）
    unreadStore.setUnread(rows.reduce((s, c) => s + (c.unreadCount || 0), 0));
  } finally {
    loading.value = false;
  }
};

const markAllRead = async () => {
  if (totalUnread.value === 0) return;
  await api.markAllRead();
  conversations.value.forEach(c => c.unreadCount = 0);
  unreadStore.reset();
};

const doDeleteConv = async () => {
  const c = confirmDelete.value;
  if (!c) return;
  await api.deleteConversation(c.id);
  unreadStore.subtract(c.unreadCount || 0);
  conversations.value = conversations.value.filter(x => x.id !== c.id);
  if (activeConv.value?.id === c.id) {
    activeConv.value = null;
    messages.value = [];
    pendingPeerId.value = null;
  }
  confirmDelete.value = null;
};

const onTogglePin = async (conv: Conversation) => {
  await api.togglePin(conv.id, !conv.pinned);
  conv.pinned = conv.pinned ? 0 : 1;
  // 重排
  conversations.value.sort((a, b) => {
    if ((b.pinned || 0) !== (a.pinned || 0)) return (b.pinned || 0) - (a.pinned || 0);
    return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
  });
};

const deleteDialog = computed({
  get: () => !!confirmDelete.value,
  set: (v: boolean) => {
    if (!v) confirmDelete.value = null;
  }
});

const openConversation = async (conv: Conversation) => {
  if (!conv?.id) return;
  pendingPeerId.value = null;
  loadingHistory.value = false;
  activeConv.value = conv;
  await api.markRead(conv.id);
  unreadStore.subtract(conv.unreadCount || 0);
  conv.unreadCount = 0;

  // 先展示本地缓存（秒开体验），同时从服务器拉最新
  const localMsgs = loadMessagesLocal(conv.id);
  messages.value = localMsgs;

  const data = await api.getConversation(conv.id, {limit: 50});
  if (data) {
    messages.value = data.messages;
    totalMessages.value = data.total;
    // 判断是否还有更早的消息 — 服务器返回的条数 < total 就说明有更多
    hasMoreMessages.value = data.messages.length < data.total;
    cacheMessagesLocal(conv.id, data.messages);
  }
};

// 加载更早的历史消息（往上翻页）
const loadMoreHistory = async () => {
  if (!activeConv.value || !hasMoreMessages.value || loadingHistory.value) return;
  loadingHistory.value = true;
  // 保存当前滚动位置 + 消息数，加载后恢复
  const scrollEl = document.querySelector('.messages-scroll');
  const prevHeight = scrollEl?.scrollHeight || 0;
  const prevMsgCount = messages.value.length;

  try {
    // 用最老一条消息的 id 作为 beforeId
    const oldestId = messages.value[0]?.id;
    const data = await api.getConversation(activeConv.value.id, {
      beforeId: oldestId,
      limit: 50,
    });
    if (data && data.messages.length) {
      messages.value = [...data.messages, ...messages.value];
      // 判断还有没有更多
      hasMoreMessages.value = messages.value.length < (data.total || totalMessages.value);
      cacheMessagesLocal(activeConv.value.id, data.messages);

      // 恢复滚动位置
      await nextTick();
      if (scrollEl) {
        const newHeight = scrollEl.scrollHeight;
        scrollEl.scrollTop = newHeight - prevHeight;
      }
    } else {
      hasMoreMessages.value = false;
    }
  } finally {
    loadingHistory.value = false;
  }
};

/**
 * 根据 peerId 查找用户会话（从 /space/{id}?peerId=xxx 跳转过来）
 **/
const openOrCreateUserConv = async (peerId: string) => {
  const [a, b] = [myId.value, peerId].sort();
  let conv = conversations.value.find(c => c.type === 'user' && c.userId === a && c.peerId === b && c.valid === 1);
  if (!conv) {
    await loadConversations();
    conv = conversations.value.find(c => c.type === 'user' && c.userId === a && c.peerId === b && c.valid === 1);
  }
  filterTab.value = 'user';
  if (conv) {
    await openConversation(conv);
    pendingPeerId.value = null;
    pendingPeerName.value = null;
  } else {
    // 还没有会话 → 记住 peerId + 拉对方显示名
    activeConv.value = null;
    messages.value = [];
    pendingPeerId.value = peerId;
    pendingPeerName.value = null;
    // 通过公共 user/info 接口获取用户名（避免走带 token 的 fetch，且统一走 vite 代理）
    const info = await api.getUserInfo(peerId);
    pendingPeerName.value = info?.alternativeName || info?.username || null;
    console.log('[MessagesCenter] pendingPeerId=', peerId, 'name=', pendingPeerName.value);
  }
};

const sendMessage = async () => {
  const content = input.value.trim();
  if (!content || sending.value) return;
  if (!activeConv.value && !pendingPeerId.value) return;
  sending.value = true;
  try {
    let peerId: string;
    if (activeConv.value) {
      if (isSystemConv.value) return;
      const conv = activeConv.value;
      peerId = String(conv.userId) === myId.value ? conv.peerId : conv.userId;
    } else {
      peerId = pendingPeerId.value!;
    }
    const data = await api.sendMessage(peerId, content);
    if (data?.message) {
      input.value = '';
      if (data.conversation) {
        // 后端自动创建了会话 → 绑定 + 拉完整消息列表
        const existing = conversations.value.find(c => Number(c.id) === Number(data.conversation.id));
        if (!existing) conversations.value.unshift(data.conversation);
        activeConv.value = data.conversation;
        pendingPeerId.value = null;
        // 新建 conv → 后端返回里 conv.peerName 可能还是创建者视角的名字 → reload 一次
        await loadConversations();
        const reloaded = conversations.value.find(c => Number(c.id) === Number(data.conversation.id));
        if (reloaded) activeConv.value = reloaded;
        // 拉这条 conv 的完整消息列表（新建 conv 后端返回的 data.conversation 没 messages）
        const detail = await api.getConversation(data.conversation.id, {limit: 50});
        if (detail) {
          messages.value = detail.messages;
          totalMessages.value = detail.total;
          hasMoreMessages.value = detail.messages.length < detail.total;
          cacheMessagesLocal(data.conversation.id, detail.messages);
        }
      } else if (activeConv.value) {
        // 已有会话 → 直接 push 新消息 + 更新本地缓存
        messages.value.push(data.message);
        cacheMessagesLocal(activeConv.value.id, [data.message]);
        activeConv.value.lastMessage = content;
        activeConv.value.lastTime = new Date().toISOString();
      }
    }
  } finally {
    sending.value = false;
  }
};

const initSocket = () => {
  if (typeof window === 'undefined') return;
  // token 存在 authStore.user.token 里
  const token = (auth as any).user?.token;
  if (!token) {
    console.warn('[MessagesCenter] no token, skip socket init');
    return;
  }
  socket = io(endpoint.value, {
    query: {token},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 3000,
  });

  socket.on('connect', () => {
    console.log('[MessagesCenter] socket connected', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[MessagesCenter] socket connect failed:', err.message);
  });

  socket.on('message.new', (msg: MessageItem) => {
    if (activeConv.value && Number(msg.conversationId) === Number(activeConv.value.id)) {
      messages.value.push(msg);
    }
    const conv = conversations.value.find(c => Number(c.id) === Number(msg.conversationId));
    if (conv) {
      conv.lastMessage = msg.content;
      conv.lastTime = msg.createdTime;
      if (!activeConv.value || Number(activeConv.value.id) !== Number(conv.id)) {
        conv.unreadCount++;
        unreadStore.bump(1);
      }
    } else {
      loadConversations();
    }
  });
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

defineOptions({
  name: 'AccountMessages'
});
</script>

<template>
  <AffixBoxHasTitleView>
    <v-row class="h-100">
      <!-- 分类 S  -->
      <v-col cols="12" sm="12" lg="3" class="d-flex flex-column h-lg-100 h-xl-100 h-xxl-100">
        <v-list nav class="bg-transparent position-relative overflow-auto h-100">
          <div class="ga-2">
            <div class="d-flex gap-1 ga-2 flex-wrap">
              <template v-if="totalUnread > 0">
                <v-btn
                    size="small" variant="tonal" density="compact"
                    color="amber" @click="markAllRead">
                  <v-icon icon="mdi-check-all" size="14" class="mr-1"></v-icon>
                  {{ t('account.messages.markAllRead') }}
                </v-btn>

                <v-divider vertical></v-divider>
              </template>
              <v-btn
                  size="small" variant="tonal" density="compact"
                  :color="filterTab === 'all' ? 'amber' : undefined"
                  @click="filterTab = 'all'">
                {{ t('account.messages.tabAll') }}
              </v-btn>
              <v-btn
                  size="small" variant="tonal" density="compact"
                  :color="filterTab === 'user' ? 'amber' : undefined"
                  @click="filterTab = 'user'">
                {{ t('account.messages.tabUser') }}
              </v-btn>
              <v-btn
                  size="small" variant="tonal" density="compact"
                  :color="filterTab === 'system' ? 'amber' : undefined"
                  @click="filterTab = 'system'">
                {{ t('account.messages.tabSystem') }}
              </v-btn>
            </div>
          </div>

          <v-divider class="my-3"></v-divider>

          <AffixContainerView>
            <v-list-item
                nav
                rounded
                ripple
                class="pa-3 cursor-pointer border-bottom"
                v-for="conv in displayedConvs"
                :variant="activeConv?.id === conv.id ? 'tonal' : 'flat'"
                :key="conv.id"
                :class="{
                'bg-tr': conv.unreadCount > 0 && activeConv?.id !== conv.id
              }"
                @click="openConversation(conv)">
              <div class="d-flex justify-space-between align-center">
                <p class="font-weight-medium text-body-2 d-flex align-center gap-1 text-truncate" style="max-width: 170px;">
                  <v-icon v-if="conv.pinned" size="14" color="amber">mdi-pin</v-icon>
                  <v-icon v-if="conv.type === 'system'" size="16" color="grey">mdi-bell</v-icon>
                  {{ conv.type === 'system' ? t('account.messages.tabSystem') : (conv.peerName || conv.peerId) }}
                </p>
                <div class="d-flex align-center gap-1" style="flex-shrink:0;" @click.stop>
                  <v-chip v-if="conv.unreadCount > 0" size="x-small" color="red">{{ conv.unreadCount }}</v-chip>
                  <v-btn
                      size="x-small" icon="mdi-pin-off-outline" variant="text" density="compact"
                      class="opacity-0 conv-action-btn"
                      v-if="conv.pinned"
                      @click="onTogglePin(conv)"></v-btn>
                  <v-btn
                      size="x-small" icon="mdi-pin-outline" variant="text" density="compact"
                      class="opacity-0 conv-action-btn"
                      v-else
                      @click="onTogglePin(conv)"></v-btn>
                  <v-btn
                      size="x-small" icon="mdi-delete-outline" variant="text" density="compact"
                      class="opacity-0 conv-action-btn"
                      @click="confirmDelete = conv"></v-btn>
                </div>
              </div>
              <div class="text-caption text-grey text-truncate mt-1">{{ conv.lastMessage }}</div>
            </v-list-item>
            <div v-if="displayedConvs.length === 0" class="text-center text-grey py-8 text-caption">
              {{ filterTab === 'user' ? t('account.messages.emptyUser') : (filterTab === 'system' ? t('account.messages.emptySystem') : t('account.messages.empty')) }}
            </div>
          </AffixContainerView>
        </v-list>
      </v-col>
      <!-- 分类 E  -->

      <!-- 窗口 S -->
      <v-col cols="12" sm="12" lg="9">
        <v-card variant="text" min-height="300" class="d-flex flex-column">
          <v-card-title>
            <div v-if="activeConv || pendingPeerId" class="d-flex align-center gap-3 mb-5">
              <v-avatar size="36" :color="isSystemConv ? 'grey' : 'amber'">
                <v-icon v-if="isSystemConv" color="white">mdi-bell</v-icon>
                <span v-else>{{ (activeConv?.peerName || pendingPeerName || pendingPeerId || '?')[0]?.toUpperCase() }}</span>
              </v-avatar>
              <div class="flex-grow-1 ml-3">
                <div class="font-weight-medium">
                  {{ isSystemConv ? t('account.messages.tabSystem') : (activeConv?.peerName || pendingPeerName || `User #${activeConv?.peerId || pendingPeerId}`) }}
                </div>
                <div class="text-caption text-grey">
                  {{ isSystemConv ? t('account.messages.systemHint') : t('account.messages.privateHint') }}
                  <span v-if="pendingPeerId" class="text-amber">— {{ t('account.messages.firstMessageHint') }}</span>
                </div>
              </div>
            </div>
            <div v-else class="d-flex align-center justify-center flex-grow-1 text-grey">
              {{ t('account.messages.selectConv') }}
            </div>
          </v-card-title>

          <v-card-text class="flex-grow-1 overflow-y-auto">
            <div v-if="activeConv || pendingPeerId" class="messages-scroll">
              <!-- 加载以往记录（只有有会话时才显示，pendingPeerId 是新建无历史） -->
              <v-btn
                  v-if="hasMoreMessages && activeConv"
                  variant="text" density="compact" size="x-small"
                  color="grey"
                  :loading="loadingHistory"
                  @click="loadMoreHistory"
                  class="mb-2">
                点击加载以往记录（最多保留一个月）
              </v-btn>

              <!-- 用户对话：气泡样式 -->
              <template v-if="!isSystemConv">
                <div v-if="pendingPeerId && messages.length === 0" class="text-center text-caption text-grey py-8">
                  {{ t('account.messages.firstMessageEmpty') }}
                </div>
                <div
                    v-for="m in messages"
                    :key="m.id"
                    class="d-flex mb-3"
                    :class="{'justify-end': String(m.senderId) === myId}">
                  <div class="max-width-75" :class="{'text-right': String(m.senderId) === myId}">
                    <div
                        class="d-inline-block pa-2 rounded-lg"
                        :class="String(m.senderId) === myId ? 'bg-amber text-black' : 'border v'">
                      {{ m.content }}
                    </div>
                    <div class="text-caption text-grey mt-1">{{ m.createdTime }}</div>
                  </div>
                </div>
              </template>

              <!-- 系统通知：扁平列表样式 -->
              <template v-else>
                <div
                    v-for="m in messages"
                    :key="m.id"
                    class="d-flex mb-3 pa-3 border rounded-lg gap-3">
                  <div class="flex-grow-1 ml-3">
                    <div class="text-body-2">{{ m.content }}</div>
                    <div class="text-caption text-grey mt-1">{{ m.createdTime }}</div>
                  </div>
                </div>
              </template>

              <div ref="bottomEl"></div>
            </div>
          </v-card-text>

          <AffixContainerView :affix-bottom="false"
                              :offset-bottom="0">
            <div class="px-4 py-2">
              <div v-if="(activeConv && !isSystemConv) || pendingPeerId" class="">
                <v-row class="align-center">
                  <v-col>
                    <v-text-field
                        v-model="input"
                        variant="outlined"
                        density="compact"
                        hide-details
                        :placeholder="t('account.messages.inputPlaceholder')"
                        @keydown="onKeydown"
                        rows="1"
                        type="textarea"
                        class="flex-1">
                    </v-text-field>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn color="amber" variant="tonal" :loading="sending" @click="sendMessage">
                      {{ t('account.messages.send') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
              <div v-else-if="activeConv && isSystemConv" class="text-center text-caption text-grey">
                {{ t('account.messages.systemInputHint') }}
              </div>
            </div>
          </AffixContainerView>
        </v-card>
      </v-col>
      <!-- 窗口 E -->

      <!-- 删除会话确认 S -->
      <v-dialog v-model="deleteDialog" max-width="360">
        <v-card>
          <v-card-title class="text-h6">{{ t('account.messages.deleteTitle') }}</v-card-title>
          <v-card-text>
            {{ t('account.messages.deleteDesc', {name: confirmDelete?.peerName || confirmDelete?.peerId}) }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="confirmDelete = null">{{ t('common.cancel') }}</v-btn>
            <v-btn color="error" variant="tonal" @click="doDeleteConv">{{ t('common.confirm') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- 删除会话确认 E -->
    </v-row>

    <template v-slot:title>
      {{ t('account.messages.title') }}
    </template>
  </AffixBoxHasTitleView>
</template>

<style scoped>

.message-footer {
  background: rbga(var(--v-theme-background));
  backdrop-filter: blur(30px);
}
</style>
