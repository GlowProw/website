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
import {Ships, type Ship} from "glow-prow-data";

const {t} = useI18n();
const {perk} = useI18nReadName();

interface Props {
  result: ItemCalcResult;
  isSimulationShipSailSpeed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSimulationShipSailSpeed: true
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
      <v-col cols="6">
        <AffixBoxHasTitleView>
          <div variant="text" class="calc-section mb-3">
            <v-card-text class="pa-0">
              <table class="calc-table">
                <tbody>
                <tr>
                  <td class="label">{{ t('assembly.calc.hitPoints') }}</td>
                  <td class="value" colspan="2">{{ formatNumber(result.hitPoints) }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.braceStrength') }}</td>
                  <td class="value" colspan="2">{{ formatNumber(result.braceStrength) }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.stamina') }}</td>
                  <td class="value" colspan="2">{{ result.stamina }}</td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="3">{{ t('assembly.calc.sailSpeed') }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="pa-0">
                    <v-row dense>
                      <v-col cols="12" lg="5">
                        <table class="calc-table">
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.halfSail') }}</td>
                            <td class="value">{{ result.sailSpeed.halfSail }}</td>
                          </tr>
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.fullSail') }}</td>
                            <td class="value">{{ result.sailSpeed.fullSail }}</td>
                          </tr>
                          <tr>
                            <td class="label sub">{{ t('assembly.calc.travelSail') }}</td>
                            <td class="value">{{ result.sailSpeed.travelSail }}</td>
                          </tr>
                        </table>
                      </v-col>
                      <v-col cols="12" lg="7">
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
                  <td class="value" colspan="2">{{ result.cargo.cargoSlots }}</td>
                </tr>
                <tr>
                  <td class="label sub">{{ t('assembly.calc.weight') }}</td>
                  <td class="value" colspan="2">
                    <div>{{ t('assembly.calc.max') }} <u class="u">{{ formatNumber(result.cargo.cargoMaxWeight) }}</u></div>
<!--                    <div>{{ t('assembly.calc.used') }} {{ formatNumber(result.totalWeight) }}</div>-->
<!--                    <div>{{ t('assembly.calc.free') }} {{ formatNumber(result.cargo.cargoMaxWeight - result.totalWeight) }}</div>-->
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

        <AffixBoxHasTitleView>
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
                    <td class="value text-right text-amber">{{ fmtPct(totalMitigation[key].total) }}</td>
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

      <v-col cols="6">
        <AffixBoxHasTitleView>
          <div variant="text" class="calc-section">
            <v-card-text class="pa-0">
              <table class="calc-table">
                <tbody>
                <tr>
                  <td class="label">{{ t('assembly.calc.baseDps') }}</td>
                  <td class="value">{{ fmtDps(result.baseDPS) }}</td>
                </tr>
                <tr class="highlight-row">
                  <td class="label">{{ t('assembly.calc.dpsWithPerks') }}</td>
                  <td class="value accent">{{ fmtDps(result.dpsWithPerks || result.totalDPS) }}</td>
                </tr>
                <tr v-if="result.shareExplosive > 0">
                  <td class="label sub">{{ t('assembly.calc.shareExplosive') }}</td>
                  <td class="value">{{ fmtDps(result.shareExplosive) }}</td>
                </tr>
                <tr v-if="result.shareFire > 0">
                  <td class="label sub">{{ t('assembly.calc.shareFire') }}</td>
                  <td class="value">{{ fmtDps(result.shareFire) }}</td>
                </tr>
                <tr v-if="result.shareFlooding > 0">
                  <td class="label sub">{{ t('assembly.calc.shareFlooding') }}</td>
                  <td class="value">{{ fmtDps(result.shareFlooding) }}</td>
                </tr>
                <tr v-if="result.sharePiercing > 0">
                  <td class="label sub">{{ t('assembly.calc.sharePiercing') }}</td>
                  <td class="value">{{ fmtDps(result.sharePiercing) }}</td>
                </tr>
                <tr v-if="result.shareElectric > 0">
                  <td class="label sub">{{ t('assembly.calc.shareElectric') }}</td>
                  <td class="value">{{ fmtDps(result.shareElectric) }}</td>
                </tr>
                <tr v-if="result.shareToxic > 0">
                  <td class="label sub">{{ t('assembly.calc.shareToxic') }}</td>
                  <td class="value">{{ fmtDps(result.shareToxic) }}</td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="2">{{ t('assembly.calc.situationalDamage') }}</td>
                </tr>
                <tr v-if="result.againstWeakpoints > 0">
                  <td class="label">{{ t('assembly.calc.againstWeakpoints') }}</td>
                  <td class="value text-warning">{{ fmtDps(result.againstWeakpoints) }}</td>
                </tr>
                <tr v-if="result.againstSails > 0">
                  <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                  <td class="value">{{ fmtDps(result.againstSails) }}</td>
                </tr>
                <tr v-if="result.againstStructures > 0">
                  <td class="label">{{ t('assembly.calc.againstStructures') }}</td>
                  <td class="value">{{ fmtDps(result.againstStructures) }}</td>
                </tr>
                <tr class="separator">
                  <td class="label" colspan="2">{{ t('assembly.calc.volleyEquipment') }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.totalDamagePerVolley') }}</td>
                  <td class="value">{{ fmtDps(result.totalDamagePerVolley) }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.gearScore') }}</td>
                  <td class="value">{{ result.totalGearScore }}</td>
                </tr>
                <tr>
                  <td class="label">{{ t('assembly.calc.totalWeight') }}</td>
                  <td class="value">{{ formatNumber(result.totalWeight) }}</td>
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
        <v-col cols="12" lg="4">
          <AffixBoxHasTitleView>
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
                      </p>
                    </th>
                  </tr>
                  <tr>
                    <th></th>
                    <th class="text-center sub-th">{{ t('assembly.calc.singleGunPort') }}</th>
                    <th class="text-center sub-th">{{ t('assembly.calc.multiGunPorts', { count: w.gunPorts }) }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td class="label">{{ t('assembly.calc.baseDamageDps') }}</td>
                    <td class="value text-center">{{ fmtDps(w.singlePortBaseDPS) }}</td>
                    <td class="value text-center">{{ fmtDps(w.baseDPS) }}</td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label">{{ t('assembly.calc.damageWithPerks') }}</td>
                    <td class="value text-center">{{ fmtDps(w.singlePortDpsWithPerks) }}</td>
                    <td class="value text-center accent">{{ fmtDps(w.dpsWithPerks || w.totalDPS) }}</td>
                  </tr>
                  <tr v-if="w.shareExplosive > 0">
                    <td class="label sub">{{ t('assembly.calc.shareExplosive') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.shareExplosive) }}</td>
                  </tr>
                  <tr v-if="w.shareFire > 0">
                    <td class="label sub">{{ t('assembly.calc.shareFire') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.shareFire) }}</td>
                  </tr>
                  <tr v-if="w.shareFlooding > 0">
                    <td class="label sub">{{ t('assembly.calc.shareFlooding') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.shareFlooding) }}</td>
                  </tr>
                  <tr v-if="w.sharePiercing > 0">
                    <td class="label sub">{{ t('assembly.calc.sharePiercing') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.sharePiercing) }}</td>
                  </tr>
                  <tr v-if="w.shareElectric > 0">
                    <td class="label sub">{{ t('assembly.calc.shareElectric') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.shareElectric) }}</td>
                  </tr>
                  <tr v-if="w.shareToxic > 0">
                    <td class="label sub">{{ t('assembly.calc.shareToxic') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.shareToxic) }}</td>
                  </tr>
                  <tr v-if="w.againstWeakpoints > 0">
                    <td class="label">{{ t('assembly.calc.weakpointCrit') }}</td>
                    <td class="value text-center text-warning" colspan="2">{{ fmtDps(w.againstWeakpoints) }}</td>
                  </tr>
                  <tr v-if="w.againstSails > 0">
                    <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.againstSails) }}</td>
                  </tr>
                  <tr v-if="w.againstStructures > 0">
                    <td class="label">{{ t('assembly.calc.againstStructuresShort') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.againstStructures) }}</td>
                  </tr>
                  <tr class="separator">
                    <td class="label" colspan="3">{{ t('assembly.calc.firingAttributes') }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.damagePerShotVolley') }}</td>
                    <td class="value text-center">{{ fmtDps(w.totalDamagePerShot) }}</td>
                    <td class="value text-center">{{ fmtDps(w.totalDamagePerVolley) }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.reloadSpeed') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtReload(w.finalReloadSpeed) }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.optimalRange') }}</td>
                    <td class="value text-center" colspan="2">{{ w.optimalRange }}m</td>
                  </tr>
                  <tr v-if="w.rateOfFire > 0">
                    <td class="label">{{ t('assembly.calc.rateOfFire') }}</td>
                    <td class="value text-center" colspan="2">{{ w.rateOfFire }}ms</td>
                  </tr>
                  <tr v-if="w.projectilesPerShot > 1">
                    <td class="label">{{ t('assembly.calc.projectilesPerShot') }}</td>
                    <td class="value text-center" colspan="2">{{ w.projectilesPerShot }}</td>
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
        <v-col cols="12" lg="4">
          <AffixBoxHasTitleView>
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

                      <p class="u text-amber">{{ fmtDps(result.auxiliaryWeaponStats.reduce((s, w) => s + (w.dpsWithPerks || w.totalDPS), 0)) }}</p>
                    </th>
                  </tr>
                  <tr>
                    <th></th>
                    <th class="text-center sub-th">{{ t('assembly.calc.singleGunPort') }}</th>
                    <th class="text-center sub-th">{{ t('assembly.calc.multiGunPorts', { count: w.gunPorts }) }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td class="label">{{ t('assembly.calc.baseDamageDps') }}</td>
                    <td class="value text-center">{{ fmtDps(w.singlePortBaseDPS) }}</td>
                    <td class="value text-center">{{ fmtDps(w.baseDPS) }}</td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label">{{ t('assembly.calc.damageWithPerks') }}</td>
                    <td class="value text-center">{{ fmtDps(w.singlePortDpsWithPerks) }}</td>
                    <td class="value text-center accent">{{ fmtDps(w.dpsWithPerks || w.totalDPS) }}</td>
                  </tr>
                  <tr v-if="w.againstWeakpoints > 0">
                    <td class="label">{{ t('assembly.calc.weakpointCrit') }}</td>
                    <td class="value text-center text-warning" colspan="2">{{ fmtDps(w.againstWeakpoints) }}</td>
                  </tr>
                  <tr v-if="w.againstSails > 0">
                    <td class="label">{{ t('assembly.calc.againstSails') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.againstSails) }}</td>
                  </tr>
                  <tr v-if="w.againstStructures > 0">
                    <td class="label">{{ t('assembly.calc.againstStructuresShort') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtDps(w.againstStructures) }}</td>
                  </tr>
                  <tr class="separator">
                    <td class="label" colspan="3">{{ t('assembly.calc.firingAttributes') }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.damagePerShotVolley') }}</td>
                    <td class="value text-center">{{ fmtDps(w.totalDamagePerShot) }}</td>
                    <td class="value text-center">{{ fmtDps(w.totalDamagePerVolley) }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.reloadSpeed') }}</td>
                    <td class="value text-center" colspan="2">{{ fmtReload(w.finalReloadSpeed) }}</td>
                  </tr>
                  <tr>
                    <td class="label">{{ t('assembly.calc.optimalRange') }}</td>
                    <td class="value text-center" colspan="2">{{ w.optimalRange }}m</td>
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
