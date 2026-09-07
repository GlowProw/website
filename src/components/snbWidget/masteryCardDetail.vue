<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {Masterys} from "glow-prow-data";
import MasteryName from "./masteryName.vue";
import BtnWidget from "./btnWidget.vue";

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
const {mastery} = useI18nReadName();

// 查找节点数据
const nodeData = computed(() => {
  const rawId = props.id;
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes && (tree as any).nodes[rawId]) {
      return (tree as any).nodes[rawId];
    }
  }
  return null;
});

const category = computed(() => nodeData.value?.category || 'default');

const headerBgClass = computed(() => {
  switch (category.value) {
    case 'defensive': return 'bg-gradient-defensive';
    case 'offensive': return 'bg-gradient-offensive';
    case 'impetus': return 'bg-gradient-impetus';
    default: return 'bg-gradient-default';
  }
});

const description = computed(() => {
  return mastery(props.id).description();
});

defineOptions({
  name: "MasteryCardDetail"
});
</script>

<template>
  <v-card class="demo-reel bg-black" flat border>
    <div class="demo-reel-header pa-6 position-relative" :class="headerBgClass">
      <div class="d-flex align-center gap-2 mb-2">
        <v-chip size="x-small" variant="flat" color="black" class="font-weight-bold">
          {{ category.toUpperCase() }}
        </v-chip>
        <v-chip size="x-small" variant="outlined" v-if="nodeData?.season">
          {{ nodeData.season }}
        </v-chip>
        <v-chip size="x-small" color="amber" variant="tonal" v-if="nodeData?.role">
          {{ nodeData.role }}
        </v-chip>
      </div>

      <h2 class="font-weight-bold text-amber">
        <MasteryName :id="props.id" />
      </h2>
      <p class="text-caption text-grey mb-0 font-monospace">{{ props.id }}</p>
    </div>

    <div class="demo-reel-content background-flavor overflow-auto pa-6">
      <div v-if="isShowDescription && description" class="mb-4 description text-caption text-pre-line">
        {{ description }}
      </div>

      <div v-if="nodeData?.cost" class="mb-3 text-caption opacity-70">
        {{ nodeData.role === 'seasonalPerk' ? `激活门槛: 需投入 ${nodeData.cost} 点` : `专精点数消耗: ${nodeData.cost} 点` }}
      </div>

      <div v-if="isShowOpenDetail" class="actions mt-3">
        <BtnWidget
            :is-target-blank="false"
            :to="`/codex/mastery/${props.id}`">
          {{ t('basic.btn.showDetails') }}
        </BtnWidget>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.bg-gradient-defensive {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#142c44,#254d6b 56%,#3e7295) !important;
}

.bg-gradient-offensive {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#3f121c,#6d2030 56%,#9b3345) !important;
}

.bg-gradient-impetus {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#4e4017,#856c28 56%,#9a7f2c) !important;
}

.bg-gradient-default {
  background: linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.16) 24%,transparent 50%),radial-gradient(circle at 50% 50%,transparent 46%,rgba(0,0,0,.2) 70%,rgba(0,0,0,.58) 100%),linear-gradient(180deg,#0f2f16,#1f5a24 56%,#3a8240) !important;
}
</style>
