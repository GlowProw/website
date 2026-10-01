<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRouter} from "vue-router";
import {Quests, Questlog} from "glow-prow-data";

import QuestName from "@/components/snbWidget/questName.vue";
import QuestDescription from "@/components/snbWidget/questDescription.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";

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

const quest = computed(() => (Quests as Record<string, Questlog>)[props.id]);

defineOptions({
  name: "QuestCardDetail"
});
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="quest">
    <div class="demo-reel-header pa-6 position-relative">
      <h1 class="font-weight-bold">
        <QuestName :id="props.id"></QuestName>
      </h1>
      <p class="text-caption text-grey mb-1">{{ props.id }}</p>

      <div class="d-flex align-center mb-2 mt-3" v-if="quest.category">
        <v-chip size="small" class="badge-flavor text-black mr-2">
          {{ t(`snb.quests.${quest.category}.name`) || quest.category }}
        </v-chip>
      </div>
    </div>

    <div class="demo-reel-content background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6 description">
          <QuestDescription :id="props.id" />
        </div>
      </template>
      <v-divider v-if="isShowOpenDetail" class="my-4"></v-divider>
      <div class="demo-reel-content px-10 background-flavor overflow-auto" v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/quest/${props.id}`)">
          {{ t('quest.lookDetail') || t('codex.quest.lookDetail') }}
        </BtnWidget>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
