<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import HalfScreenBannerText from "@/components/HalfScreenBannerText.vue";

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const {mobile, sm} = useDisplay();
const notice = useNoticeStore();

const code = computed(() => String(route.query.code || ""));

const loading = ref(true);
const submitting = ref(false);
const errorCode = ref("");          // 空 = 正常；consent.expired / consent.unauthenticated / 其他
const clientName = ref("");
const clientUri = ref<string | null>(null);
const logoUri = ref<string | null>(null);
const scopeDescription = ref("");

/** 是否展示可重试的「会话失效」界面 */
const isExpired = computed(() => errorCode.value === "consent.expired" || errorCode.value === "consent.unauthenticated");

onMounted(async () => {
  if (!code.value) {
    loading.value = false;
    errorCode.value = "consent.invalid";
    return;
  }
  try {
    const res = await apis.mcpOAuthApi().getConsent(code.value);
    const data = (res?.data || {}) as any;
    clientName.value = data.client?.clientName || "";
    clientUri.value = data.client?.clientUri || null;
    logoUri.value = data.client?.logoUri || null;
    scopeDescription.value = data.scopeDescription || "";
  } catch (err: any) {
    errorCode.value = err?.code || "error";
  } finally {
    loading.value = false;
  }
});

/**
 * 允许访问：提交授权决定后整页跳转到客户端回跳地址
 **/
const onAllow = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await apis.mcpOAuthApi().submitConsent(code.value, "allow");
    const data = (res?.data || {}) as any;
    if (data?.redirectTo) {
      window.location.href = data.redirectTo;
      return;
    }
    errorCode.value = data?.code || "error";
  } catch (err: any) {
    errorCode.value = err?.code || "error";
  } finally {
    submitting.value = false;
  }
};

/**
 * 拒绝：同样提交决定，后端按 OAuth 协议把 error 带回客户端 redirect_uri
 **/
const onDeny = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await apis.mcpOAuthApi().submitConsent(code.value, "deny");
    const data = (res?.data || {}) as any;
    if (data?.redirectTo) {
      window.location.href = data.redirectTo;
      return;
    }
    // 拒绝但无回跳地址：直接回到 AI 连接器页
    router.push("/apps/ai-connector");
  } catch (err: any) {
    notice.error(err?.message || t("mcpConsent.error"));
  } finally {
    submitting.value = false;
  }
};

/** 会话失效时重新发起连接 */
const onRetry = () => {
  router.push("/apps/ai-connector");
};
</script>

<template>
  <div class="signin-window">
    <v-row density="compact" class="h-100" no-gutters>
      <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
        <HalfScreenBannerText></HalfScreenBannerText>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.2"
            class="bg-black">
        </Silk>
      </v-col>

      <v-col cols="12" lg="6" class="bg-black overflow-y-auto">
        <v-card density="compact" variant="text" class="signin mt-16 px-8">
          <v-breadcrumbs class="ml-n3">
            <v-breadcrumbs-item to="/">{{ t("portal.title") }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t("mcpConsent.title") }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <AffixContainerView>
            <!-- 加载 S -->
            <div v-if="loading" class="text-center py-16">
              <Loading class="mb-4" size="32"></Loading>
              <div class="text-subtitle-1 font-weight-bold opacity-90">
                {{ t("mcpConsent.loading") }}
              </div>
            </div>
            <!-- 加载 E -->

            <!-- 会话失效 / 错误 S -->
            <div v-else-if="errorCode" class="text-center py-12">
              <h3 class="text-h5 font-weight-bold text-red">{{ t("mcpConsent.error") }}</h3>
              <p class="text-caption opacity-70 mt-2 mb-6">
                {{ isExpired ? t("mcpConsent.expired") : t("mcpConsent.error") }}
              </p>
              <v-btn class="bg-amber text-black" size="50" block variant="flat" @click="onRetry">
                {{ t("mcpConsent.retry") }}
              </v-btn>
            </div>
            <!-- 会话失效 / 错误 E -->

            <!-- 同意页 S  -->
            <div v-else>
              <p class="opacity-60 mb-5">
                <span class="text-amber font-weight-bold u">{{ clientName || 'Clien tName' }}</span>
                {{ t("mcpConsent.subtitle", {client: ''}) }}
              </p>

              <div class="scope-box mb-6">
                <div class="font-weight-bold text-amber mb-1">{{ t("mcpConsent.scopeTitle") }}</div>
                <div class="text-body-2">{{ scopeDescription }}</div>
              </div>

              <div class="d-flex ga-3">
                <v-btn class="flex-1-1" size="50" variant="outlined" color="grey" :disabled="submitting"
                       data-testid="mcp-consent-deny" @click="onDeny">
                  {{ t("mcpConsent.deny") }}
                </v-btn>
                <v-btn class="flex-1-1 bg-amber text-black" size="50" variant="flat" :loading="submitting"
                       data-testid="mcp-consent-allow" @click="onAllow">
                  {{ t("mcpConsent.allow") }}
                </v-btn>
              </div>

              <p class="text-caption opacity-50 mt-6 text-center line-height-16">
                {{ t("mcpConsent.foot") }}
              </p>
            </div>
            <!-- 同意页 E -->
          </AffixContainerView>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signin-window {
  overflow: hidden;
  min-height: calc(100vh + 2px);
  margin-bottom: -4px;
}

.scope-box {
  background: rgba(255, 193, 7, .08);
  border: 1px solid rgba(255, 193, 7, .22);
  border-radius: 10px;
  padding: 12px 14px;
}

.line-height-16 {
  line-height: 1.6;
}
</style>
