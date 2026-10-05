<script setup lang="ts">
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import QuestIconWidget from "@/components/snbWidget/questIconWidget.vue";
import QuestName from "@/components/snbWidget/questName.vue";
import {Quests, Questlog} from "glow-prow-data";

const props = defineProps<{ id: string }>(),
    allQuestsMap = Quests as Record<string, Questlog>;

const quest = computed(() => allQuestsMap[props.id] || null);

const prerequisiteQuests = computed(() => {
  if (!quest.value?.introduction?.length) return [];
  return quest.value.introduction
      .map(item => typeof item === 'string' ? allQuestsMap[item] : item)
      .filter((q): q is Questlog => !!q);
});

defineOptions({
  name: 'QuestPrerequisitesWidget'
})
</script>

<template>
  <template v-if="prerequisiteQuests.length > 0">
    <div class="mb-10">
      <slot></slot>
    </div>
    <v-row class="ga-6 mb-2" justify="center">
      <v-card v-for="(req, index) in prerequisiteQuests" :key="index" class="bg-transparent" width="80">
        <ItemSlotBase size="80px">
          <QuestIconWidget :id="req.id"></QuestIconWidget>
        </ItemSlotBase>
        <div class="mt-1 text-center singe-line">
          <QuestName :id="req.id"></QuestName>
        </div>
      </v-card>
    </v-row>
  </template>
</template>

<style scoped lang="less">
</style>
