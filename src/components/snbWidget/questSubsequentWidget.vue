<script lang="ts">
export default { name: 'QuestSubsequentWidget' }
</script>

<script setup lang="ts">
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import QuestIconWidget from "@/components/snbWidget/questIconWidget.vue";
import QuestName from "@/components/snbWidget/questName.vue";
import {Quests, Questlog} from "glow-prow-data";

const props = defineProps<{ id: string }>(),
    allQuestsMap = Quests as Record<string, Questlog>;

const quest = computed(() => allQuestsMap[props.id] || null);

const subsequentQuests = computed(() => {
  if (!quest.value?.id) return [];
  const currentId = quest.value.id;
  return Object.values(allQuestsMap).filter(q => {
    if (!q.introduction) return false;
    return q.introduction.some(item => (typeof item === 'string' ? item : item.id) === currentId);
  });
});
</script>

<template>
  <template v-if="subsequentQuests.length > 0">
    <div class="mb-10">
      <slot></slot>
    </div>
    <v-row class="ga-6 mb-2" justify="center">
      <v-card v-for="(sub, index) in subsequentQuests" :key="index" class="bg-transparent" width="80">
        <ItemSlotBase size="80px">
          <QuestIconWidget :id="sub.id"></QuestIconWidget>
        </ItemSlotBase>
        <div class="mt-1 text-center singe-line">
          <QuestName :id="sub.id"></QuestName>
        </div>
      </v-card>
    </v-row>
  </template>
</template>

<style scoped lang="less">
</style>
