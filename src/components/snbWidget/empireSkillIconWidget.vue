<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {EmpireSkills} from "glow-prow-data";
import {computed, onMounted, ref, watch} from "vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import EmpireSkillCardDetail from "@/components/snbWidget/empireSkillCardDetail.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      margin: 1,
      padding: 1
    }),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    appStore = useAppStore(),
    skillsMap = EmpireSkills;

let iconSrc = ref(''),
    imgError = ref(false),
    skill = computed(() => skillsMap[props.id] || null),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    });

watch(() => props.id, () => {
  onReady();
});

onMounted(() => {
  onReady();
});

const onReady = async () => {
  imgError.value = false;
  iconSrc.value = currentImageService.url({
    'glow-prow': {
      id: props.id,
      category: 'empireSkills'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: 'empireSkills'
    },
    'local-test': {
      id: props.id,
      category: 'empireSkills'
    }
  });
};

defineOptions({
  name: "EmpireSkillIconWidget"
});

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <ItemCardTooltip
      v-if="skill"
      :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/empireSkill/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          width="100%"
          height="100%"
          :class="[
              'prohibit-drag pa-5',
              'd-flex align-center justify-center',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-img
            v-if="iconSrc && !imgError"
            :src="iconSrc"
            @error="imgError = true"
            class="pointer-events-none w-100 h-100"
            cover
        ></v-img>
        <div v-else-if="skill.type" class="w-100 h-100 d-flex align-center justify-center">
          <FactionIconWidget :name="skill.type" size="100%" />
        </div>
        <div v-else class="w-100 h-100 d-flex align-center justify-center">
          <v-icon size="36" color="amber">mdi-school</v-icon>
        </div>
      </v-card>
    </template>
    <EmpireSkillCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
