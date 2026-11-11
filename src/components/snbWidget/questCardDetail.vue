<script setup lang="ts">
import {computed, inject, type Ref} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRouter} from "vue-router";
import {Quests, Questlog} from "glow-prow-data";

import QuestName from "@/components/snbWidget/questName.vue";
import QuestDescription from "@/components/snbWidget/questDescription.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import Banner from "@/components/Banner.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowDescription?: boolean,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  isShowDescription: true,
  isShowOpenDetail: true,
  isWidget: false,
});

const {t} = useI18nUtils();
const router = useRouter();

// 注入外层提示框固定上下文
const cardTooltipContext = inject<{
  isPinned: Ref<boolean>;
  togglePin: () => void;
  setPinned: (val: boolean) => void;
} | null>('itemCardTooltipContext', null);

const quest = computed(() => (Quests as Record<string, Questlog>)[props.id]);

defineOptions({
  name: "QuestCardDetail"
});
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="quest">
    <Banner class="demo-reel-header pa-6">
      <h1 class="font-weight-bold">
        <QuestName :id="props.id"></QuestName>
      </h1>
      <p class="text-caption text-grey mb-1">{{ props.id }}</p>

      <div class="d-flex align-center mb-2 mt-3" v-if="quest.category">
        <v-chip size="small" class="badge-flavor text-black mr-2">
          {{ t(`snb.quests.${quest.category}.name`) || quest.category }}
        </v-chip>
      </div>
    </Banner>

    <div class="demo-reel-content background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6 description">
          <QuestDescription :id="props.id" />
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail" opacity=".06"></v-divider>
    <v-card-actions class="demo-reel-content px-10 py-5 overflow-auto d-flex align-center ga-2" v-if="isShowOpenDetail">
      <BtnWidget hotkey-action="openItemDetail" @action-complete="router.push(`/quest/${props.id}`)">
        {{ t('quest.lookDetail') || t('codex.quest.lookDetail') }}
      </BtnWidget>
      <BtnWidget
          v-if="cardTooltipContext"
          hotkey-action="pinCardTooltip"
          :color="cardTooltipContext.isPinned.value ? 'var(--main-color)' : undefined"
          :icon="cardTooltipContext.isPinned.value ? 'mdi-pin-off-outline' : 'mdi-pin-outline'"
          @action-complete="cardTooltipContext.togglePin">
        {{ cardTooltipContext.isPinned.value ? t('codex.item.unpinCard') : t('codex.item.pinCard') }}
      </BtnWidget>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
