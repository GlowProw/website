<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {formatNumber} from "@/assets/sripts/number";
import type {ItemCalcResult} from "@/assets/sripts/item_carc";
import PerksName from "@/components/snbWidget/perksName.vue";
import PerkDescription from "@/components/snbWidget/perksDescription.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import ShipSailSpeedWidget from "@/components/snbWidget/shipSailSpeedWidget.vue";
import {type Ship, Ships} from "glow-prow-data";

const {t} = useI18n();
const {perk} = useI18nReadName();

interface Props {
  result: ItemCalcResult;
  targetResult?: ItemCalcResult | null;
  isSimulationShipSailSpeed?: boolean;
  isColOne?: boolean;
  isDisabledMoveTitle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  targetResult: null,
  isSimulationShipSailSpeed: true,
  isColOne: false,
  isDisabledMoveTitle: false,
});

const data = computed<Ship | null>(() => {
  if (!props.result) return null;
  const baseShip = props.result.shipId && (Ships as any)[props.result.shipId] ? (Ships as any)[props.result.shipId] : null;
  if (baseShip) {
    return {
      ...baseShip,
      sailSpeed: props.result.sailSpeed || baseShip.sailSpeed
    } as Ship;
  }
  if (props.result.sailSpeed) {
    return {
      sailSpeed: props.result.sailSpeed
    } as any;
  }
  return null;
});

// 过滤掉没有翻译名称的 perk
const displayPerks = computed(() => {
  return (props.result.allPerks || []).filter((perkId: string) => {
    const name = perk(perkId).name();
    return !!name && name.trim().length > 0;
  });
});

const showPerkDescriptions = ref(false);

// 伤害类型标签映射
const mitigationLabels: Record<string, string> = {
  explosive: 'explosive',
  flooding: 'flooding',
  burning: 'fire',
  tearing: 'tearing',
  piercing: 'piercing',
  electric: 'electric',
  toxic: 'toxic',
};

// 武器方向对应 ship 槽位名称映射
const directionSlotMap: Record<string, string> = {
  front: 'frontWeapon',
  left: 'leftSideWeapon',
  right: 'rightSideWeapon',
  aft: 'aftWeapon',
  port: 'leftSideWeapon',
  starboard: 'rightSideWeapon',
  frontWeapon: 'frontWeapon',
  leftSideWeapon: 'leftSideWeapon',
  rightSideWeapon: 'rightSideWeapon',
  aftWeapon: 'aftWeapon',
};

const getDirectionName = (dir: string): string => {
  const slotKey = directionSlotMap[dir] || dir;
  return t(`codex.ship.${slotKey}`);
};

/**
 * 合并船甲 + 船只的防御为总减免
 */
const totalMitigation = computed(() => {
  const r = props.result;
  const merged: Record<string, { armor: number; ship: number; total: number }> = {};

  const allKeys = new Set([
    ...Object.keys(r.damageMitigation),
    ...Object.keys(r.shipDamageMitigation),
  ]);

  for (const key of Array.from(allKeys)) {
    if (key === 'electric' || key === 'toxic') {
      // 这些字段在 armor 数据中可能不存在
    }
    const armorVal = r.damageMitigation[key] ?? 0;
    const shipVal = r.shipDamageMitigation[key] ?? 0;
    const total = armorVal + shipVal;
    if (armorVal > 0 || shipVal > 0) {
      merged[key] = {armor: armorVal, ship: shipVal, total};
    }
  }

  return merged;
});

const targetTotalMitigation = computed(() => {
  const r = props.targetResult;
  if (!r) return {};
  const merged: Record<string, { armor: number; ship: number; total: number }> = {};

  const allKeys = new Set([
    ...Object.keys(r.damageMitigation || {}),
    ...Object.keys(r.shipDamageMitigation || {}),
  ]);

  for (const key of Array.from(allKeys)) {
    const armorVal = r.damageMitigation?.[key] ?? 0;
    const shipVal = r.shipDamageMitigation?.[key] ?? 0;
    const total = armorVal + shipVal;
    if (armorVal > 0 || shipVal > 0) {
      merged[key] = {armor: armorVal, ship: shipVal, total};
    }
  }

  return merged;
});

/**
 * 计算数值差异
 * 比目标值高：绿色向上三角 ▲ + diff
 * 比目标值低：深红色向下三角 ▼ - diff
 */
function getDiff(
    current: number | undefined | null,
    target: number | undefined | null,
    options?: { isPercent?: boolean; isTime?: boolean }
) {
  if (!props.targetResult || current == null || target == null) return null;
  const c = Number(current);
  const t = Number(target);
  if (isNaN(c) || isNaN(t) || Math.abs(c - t) < 0.0001) return null;

  const diff = c - t;
  const isHigher = diff > 0;

  let formattedDiff = '';
  if (options?.isPercent) {
    formattedDiff = `${(Math.abs(diff) * 100).toFixed(0)}%`;
  } else if (options?.isTime) {
    formattedDiff = `${(Math.abs(diff) / 1000).toFixed(2)}s`;
  } else {
    formattedDiff = Math.abs(diff) >= 1000
        ? formatNumber(Math.round(Math.abs(diff)))
        : (Math.abs(diff) % 1 === 0 ? String(Math.abs(diff)) : Math.abs(diff).toFixed(2));
  }

  return {
    isHigher,
    color: isHigher ? '#4CAF50' : '#D32F2F', // 高为绿色，低为深红
    icon: isHigher ? 'mdi-triangle' : 'mdi-triangle-down',
    text: `${isHigher ? '+' : '-'}${formattedDiff}`
  };
}

/**
 * 获取对应武器方向的 target stats
 */
function getTargetDirectionStats(direction: string) {
  if (!props.targetResult?.weaponStats) return null;
  return props.targetResult.weaponStats.find(w => w.direction === direction) || null;
}

function getTargetWeapon(direction: string, idx: number) {
  const dir = getTargetDirectionStats(direction);
  return dir?.weapons?.[idx] || null;
}

function getTargetAuxWeapon(idx: number) {
  if (!props.targetResult?.auxiliaryWeaponStats) return null;
  return props.targetResult.auxiliaryWeaponStats[idx] || null;
}

function getTargetAuxTotalDPS() {
  if (!props.targetResult?.auxiliaryWeaponStats) return null;
  return props.targetResult.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0);
}

/**
 * 格式化百分比
 */
function fmtPct(val: number): string {
  if (val === 0) return '0%';
  return `${(val * 100).toFixed(0)}%`;
}

/**
 * 格式化 DPS 数字
 */
function fmtDps(val: number): string {
  if (val === 0) return '0';
  return val >= 1000 ? formatNumber(Math.round(val)) : val.toFixed(2);
}

/**
 * 格式化速度 (ms → s)
 */
function fmtReload(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

defineOptions({
  name: 'CalcResultTable'
})
</script>

<template>
  <div class="calc-result-table">
    <v-row class="calc-grid-top">
      <v-col :cols="isColOne ? 12 : 6">
        <AffixBoxHasTitleView :disabledTitle="isDisabledMoveTitle">
          <div variant="text" class="calc-section mb-3">
            <v-card-text class="pa-0">
              <table class="calc-table">
                <tbody>
                <tr>
                  <td class="label">{{ t('assembly.calc.hitPoints') }}</td>
                  <td class="value" colspan="2">
                    {{ formatNumber(result.hitPoints) }}
                    <span v-if="getDiff(result.hitPoints, targetResult?.hitPoints)" :style="{ color: getDiff(result.hitPoints, targetResult?.hitPoints)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.hitPoints, targetResult?.hitPoints)?.icon" size="10"></v-icon>
                      {{ getDiff(result.hitPoints, targetResult?.hitPoints)?.text }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.braceStrength') }}</td>
                  <td class="value" colspan="2">
                    {{ formatNumber(result.braceStrength) }}
                    <span v-if="getDiff(result.braceStrength, targetResult?.braceStrength)" :style="{ color: getDiff(result.braceStrength, targetResult?.braceStrength)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.braceStrength, targetResult?.braceStrength)?.icon" size="10"></v-icon>
                      {{ getDiff(result.braceStrength, targetResult?.braceStrength)?.text }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.stamina') }}</td>
                  <td class="value" colspan="2">
                    {{ result.stamina }}
                    <span v-if="getDiff(result.stamina, targetResult?.stamina)" :style="{ color: getDiff(result.stamina, targetResult?.stamina)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.stamina, targetResult?.stamina)?.icon" size="10"></v-icon>
                      {{ getDiff(result.stamina, targetResult?.stamina)?.text }}
                    </span>
                  </td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="3">{{ t('assembly.calc.sailSpeed') }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="pa-0">
                    <v-row dense>
                      <v-col cols="12" :lg="isColOne ? 12 : 5">
                        <table class="calc-table">
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.halfSail') }}</td>
                            <td class="value">
                              {{ result.sailSpeed.halfSail }}
                              <span v-if="getDiff(result.sailSpeed.halfSail, targetResult?.sailSpeed?.halfSail)" :style="{ color: getDiff(result.sailSpeed.halfSail, targetResult?.sailSpeed?.halfSail)?.color }" class="diff-indicator font-weight-bold ml-1">
                                <v-icon :icon="getDiff(result.sailSpeed.halfSail, targetResult?.sailSpeed?.halfSail)?.icon" size="10"></v-icon>
                                {{ getDiff(result.sailSpeed.halfSail, targetResult?.sailSpeed?.halfSail)?.text }}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.fullSail') }}</td>
                            <td class="value">
                              {{ result.sailSpeed.fullSail }}
                              <span v-if="getDiff(result.sailSpeed.fullSail, targetResult?.sailSpeed?.fullSail)" :style="{ color: getDiff(result.sailSpeed.fullSail, targetResult?.sailSpeed?.fullSail)?.color }" class="diff-indicator font-weight-bold ml-1">
                                <v-icon :icon="getDiff(result.sailSpeed.fullSail, targetResult?.sailSpeed?.fullSail)?.icon" size="10"></v-icon>
                                {{ getDiff(result.sailSpeed.fullSail, targetResult?.sailSpeed?.fullSail)?.text }}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.travelSail') }}</td>
                            <td class="value">
                              {{ result.sailSpeed.travelSail }}
                              <span v-if="getDiff(result.sailSpeed.travelSail, targetResult?.sailSpeed?.travelSail)" :style="{ color: getDiff(result.sailSpeed.travelSail, targetResult?.sailSpeed?.travelSail)?.color }" class="diff-indicator font-weight-bold ml-1">
                                <v-icon :icon="getDiff(result.sailSpeed.travelSail, targetResult?.sailSpeed?.travelSail)?.icon" size="10"></v-icon>
                                {{ getDiff(result.sailSpeed.travelSail, targetResult?.sailSpeed?.travelSail)?.text }}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </v-col>
                      <v-col cols="12" lg="7" v-if="!isColOne">
                        <ShipSailSpeedWidget
                            class="mt-n14"
                            v-if="data"
                            :data="data"
                            :isSimulationShipSailSpeed="isSimulationShipSailSpeed"
                            :isShowSailSpeedText="false">
                        </ShipSailSpeedWidget>
                      </v-col>
                    </v-row>
                  </td>
                </tr>

                <tr class="separator">
                  <td class="label" colspan="3">{{ t('assembly.calc.cargo') }}</td>
                </tr>
                <tr>
                  <td class="label sub">{{ t('assembly.calc.cargoSlots') }}</td>
                  <td class="value" colspan="2">
                    {{ result.cargo.cargoSlots }}
                    <span v-if="getDiff(result.cargo.cargoSlots, targetResult?.cargo?.cargoSlots)" :style="{ color: getDiff(result.cargo.cargoSlots, targetResult?.cargo?.cargoSlots)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.cargo.cargoSlots, targetResult?.cargo?.cargoSlots)?.icon" size="10"></v-icon>
                      {{ getDiff(result.cargo.cargoSlots, targetResult?.cargo?.cargoSlots)?.text }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="label sub">{{ t('assembly.calc.weight') }}</td>
                  <td class="value" colspan="2">
                    <div>
                      {{ t('assembly.calc.max') }} <u class="u">{{ formatNumber(result.cargo.cargoMaxWeight) }}</u>
                      <span v-if="getDiff(result.cargo.cargoMaxWeight, targetResult?.cargo?.cargoMaxWeight)" :style="{ color: getDiff(result.cargo.cargoMaxWeight, targetResult?.cargo?.cargoMaxWeight)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(result.cargo.cargoMaxWeight, targetResult?.cargo?.cargoMaxWeight)?.icon" size="10"></v-icon>
                        {{ getDiff(result.cargo.cargoMaxWeight, targetResult?.cargo?.cargoMaxWeight)?.text }}
                      </span>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
            </v-card-text>
          </div>
          <template v-slot:title>
            {{ t('assembly.calc.overall') }}
          </template>
        </AffixBoxHasTitleView>

        <AffixBoxHasTitleView :disabledTitle="isDisabledMoveTitle">
          <v-divider class="mb-2"></v-divider>
          <div variant="text" class="calc-section">
            <v-card-text class="pa-0">
              <table class="calc-table">
                <thead>
                <tr>
                  <th>
                    <div class="d-flex align-start">
                      <ItemSlotBase size="30px" class="mt-n2">
                        <ItemIconWidget :id="result.armorId"></ItemIconWidget>
                      </ItemSlotBase>
                      <p>
                        <ItemName :id="result.armorId"></ItemName>
                      </p>
                    </div>
                  </th>
                  <th>
                    <div class="d-flex align-center">
                      {{ t('assembly.calc.armor') }}
                    </div>
                  </th>
                  <td colspan="2" class="text-left">
                    <div class="d-flex align-center mt-n3">
                      <ItemSlotBase size="20px" :margin="0" :padding="0">
                        <DamageIconWidget id="armor" iconType="armor" :is-border="false"></DamageIconWidget>
                      </ItemSlotBase>
                      <u class="u">{{ formatNumber(result.armor) }}</u>
                      <span v-if="getDiff(result.armor, targetResult?.armor)" :style="{ color: getDiff(result.armor, targetResult?.armor)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(result.armor, targetResult?.armor)?.icon" size="10"></v-icon>
                        {{ getDiff(result.armor, targetResult?.armor)?.text }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr class="header-row">
                  <th></th>
                  <th class="text-left sub-th">{{ t('assembly.calc.armor') }}</th>
                  <th class="text-center sub-th">{{ t('assembly.calc.ship') }}</th>
                  <th class="text-right sub-th">{{ t('assembly.calc.total') }}</th>
                </tr>
                </thead>
                <tbody>
                <template v-for="(label, key) in mitigationLabels" :key="key">
                  <tr v-if="totalMitigation[key]">
                    <td class="label d-flex align-center">
                      <ItemSlotBase size="25px">
                        <DamageIconWidget :key="label" :id="label" iconType="armor" :is-border="false"></DamageIconWidget>
                      </ItemSlotBase>
                      <u class="u"> {{ t(`assembly.tags.damageTypes.${label}`) }}</u>
                    </td>
                    <td class="value text-left">{{ fmtPct(totalMitigation[key].armor) }}</td>
                    <td class="value text-center">{{ fmtPct(totalMitigation[key].ship) }}</td>
                    <td class="value text-right text-amber">
                      {{ fmtPct(totalMitigation[key].total) }}
                      <span v-if="getDiff(totalMitigation[key].total, targetTotalMitigation[key]?.total, { isPercent: true })" :style="{ color: getDiff(totalMitigation[key].total, targetTotalMitigation[key]?.total, { isPercent: true })?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(totalMitigation[key].total, targetTotalMitigation[key]?.total, { isPercent: true })?.icon" size="10"></v-icon>
                        {{ getDiff(totalMitigation[key].total, targetTotalMitigation[key]?.total, {isPercent: true})?.text }}
                      </span>
                    </td>
                  </tr>
                </template>
                </tbody>
              </table>
            </v-card-text>
          </div>

          <template v-slot:title>
            {{ t('assembly.calc.damageResistance') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <v-col :cols="isColOne ? 12 : 6">
        <AffixBoxHasTitleView :disabledTitle="isDisabledMoveTitle">
          <div variant="text" class="calc-section">
            <v-card-text class="pa-0">
              <table class="calc-table">
                <tbody>
                <tr>
                  <td class="label">{{ t('assembly.calc.baseDps') }}</td>
                  <td class="value">
                    {{ fmtDps(result.baseDPS) }}
                    <span v-if="getDiff(result.baseDPS, targetResult?.baseDPS)" :style="{ color: getDiff(result.baseDPS, targetResult?.baseDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.baseDPS, targetResult?.baseDPS)?.icon" size="10"></v-icon>
                      {{ getDiff(result.baseDPS, targetResult?.baseDPS)?.text }}
                    </span>
                  </td>
                </tr>
                <tr class="highlight-row">
                  <td class="label">{{ t('assembly.calc.dpsWithPerks') }}</td>
                  <td class="value accent">
                    {{ fmtDps(result.dpsWithPerks || result.totalDPS) }}
                    <span v-if="getDiff((result.dpsWithPerks || result.totalDPS), (targetResult?.dpsWithPerks || targetResult?.totalDPS))" :style="{ color: getDiff((result.dpsWithPerks || result.totalDPS), (targetResult?.dpsWithPerks || targetResult?.totalDPS))?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff((result.dpsWithPerks || result.totalDPS), (targetResult?.dpsWithPerks || targetResult?.totalDPS))?.icon" size="10"></v-icon>
                      {{ getDiff((result.dpsWithPerks || result.totalDPS), (targetResult?.dpsWithPerks || targetResult?.totalDPS))?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.shareExplosive > 0">
                  <td class="label sub">{{ t('assembly.calc.shareExplosive') }}</td>
                  <td class="value">
                    {{ fmtDps(result.shareExplosive) }}
                    <span v-if="getDiff(result.shareExplosive, targetResult?.shareExplosive)" :style="{ color: getDiff(result.shareExplosive, targetResult?.shareExplosive)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.shareExplosive, targetResult?.shareExplosive)?.icon" size="10"></v-icon>
                      {{ getDiff(result.shareExplosive, targetResult?.shareExplosive)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.shareFire > 0">
                  <td class="label sub">{{ t('assembly.calc.shareFire') }}</td>
                  <td class="value">
                    {{ fmtDps(result.shareFire) }}
                    <span v-if="getDiff(result.shareFire, targetResult?.shareFire)" :style="{ color: getDiff(result.shareFire, targetResult?.shareFire)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.shareFire, targetResult?.shareFire)?.icon" size="10"></v-icon>
                      {{ getDiff(result.shareFire, targetResult?.shareFire)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.shareFlooding > 0">
                  <td class="label sub">{{ t('assembly.calc.shareFlooding') }}</td>
                  <td class="value">
                    {{ fmtDps(result.shareFlooding) }}
                    <span v-if="getDiff(result.shareFlooding, targetResult?.shareFlooding)" :style="{ color: getDiff(result.shareFlooding, targetResult?.shareFlooding)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.shareFlooding, targetResult?.shareFlooding)?.icon" size="10"></v-icon>
                      {{ getDiff(result.shareFlooding, targetResult?.shareFlooding)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.sharePiercing > 0">
                  <td class="label sub">{{ t('assembly.calc.sharePiercing') }}</td>
                  <td class="value">
                    {{ fmtDps(result.sharePiercing) }}
                    <span v-if="getDiff(result.sharePiercing, targetResult?.sharePiercing)" :style="{ color: getDiff(result.sharePiercing, targetResult?.sharePiercing)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.sharePiercing, targetResult?.sharePiercing)?.icon" size="10"></v-icon>
                      {{ getDiff(result.sharePiercing, targetResult?.sharePiercing)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.shareElectric > 0">
                  <td class="label sub">{{ t('assembly.calc.shareElectric') }}</td>
                  <td class="value">
                    {{ fmtDps(result.shareElectric) }}
                    <span v-if="getDiff(result.shareElectric, targetResult?.shareElectric)" :style="{ color: getDiff(result.shareElectric, targetResult?.shareElectric)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.shareElectric, targetResult?.shareElectric)?.icon" size="10"></v-icon>
                      {{ getDiff(result.shareElectric, targetResult?.shareElectric)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.shareToxic > 0">
                  <td class="label sub">{{ t('assembly.calc.shareToxic') }}</td>
                  <td class="value">
                    {{ fmtDps(result.shareToxic) }}
                    <span v-if="getDiff(result.shareToxic, targetResult?.shareToxic)" :style="{ color: getDiff(result.shareToxic, targetResult?.shareToxic)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.shareToxic, targetResult?.shareToxic)?.icon" size="10"></v-icon>
                      {{ getDiff(result.shareToxic, targetResult?.shareToxic)?.text }}
                    </span>
                  </td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="2">{{ t('assembly.calc.situationalDamage') }}</td>
                </tr>
                <tr v-if="result.againstWeakpoints > 0">
                  <td class="label">{{ t('assembly.calc.againstWeakpoints') }}</td>
                  <td class="value text-warning">
                    {{ fmtDps(result.againstWeakpoints) }}
                    <span v-if="getDiff(result.againstWeakpoints, targetResult?.againstWeakpoints)" :style="{ color: getDiff(result.againstWeakpoints, targetResult?.againstWeakpoints)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.againstWeakpoints, targetResult?.againstWeakpoints)?.icon" size="10"></v-icon>
                      {{ getDiff(result.againstWeakpoints, targetResult?.againstWeakpoints)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.againstSails > 0">
                  <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                  <td class="value">
                    {{ fmtDps(result.againstSails) }}
                    <span v-if="getDiff(result.againstSails, targetResult?.againstSails)" :style="{ color: getDiff(result.againstSails, targetResult?.againstSails)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.againstSails, targetResult?.againstSails)?.icon" size="10"></v-icon>
                      {{ getDiff(result.againstSails, targetResult?.againstSails)?.text }}
                    </span>
                  </td>
                </tr>
                <tr v-if="result.againstStructures > 0">
                  <td class="label">{{ t('assembly.calc.againstStructures') }}</td>
                  <td class="value">
                    {{ fmtDps(result.againstStructures) }}
                    <span v-if="getDiff(result.againstStructures, targetResult?.againstStructures)" :style="{ color: getDiff(result.againstStructures, targetResult?.againstStructures)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.againstStructures, targetResult?.againstStructures)?.icon" size="10"></v-icon>
                      {{ getDiff(result.againstStructures, targetResult?.againstStructures)?.text }}
                    </span>
                  </td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="2">{{ t('assembly.calc.volleyEquipment') }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.totalDamagePerVolley') }}</td>
                  <td class="value">
                    {{ fmtDps(result.totalDamagePerVolley) }}
                    <span v-if="getDiff(result.totalDamagePerVolley, targetResult?.totalDamagePerVolley)" :style="{ color: getDiff(result.totalDamagePerVolley, targetResult?.totalDamagePerVolley)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.totalDamagePerVolley, targetResult?.totalDamagePerVolley)?.icon" size="10"></v-icon>
                      {{ getDiff(result.totalDamagePerVolley, targetResult?.totalDamagePerVolley)?.text }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.gearScore') }}</td>
                  <td class="value">
                    {{ result.totalGearScore }}
                    <span v-if="getDiff(result.totalGearScore, targetResult?.totalGearScore)" :style="{ color: getDiff(result.totalGearScore, targetResult?.totalGearScore)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.totalGearScore, targetResult?.totalGearScore)?.icon" size="10"></v-icon>
                      {{ getDiff(result.totalGearScore, targetResult?.totalGearScore)?.text }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.totalWeight') }}</td>
                  <td class="value">
                    {{ formatNumber(result.totalWeight) }}
                    <span v-if="getDiff(result.totalWeight, targetResult?.totalWeight)" :style="{ color: getDiff(result.totalWeight, targetResult?.totalWeight)?.color }" class="diff-indicator font-weight-bold ml-1">
                      <v-icon :icon="getDiff(result.totalWeight, targetResult?.totalWeight)?.icon" size="10"></v-icon>
                      {{ getDiff(result.totalWeight, targetResult?.totalWeight)?.text }}
                    </span>
                  </td>
                </tr>
                </tbody>
              </table>

              <!-- Perks -->
              <div v-if="displayPerks.length > 0" class="perks-section">
                <div class="perks-title d-flex align-center justify-space-between">
                  <span>{{ t('assembly.calc.perks') }}</span>
                </div>
                <div class="perks-chips">
                  <v-chip v-for="perk in displayPerks"
                          :key="perk"
                          size="x-small"
                          variant="tonal"
                          color="amber"
                          class="perk-chip">
                    <PerksName :id="perk"></PerksName>
                  </v-chip>

                  <v-divider vertical class="mx-1"></v-divider>

                  <v-chip size="x-small"
                          variant="tonal"
                          color="amber"
                          class="perk-chip"
                          @click="showPerkDescriptions = !showPerkDescriptions">
                    <v-icon :icon="showPerkDescriptions ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small"></v-icon>
                  </v-chip>
                </div>

                <v-expand-transition>
                  <div v-show="showPerkDescriptions" class="perks-descriptions mt-3 pt-2">
                    <div v-for="perk in displayPerks" :key="perk" class="perk-desc-item mb-2 pb-2">
                      <div class="font-weight-bold text-amber text-caption d-flex align-center ga-1">
                        <PerksName :id="perk"></PerksName>
                      </div>
                      <div class="text-caption opacity-80 pl-4 mt-1">
                        <PerkDescription :data="({ perks: [perk] } as any)" :id="perk" class="opacity-80 text-pre-wrap mb-1"></PerkDescription>
                      </div>
                    </div>
                  </div>
                </v-expand-transition>
              </div>
            </v-card-text>
          </div>
          <template v-slot:title>
            {{ t('assembly.calc.totalDpsTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>

    <v-row class="calc-grid-weapons">
      <!-- 每个方向 -->
      <template v-for="dirStats in result.weaponStats" :key="dirStats.direction">
        <v-col cols="12" :lg="isColOne ? 12 : 4">
          <AffixBoxHasTitleView :disabledTitle="isDisabledMoveTitle">
            <v-row class="direction-total-dps pt-3">
              <v-divider opacity=".2"></v-divider>
            </v-row>

            <v-col class="weapon-direction-block">

              <template v-for="(w, idx) in dirStats.weapons" :key="w.weaponId + idx">
                <table class="calc-table weapon-detail-table">
                  <thead>
                  <tr class="weapon-name-row">
                    <th colspan="3" class="text-center pb-4">
                      <ItemSlotBase size="50px" class="mx-auto">
                        <ItemIconWidget :id="w.weaponId"></ItemIconWidget>
                      </ItemSlotBase>
                      <p class="text-h6">
                        <ItemName :id="w.weaponId"></ItemName>
                      </p>

                      <p class="u text-amber">
                        {{ fmtDps(dirStats.dpsWithPerks || dirStats.totalDPS) }}
                        <span v-if="getDiff(dirStats.dpsWithPerks || dirStats.totalDPS, getTargetDirectionStats(dirStats.direction)?.dpsWithPerks || getTargetDirectionStats(dirStats.direction)?.totalDPS)" :style="{ color: getDiff(dirStats.dpsWithPerks || dirStats.totalDPS, getTargetDirectionStats(dirStats.direction)?.dpsWithPerks || getTargetDirectionStats(dirStats.direction)?.totalDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                          <v-icon :icon="getDiff(dirStats.dpsWithPerks || dirStats.totalDPS, getTargetDirectionStats(dirStats.direction)?.dpsWithPerks || getTargetDirectionStats(dirStats.direction)?.totalDPS)?.icon" size="10"></v-icon>
                          {{ getDiff(dirStats.dpsWithPerks || dirStats.totalDPS, getTargetDirectionStats(dirStats.direction)?.dpsWithPerks || getTargetDirectionStats(dirStats.direction)?.totalDPS)?.text }}
                        </span>
                      </p>
                    </th>
                  </tr>
                  <tr>
                    <th></th>
                    <th class="text-center sub-th">{{ t('assembly.calc.singleGunPort') }}</th>
                    <th class="text-center sub-th">{{ t('assembly.calc.multiGunPorts', {count: w.gunPorts}) }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td class="label">{{ t('assembly.calc.baseDamageDps') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.singlePortBaseDPS) }}
                      <span v-if="getDiff(w.singlePortBaseDPS, getTargetWeapon(dirStats.direction, idx)?.singlePortBaseDPS)" :style="{ color: getDiff(w.singlePortBaseDPS, getTargetWeapon(dirStats.direction, idx)?.singlePortBaseDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.singlePortBaseDPS, getTargetWeapon(dirStats.direction, idx)?.singlePortBaseDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.singlePortBaseDPS, getTargetWeapon(dirStats.direction, idx)?.singlePortBaseDPS)?.text }}
                      </span>
                    </td>
                    <td class="value text-center">
                      {{ fmtDps(w.baseDPS) }}
                      <span v-if="getDiff(w.baseDPS, getTargetWeapon(dirStats.direction, idx)?.baseDPS)" :style="{ color: getDiff(w.baseDPS, getTargetWeapon(dirStats.direction, idx)?.baseDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.baseDPS, getTargetWeapon(dirStats.direction, idx)?.baseDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.baseDPS, getTargetWeapon(dirStats.direction, idx)?.baseDPS)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label">{{ t('assembly.calc.damageWithPerks') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.singlePortDpsWithPerks) }}
                      <span v-if="getDiff(w.singlePortDpsWithPerks, getTargetWeapon(dirStats.direction, idx)?.singlePortDpsWithPerks)" :style="{ color: getDiff(w.singlePortDpsWithPerks, getTargetWeapon(dirStats.direction, idx)?.singlePortDpsWithPerks)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.singlePortDpsWithPerks, getTargetWeapon(dirStats.direction, idx)?.singlePortDpsWithPerks)?.icon" size="10"></v-icon>
                        {{ getDiff(w.singlePortDpsWithPerks, getTargetWeapon(dirStats.direction, idx)?.singlePortDpsWithPerks)?.text }}
                      </span>
                    </td>
                    <td class="value text-center accent">
                      {{ fmtDps(w.dpsWithPerks || w.totalDPS) }}
                      <span v-if="getDiff(w.dpsWithPerks || w.totalDPS, getTargetWeapon(dirStats.direction, idx)?.dpsWithPerks || getTargetWeapon(dirStats.direction, idx)?.totalDPS)" :style="{ color: getDiff(w.dpsWithPerks || w.totalDPS, getTargetWeapon(dirStats.direction, idx)?.dpsWithPerks || getTargetWeapon(dirStats.direction, idx)?.totalDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.dpsWithPerks || w.totalDPS, getTargetWeapon(dirStats.direction, idx)?.dpsWithPerks || getTargetWeapon(dirStats.direction, idx)?.totalDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.dpsWithPerks || w.totalDPS, getTargetWeapon(dirStats.direction, idx)?.dpsWithPerks || getTargetWeapon(dirStats.direction, idx)?.totalDPS)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.shareExplosive > 0">
                    <td class="label sub">{{ t('assembly.calc.shareExplosive') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.shareExplosive) }}
                      <span v-if="getDiff(w.shareExplosive, getTargetWeapon(dirStats.direction, idx)?.shareExplosive)" :style="{ color: getDiff(w.shareExplosive, getTargetWeapon(dirStats.direction, idx)?.shareExplosive)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.shareExplosive, getTargetWeapon(dirStats.direction, idx)?.shareExplosive)?.icon" size="10"></v-icon>
                        {{ getDiff(w.shareExplosive, getTargetWeapon(dirStats.direction, idx)?.shareExplosive)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.shareFire > 0">
                    <td class="label sub">{{ t('assembly.calc.shareFire') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.shareFire) }}
                      <span v-if="getDiff(w.shareFire, getTargetWeapon(dirStats.direction, idx)?.shareFire)" :style="{ color: getDiff(w.shareFire, getTargetWeapon(dirStats.direction, idx)?.shareFire)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.shareFire, getTargetWeapon(dirStats.direction, idx)?.shareFire)?.icon" size="10"></v-icon>
                        {{ getDiff(w.shareFire, getTargetWeapon(dirStats.direction, idx)?.shareFire)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.shareFlooding > 0">
                    <td class="label sub">{{ t('assembly.calc.shareFlooding') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.shareFlooding) }}
                      <span v-if="getDiff(w.shareFlooding, getTargetWeapon(dirStats.direction, idx)?.shareFlooding)" :style="{ color: getDiff(w.shareFlooding, getTargetWeapon(dirStats.direction, idx)?.shareFlooding)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.shareFlooding, getTargetWeapon(dirStats.direction, idx)?.shareFlooding)?.icon" size="10"></v-icon>
                        {{ getDiff(w.shareFlooding, getTargetWeapon(dirStats.direction, idx)?.shareFlooding)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.sharePiercing > 0">
                    <td class="label sub">{{ t('assembly.calc.sharePiercing') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.sharePiercing) }}
                      <span v-if="getDiff(w.sharePiercing, getTargetWeapon(dirStats.direction, idx)?.sharePiercing)" :style="{ color: getDiff(w.sharePiercing, getTargetWeapon(dirStats.direction, idx)?.sharePiercing)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.sharePiercing, getTargetWeapon(dirStats.direction, idx)?.sharePiercing)?.icon" size="10"></v-icon>
                        {{ getDiff(w.sharePiercing, getTargetWeapon(dirStats.direction, idx)?.sharePiercing)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.shareElectric > 0">
                    <td class="label sub">{{ t('assembly.calc.shareElectric') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.shareElectric) }}
                      <span v-if="getDiff(w.shareElectric, getTargetWeapon(dirStats.direction, idx)?.shareElectric)" :style="{ color: getDiff(w.shareElectric, getTargetWeapon(dirStats.direction, idx)?.shareElectric)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.shareElectric, getTargetWeapon(dirStats.direction, idx)?.shareElectric)?.icon" size="10"></v-icon>
                        {{ getDiff(w.shareElectric, getTargetWeapon(dirStats.direction, idx)?.shareElectric)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.shareToxic > 0">
                    <td class="label sub">{{ t('assembly.calc.shareToxic') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.shareToxic) }}
                      <span v-if="getDiff(w.shareToxic, getTargetWeapon(dirStats.direction, idx)?.shareToxic)" :style="{ color: getDiff(w.shareToxic, getTargetWeapon(dirStats.direction, idx)?.shareToxic)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.shareToxic, getTargetWeapon(dirStats.direction, idx)?.shareToxic)?.icon" size="10"></v-icon>
                        {{ getDiff(w.shareToxic, getTargetWeapon(dirStats.direction, idx)?.shareToxic)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstWeakpoints > 0">
                    <td class="label">{{ t('assembly.calc.weakpointCrit') }}</td>
                    <td class="value text-center text-warning" colspan="2">
                      {{ fmtDps(w.againstWeakpoints) }}
                      <span v-if="getDiff(w.againstWeakpoints, getTargetWeapon(dirStats.direction, idx)?.againstWeakpoints)" :style="{ color: getDiff(w.againstWeakpoints, getTargetWeapon(dirStats.direction, idx)?.againstWeakpoints)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstWeakpoints, getTargetWeapon(dirStats.direction, idx)?.againstWeakpoints)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstWeakpoints, getTargetWeapon(dirStats.direction, idx)?.againstWeakpoints)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstSails > 0">
                    <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.againstSails) }}
                      <span v-if="getDiff(w.againstSails, getTargetWeapon(dirStats.direction, idx)?.againstSails)" :style="{ color: getDiff(w.againstSails, getTargetWeapon(dirStats.direction, idx)?.againstSails)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstSails, getTargetWeapon(dirStats.direction, idx)?.againstSails)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstSails, getTargetWeapon(dirStats.direction, idx)?.againstSails)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstStructures > 0">
                    <td class="label">{{ t('assembly.calc.againstStructuresShort') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.againstStructures) }}
                      <span v-if="getDiff(w.againstStructures, getTargetWeapon(dirStats.direction, idx)?.againstStructures)" :style="{ color: getDiff(w.againstStructures, getTargetWeapon(dirStats.direction, idx)?.againstStructures)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstStructures, getTargetWeapon(dirStats.direction, idx)?.againstStructures)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstStructures, getTargetWeapon(dirStats.direction, idx)?.againstStructures)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr class="separator">
                    <td class="label" colspan="3">{{ t('assembly.calc.firingAttributes') }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.damagePerShotVolley') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.totalDamagePerShot) }}
                      <span v-if="getDiff(w.totalDamagePerShot, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerShot)" :style="{ color: getDiff(w.totalDamagePerShot, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerShot)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.totalDamagePerShot, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerShot)?.icon" size="10"></v-icon>
                        {{ getDiff(w.totalDamagePerShot, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerShot)?.text }}
                      </span>
                    </td>
                    <td class="value text-center">
                      {{ fmtDps(w.totalDamagePerVolley) }}
                      <span v-if="getDiff(w.totalDamagePerVolley, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerVolley)" :style="{ color: getDiff(w.totalDamagePerVolley, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerVolley)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.totalDamagePerVolley, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerVolley)?.icon" size="10"></v-icon>
                        {{ getDiff(w.totalDamagePerVolley, getTargetWeapon(dirStats.direction, idx)?.totalDamagePerVolley)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.reloadSpeed') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtReload(w.finalReloadSpeed) }}
                      <span v-if="getDiff(w.finalReloadSpeed, getTargetWeapon(dirStats.direction, idx)?.finalReloadSpeed, { isTime: true })" :style="{ color: getDiff(w.finalReloadSpeed, getTargetWeapon(dirStats.direction, idx)?.finalReloadSpeed, { isTime: true })?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.finalReloadSpeed, getTargetWeapon(dirStats.direction, idx)?.finalReloadSpeed, { isTime: true })?.icon" size="10"></v-icon>
                        {{ getDiff(w.finalReloadSpeed, getTargetWeapon(dirStats.direction, idx)?.finalReloadSpeed, {isTime: true})?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.optimalRange') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ w.optimalRange }}m
                      <span v-if="getDiff(w.optimalRange, getTargetWeapon(dirStats.direction, idx)?.optimalRange)" :style="{ color: getDiff(w.optimalRange, getTargetWeapon(dirStats.direction, idx)?.optimalRange)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.optimalRange, getTargetWeapon(dirStats.direction, idx)?.optimalRange)?.icon" size="10"></v-icon>
                        {{ getDiff(w.optimalRange, getTargetWeapon(dirStats.direction, idx)?.optimalRange)?.text }}m
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.rateOfFire > 0">
                    <td class="label">{{ t('assembly.calc.rateOfFire') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ w.rateOfFire }}ms
                      <span v-if="getDiff(w.rateOfFire, getTargetWeapon(dirStats.direction, idx)?.rateOfFire)" :style="{ color: getDiff(w.rateOfFire, getTargetWeapon(dirStats.direction, idx)?.rateOfFire)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.rateOfFire, getTargetWeapon(dirStats.direction, idx)?.rateOfFire)?.icon" size="10"></v-icon>
                        {{ getDiff(w.rateOfFire, getTargetWeapon(dirStats.direction, idx)?.rateOfFire)?.text }}ms
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.projectilesPerShot > 1">
                    <td class="label">{{ t('assembly.calc.projectilesPerShot') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ w.projectilesPerShot }}
                      <span v-if="getDiff(w.projectilesPerShot, getTargetWeapon(dirStats.direction, idx)?.projectilesPerShot)" :style="{ color: getDiff(w.projectilesPerShot, getTargetWeapon(dirStats.direction, idx)?.projectilesPerShot)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.projectilesPerShot, getTargetWeapon(dirStats.direction, idx)?.projectilesPerShot)?.icon" size="10"></v-icon>
                        {{ getDiff(w.projectilesPerShot, getTargetWeapon(dirStats.direction, idx)?.projectilesPerShot)?.text }}
                      </span>
                    </td>
                  </tr>
                  </tbody>
                </table>

                <!--                &lt;!&ndash; 模组标记 &ndash;&gt;-->
                <!--                <div v-if="w.modifications.length > 0 || w.bonusFlags.length > 0" class="mod-flags">-->
                <!--                  <v-chip v-for="m in w.modifications"-->
                <!--                          :key="m.modId"-->
                <!--                          size="x-small"-->
                <!--                          variant="text"-->
                <!--                          color="cyan"-->
                <!--                          class="mod-chip">-->
                <!--                    {{ m.modId }}-->
                <!--                    <span class="mod-range">{{ (m.midValue * 100).toFixed(1) }}%</span>-->
                <!--                  </v-chip>-->
                <!--                  <v-chip v-for="flag in w.bonusFlags"-->
                <!--                          :key="flag"-->
                <!--                          size="x-small"-->
                <!--                          variant="text"-->
                <!--                          color="orange"-->
                <!--                          class="mod-chip">-->
                <!--                    {{ flag }}-->
                <!--                  </v-chip>-->
                <!--                </div>-->
              </template>
            </v-col>

            <template v-slot:title>
              {{ getDirectionName(dirStats.direction) }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </template>

      <!-- 副武器 -->
      <template v-if="result.auxiliaryWeaponStats.length > 0">
        <v-col cols="12" :lg="isColOne ? 12 : 4">
          <AffixBoxHasTitleView :disabledTitle="isDisabledMoveTitle">
            <v-row class="direction-total-dps py-3">
              <v-divider opacity=".2"></v-divider>
            </v-row>

            <div class="weapon-direction-block">
              <template v-for="(w, idx) in result.auxiliaryWeaponStats" :key="w.weaponId + idx">
                <table class="calc-table weapon-detail-table">
                  <thead>
                  <tr class="weapon-name-row">
                    <th colspan="3" class="text-center pb-4">
                      <ItemSlotBase size="50px" class="mx-auto">
                        <ItemIconWidget :id="w.weaponId"></ItemIconWidget>
                      </ItemSlotBase>
                      <p class="text-h6">
                        <ItemName :id="w.weaponId"></ItemName>
                      </p>

                      <p class="u text-amber">
                        {{ fmtDps(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0)) }}
                        <span v-if="getDiff(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0), getTargetAuxTotalDPS())" :style="{ color: getDiff(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0), getTargetAuxTotalDPS())?.color }" class="diff-indicator font-weight-bold ml-1">
                          <v-icon :icon="getDiff(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0), getTargetAuxTotalDPS())?.icon" size="10"></v-icon>
                          {{ getDiff(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0), getTargetAuxTotalDPS())?.text }}
                        </span>
                      </p>
                    </th>
                  </tr>
                  <tr>
                    <th></th>
                    <th class="text-center sub-th">{{ t('assembly.calc.singleGunPort') }}</th>
                    <th class="text-center sub-th">{{ t('assembly.calc.multiGunPorts', {count: w.gunPorts}) }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td class="label">{{ t('assembly.calc.baseDamageDps') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.singlePortBaseDPS) }}
                      <span v-if="getDiff(w.singlePortBaseDPS, getTargetAuxWeapon(idx)?.singlePortBaseDPS)" :style="{ color: getDiff(w.singlePortBaseDPS, getTargetAuxWeapon(idx)?.singlePortBaseDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.singlePortBaseDPS, getTargetAuxWeapon(idx)?.singlePortBaseDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.singlePortBaseDPS, getTargetAuxWeapon(idx)?.singlePortBaseDPS)?.text }}
                      </span>
                    </td>
                    <td class="value text-center">
                      {{ fmtDps(w.baseDPS) }}
                      <span v-if="getDiff(w.baseDPS, getTargetAuxWeapon(idx)?.baseDPS)" :style="{ color: getDiff(w.baseDPS, getTargetAuxWeapon(idx)?.baseDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.baseDPS, getTargetAuxWeapon(idx)?.baseDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.baseDPS, getTargetAuxWeapon(idx)?.baseDPS)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label">{{ t('assembly.calc.damageWithPerks') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.singlePortDpsWithPerks) }}
                      <span v-if="getDiff(w.singlePortDpsWithPerks, getTargetAuxWeapon(idx)?.singlePortDpsWithPerks)" :style="{ color: getDiff(w.singlePortDpsWithPerks, getTargetAuxWeapon(idx)?.singlePortDpsWithPerks)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.singlePortDpsWithPerks, getTargetAuxWeapon(idx)?.singlePortDpsWithPerks)?.icon" size="10"></v-icon>
                        {{ getDiff(w.singlePortDpsWithPerks, getTargetAuxWeapon(idx)?.singlePortDpsWithPerks)?.text }}
                      </span>
                    </td>
                    <td class="value text-center accent">
                      {{ fmtDps(w.dpsWithPerks || w.totalDPS) }}
                      <span v-if="getDiff(w.dpsWithPerks || w.totalDPS, getTargetAuxWeapon(idx)?.dpsWithPerks || getTargetAuxWeapon(idx)?.totalDPS)" :style="{ color: getDiff(w.dpsWithPerks || w.totalDPS, getTargetAuxWeapon(idx)?.dpsWithPerks || getTargetAuxWeapon(idx)?.totalDPS)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.dpsWithPerks || w.totalDPS, getTargetAuxWeapon(idx)?.dpsWithPerks || getTargetAuxWeapon(idx)?.totalDPS)?.icon" size="10"></v-icon>
                        {{ getDiff(w.dpsWithPerks || w.totalDPS, getTargetAuxWeapon(idx)?.dpsWithPerks || getTargetAuxWeapon(idx)?.totalDPS)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstWeakpoints > 0">
                    <td class="label">{{ t('assembly.calc.weakpointCrit') }}</td>
                    <td class="value text-center text-warning" colspan="2">
                      {{ fmtDps(w.againstWeakpoints) }}
                      <span v-if="getDiff(w.againstWeakpoints, getTargetAuxWeapon(idx)?.againstWeakpoints)" :style="{ color: getDiff(w.againstWeakpoints, getTargetAuxWeapon(idx)?.againstWeakpoints)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstWeakpoints, getTargetAuxWeapon(idx)?.againstWeakpoints)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstWeakpoints, getTargetAuxWeapon(idx)?.againstWeakpoints)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstSails > 0">
                    <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.againstSails) }}
                      <span v-if="getDiff(w.againstSails, getTargetAuxWeapon(idx)?.againstSails)" :style="{ color: getDiff(w.againstSails, getTargetAuxWeapon(idx)?.againstSails)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstSails, getTargetAuxWeapon(idx)?.againstSails)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstSails, getTargetAuxWeapon(idx)?.againstSails)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="w.againstStructures > 0">
                    <td class="label">{{ t('assembly.calc.againstStructuresShort') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtDps(w.againstStructures) }}
                      <span v-if="getDiff(w.againstStructures, getTargetAuxWeapon(idx)?.againstStructures)" :style="{ color: getDiff(w.againstStructures, getTargetAuxWeapon(idx)?.againstStructures)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.againstStructures, getTargetAuxWeapon(idx)?.againstStructures)?.icon" size="10"></v-icon>
                        {{ getDiff(w.againstStructures, getTargetAuxWeapon(idx)?.againstStructures)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr class="separator">
                    <td class="label" colspan="3">{{ t('assembly.calc.firingAttributes') }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.damagePerShotVolley') }}</td>
                    <td class="value text-center">
                      {{ fmtDps(w.totalDamagePerShot) }}
                      <span v-if="getDiff(w.totalDamagePerShot, getTargetAuxWeapon(idx)?.totalDamagePerShot)" :style="{ color: getDiff(w.totalDamagePerShot, getTargetAuxWeapon(idx)?.totalDamagePerShot)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.totalDamagePerShot, getTargetAuxWeapon(idx)?.totalDamagePerShot)?.icon" size="10"></v-icon>
                        {{ getDiff(w.totalDamagePerShot, getTargetAuxWeapon(idx)?.totalDamagePerShot)?.text }}
                      </span>
                    </td>
                    <td class="value text-center">
                      {{ fmtDps(w.totalDamagePerVolley) }}
                      <span v-if="getDiff(w.totalDamagePerVolley, getTargetAuxWeapon(idx)?.totalDamagePerVolley)" :style="{ color: getDiff(w.totalDamagePerVolley, getTargetAuxWeapon(idx)?.totalDamagePerVolley)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.totalDamagePerVolley, getTargetAuxWeapon(idx)?.totalDamagePerVolley)?.icon" size="10"></v-icon>
                        {{ getDiff(w.totalDamagePerVolley, getTargetAuxWeapon(idx)?.totalDamagePerVolley)?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.reloadSpeed') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ fmtReload(w.finalReloadSpeed) }}
                      <span v-if="getDiff(w.finalReloadSpeed, getTargetAuxWeapon(idx)?.finalReloadSpeed, { isTime: true })" :style="{ color: getDiff(w.finalReloadSpeed, getTargetAuxWeapon(idx)?.finalReloadSpeed, { isTime: true })?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.finalReloadSpeed, getTargetAuxWeapon(idx)?.finalReloadSpeed, { isTime: true })?.icon" size="10"></v-icon>
                        {{ getDiff(w.finalReloadSpeed, getTargetAuxWeapon(idx)?.finalReloadSpeed, {isTime: true})?.text }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.optimalRange') }}</td>
                    <td class="value text-center" colspan="2">
                      {{ w.optimalRange }}m
                      <span v-if="getDiff(w.optimalRange, getTargetAuxWeapon(idx)?.optimalRange)" :style="{ color: getDiff(w.optimalRange, getTargetAuxWeapon(idx)?.optimalRange)?.color }" class="diff-indicator font-weight-bold ml-1">
                        <v-icon :icon="getDiff(w.optimalRange, getTargetAuxWeapon(idx)?.optimalRange)?.icon" size="10"></v-icon>
                        {{ getDiff(w.optimalRange, getTargetAuxWeapon(idx)?.optimalRange)?.text }}m
                      </span>
                    </td>
                  </tr>
                  </tbody>
                </table>

                <!--                <div v-if="w.modifications.length > 0 || w.bonusFlags.length > 0" class="mod-flags">-->
                <!--                  <v-chip v-for="m in w.modifications"-->
                <!--                          :key="m.modId"-->
                <!--                          size="x-small"-->
                <!--                          variant="text"-->
                <!--                          color="cyan"-->
                <!--                          class="mod-chip">-->
                <!--                    {{ m.modId }}-->
                <!--                    <span class="mod-range">{{ (m.midValue * 100).toFixed(1) }}%</span>-->
                <!--                  </v-chip>-->
                <!--                  <v-chip v-for="flag in w.bonusFlags"-->
                <!--                          :key="flag"-->
                <!--                          size="x-small"-->
                <!--                          variant="text"-->
                <!--                          color="orange"-->
                <!--                          class="mod-chip">-->
                <!--                    {{ flag }}-->
                <!--                  </v-chip>-->
                <!--                </div>-->
              </template>
            </div>

            <template v-slot:title>
              {{ t('codex.ship.auxiliaryWeapon') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </template>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.calc-result-table {
  width: 100%;
  font-size: 13px;
}

.calc-grid-top {
}

.calc-section {
}

.calc-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 5px 12px;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .sub-th {
    font-size: 11px;
    font-weight: 400;
  }

  .header-row th {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  tr:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .label {
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    font-weight: 500;

    &.sub {
      padding-left: 24px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.55);
    }
  }

  .value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: rgba(255, 255, 255, 0.9);

    &.accent {
      color: rgba(255, 193, 7, 1);
      font-weight: 700;
    }

    &.dim {
      color: rgba(255, 255, 255, 0.25);
    }

    &.highlight {
      font-weight: 600;
      color: rgba(100, 255, 218, 0.9);
    }
  }

  .separator td {
    padding-top: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .highlight-row {
    background: rgba(255, 193, 7, 0.04);
  }
}

.perks-section {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.perks-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.perks-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.perk-chip {
  font-size: 11px !important;
}

.perks-descriptions {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.perk-desc-item {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.weapon-direction-block {
}

.direction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 193, 7, 0.06);
  font-weight: 700;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.direction-total-dps {
  font-size: 12px;
  color: rgba(255, 193, 7, 0.9);
  font-weight: 600;
}

.weapon-detail-table {
  .weapon-name-row th {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    padding: 8px 12px 4px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.mod-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 12px 10px;
}

.mod-chip {
  font-size: 10px !important;

  .mod-range {
    margin-left: 4px;
    opacity: 0.7;
  }
}
</style>
