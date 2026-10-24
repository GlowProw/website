<script setup lang="ts">
import {computed} from "vue";
import {useRoute} from "vue-router";
import OAuthCallback from "./OAuthCallback.vue";
import McpConsent from "./McpConsent.vue";

const route = useRoute();

/**
 * /oauth/callback 统一入口：
 *  - platform=glow-prow-ai-connector → AI 连接器 OAuth 同意页
 *  - 其它（qq / google / discord 等）→ 第三方登录回调（原有逻辑）
 */
const isMcpConsent = computed(() => String(route.query.platform || "") === "glow-prow-ai-connector");
</script>

<template>
  <McpConsent v-if="isMcpConsent" />
  <OAuthCallback v-else />
</template>
