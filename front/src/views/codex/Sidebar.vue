<script setup lang="ts">
import {useI18n} from "vue-i18n";
import AppCodexNav from "@/assets/sripts/app_codex_nav";
import {useRoute} from "vue-router";
import {ref, watch} from "vue";
import {useDisplay} from "vuetify";

const {t} = useI18n(),
    route = useRoute(),
    {mobile} = useDisplay(),
    appCodexNav = new AppCodexNav(),
    isCollapsed = ref(mobile.value)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

watch(() => mobile.value, (value) => {
  isCollapsed.value = false
})
</script>

<template>
  <div class="sidebar-container" :class="{ 'collapsed': isCollapsed }">
    <v-list nav class="bg-transparent pa-0" active-class="bg-amber">
      <v-row class="mb-5" align="center">
        <v-col>
          <v-list-item to="/codex/" prepend-icon="mdi-home" slim :active="route.name == 'codexOverview'">
            {{ t('codex.title') }}
          </v-list-item>
        </v-col>
        <v-col cols="auto">
          <v-card class="collapse-header bg-amber" @click="toggleCollapse" v-if="mobile">
            <v-icon class="collapse-icon">{{ isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
          </v-card>
        </v-col>
      </v-row>

      <template v-if="!isCollapsed">
        <v-list-item :to="`${i.to}`" prepend-icon="mdi-format-list-bulleted-type"
                     v-for="(i, index) in appCodexNav.nav" :key="index">
          {{ t(i.title) }}
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item to="/codex/treasureMaps" prepend-icon="mdi-format-list-bulleted-type">
          {{ t('codex.treasureMaps.title') }}
        </v-list-item>
        <v-list-item to="/codex/mapLocations" prepend-icon="mdi-format-list-bulleted-type">
          {{ t('codex.mapLocations.title') }}
        </v-list-item>
        <v-list-item to="/codex/npcs" prepend-icon="mdi-format-list-bulleted-type">
          {{ t('codex.npcs.title') }}
        </v-list-item>

        <v-list-item to="/search" class="mt-5" prepend-icon="mdi-magnify" append-icon="mdi-open-in-new" variant="tonal" slim>
          {{ t('search.title') }}
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<style scoped lang="less">
.sidebar-container {
  overflow: hidden;
  padding-bottom: 10px;

  &.collapsed {
    .menu-content {
      display: none;
    }
  }
}

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
}

.header-text {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.collapse-icon {
  color: rgba(0, 0, 0, 0.6);
}

.menu-content {
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}

// 移动端样式调整
@media (max-width: 1264px) {
  .collapse-header {
    padding: 10px 12px;
  }

  .menu-content {
    max-height: 300px;
  }
}
</style>
