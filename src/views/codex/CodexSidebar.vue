<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {ref, watch} from "vue";
import {useDisplay} from "vuetify";

import AppCodexNav from "@/assets/sripts/app_codex_nav";

const {t} = useI18n(),
    route = useRoute(),
    {mobile} = useDisplay(),
    appCodexNav = new AppCodexNav(),
    isCollapsed = ref(mobile.value)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

watch(() => mobile.value, () => {
  isCollapsed.value = false
})

defineOptions({
  name: "CodexSidebar"
})
</script>

<template>
  <div class="codex-sidebar-container pt-3" :class="{ 'collapsed': isCollapsed }">
    <v-list nav
            slim
            class="bg-transparent py-0 overflow-x-hidden"
            active-class="bg-amber">
      <v-row class="mb-2" align="center">
        <v-col>
          <v-list-item to="/codex/" prepend-icon="mdi-home" slim :active="route.name == 'codexOverview'">
            {{ t('codex.title') }}
          </v-list-item>
        </v-col>
        <v-col cols="auto" v-if="mobile">
          <v-card class="collapse-header bg-amber" @click="toggleCollapse">
            <v-icon class="collapse-icon">{{ isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
          </v-card>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <template v-if="!isCollapsed">
        <template v-for="(i, index) in appCodexNav.nav" :key="index">
          <v-divider v-if="i.type === 'divider'" :class="i.class || 'my-2'"></v-divider>
          <v-list-item v-else
                       :to="i.to"
                       :prepend-icon="i.prependIcon"
                       :append-icon="i.appendIcon"
                       :variant="i.variant"
                       :slim="i.slim"
                       :class="i.class">
            {{ i.title ? t(i.title) : '' }}
            <template v-slot:append v-if="i.badge">
              <v-btn size="x-small" variant="tonal">{{ i.badge }}</v-btn>
            </template>
          </v-list-item>
        </template>
      </template>
    </v-list>
  </div>
</template>

<style scoped lang="less">
.codex-sidebar-container {
  overflow-x: hidden;
  padding-bottom: 10px;

  .collapse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
    user-select: none;

    &:hover {
      background: #eeeeee;
    }

    .collapse-icon {
      color: rgba(0, 0, 0, 0.6);
    }
  }

  @media (max-width: 1264px) {
    .collapse-header {
      padding: 10px 12px;
    }
  }
}
</style>
