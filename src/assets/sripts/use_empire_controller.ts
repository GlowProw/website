import {computed, ref, watch, type Ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useDisplay} from 'vuetify/framework';
import {useAppStore} from '~/stores/appStore';
import {EmpireSkills} from 'glow-prow-data/src/entity/EmpireSkills';

export interface SearchItem {
  title: string;
  value: string;
  node?: any;
}

export function useEmpireController(props: { skills?: Record<string, any> }) {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const {t, te, locale} = useI18n();
  const {mobile} = useDisplay();

  const isDebug = computed(() => appStore.isDebug);
  const skillsData: any = props.skills || EmpireSkills;
  const svgScaleExtent: [number, number] = [0.4, 4];

  const scaleExtent = computed(() => [
    svgScaleExtent[0],
    1,
    svgScaleExtent[1],
  ]);

  const svgTransform = ref({k: 1, x: 0, y: 0});
  const model = ref(false);
  const selectShowKey = ref<string | null>('manufactoryExpansion-compagnieRoyale-2');

  const searchQuery = ref('');
  const searchItems = ref<SearchItem[]>([]);
  const foundNodes = ref<SearchItem[]>([]);
  const skillPointsInput = ref<Record<string, number>>({});

  // 待聚焦定位的目标节点 Key
  const locateTargetKey = ref<string | null>(null);

  /**
   * 模拟点是否可用
   */
  const getIsSkillPointPossible = (key: string) => {
    const skill = skillsData[key];
    if (!skill) return false;

    const requisite = skill.requisite || [];
    if (requisite.includes('root')) {
      return true;
    }

    let checkResultCount = 0;
    requisite.forEach((i: string) => {
      if (skillPointsInput.value[i]) {
        checkResultCount += 1;
      }
    });

    return checkResultCount === requisite.length;
  };

  /**
   * 设置模拟点数
   */
  const onSetSkillPoint = (key: string, type = 'add') => {
    const skill = skillsData[key];
    if (!skill) return;
    const {stage} = skill;
    const currentValue = skillPointsInput.value[key] || 0;

    if (!stage) return;

    switch (type) {
      case 'add':
        if (currentValue < stage) skillPointsInput.value[key] = currentValue + 1;
        break;
      case 'rem':
        if (currentValue > 0) skillPointsInput.value[key] = currentValue - 1;
        break;
    }
  };

  /**
   * 聚焦节点
   */
  const onMoveNode = (key: string) => {
    if (!key || key === 'root') return;
    locateTargetKey.value = key;
    selectShowKey.value = key;
    model.value = true;
  };

  const categoryName = (key: string) => {
    const keyPath = `snb.factions.${key}.name`;
    return te(keyPath) ? t(keyPath) : key;
  };

  return {
    route,
    router,
    appStore,
    t,
    te,
    locale,
    mobile,
    isDebug,
    skillsData,
    svgScaleExtent,
    scaleExtent,
    svgTransform,
    model,
    selectShowKey,
    searchQuery,
    searchItems,
    foundNodes,
    skillPointsInput,
    locateTargetKey,
    getIsSkillPointPossible,
    onSetSkillPoint,
    onMoveNode,
    categoryName
  };
}
