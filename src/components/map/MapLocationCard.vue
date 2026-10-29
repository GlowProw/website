<template>
  <v-card
      v-show="modelValue"
      border
      elevation="12"
      :width="mobile ? 'calc(100% - 60px)' : 450"
      :style="{
        'top': mobile ? '140px' : '80px'
      }"
      class="map-card-info overflow-y-auto">
    <template v-slot:title>
      <div class="my-2 mr-2">
        <div class="d-flex align-center">
          <div class="mr-2" v-if="activeRank">
            <ShieldWidget :size="30"
                          :class="{'opacity-30': selectedLocation.category == 'den' || selectedLocation.category == 'outpost'}">
              {{ activeRank }}
            </ShieldWidget>
          </div>
          <div>
            <template v-if="selectedLocation.category == 'shareLocation'">
              <div
                  class="d-flex align-center text-amber singe-line"
                  :title="selectedLocation.name || selectedLocation.id">
                {{ selectedLocation.name || selectedLocation.id }}
              </div>
            </template>
            <template v-else-if="selectedLocation.id || selectedLocation.category">
              <router-link :to="isEnemyLocation ? `/codex/enemy/${selectedLocation.enemyId}` : `/codex/mapLocation/${selectedLocation.id || selectedLocation.category}`">
                <div
                    class="d-flex align-center text-amber singe-line"
                    :title="getLocationTitle">
                  <EnemiesName v-if="isEnemyLocation" :id="selectedLocation.enemyId"></EnemiesName>
                  <MapLocationName v-else :id="selectedLocation.id || selectedLocation.category"></MapLocationName>
                </div>
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </template>
    <template v-slot:append>
      <v-btn variant="tonal" icon @click="closeCard">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
    <template v-slot:image>
      <v-card v-if="selectedLocation.faction" width="100%" height="400" class="overflow-hidden opacity-20">
        <FactionIconWidget :name="selectedLocation.faction.id"
                           size="300"
                           class="img-bottom-fade faction-title-image"></FactionIconWidget>
      </v-card>
    </template>

    <div class="mx-4 pb-3">
      <v-row no-gutters align="center">
        <v-col cols="auto" class="d-flex align-center mr-2">
          <ItemSlotBase :size="'25px'" :padding="0" class="pa-1 rounded-lg">
            <v-img
                :src="getCategoryIcon(selectedLocation.icon || selectedLocation.category)"
                v-if="getCategoryIcon(selectedLocation.icon || selectedLocation.category)"
                width="25"
                height="25"
                cover/>
          </ItemSlotBase>
        </v-col>
        <v-col class="text-caption">
          {{ t(`map.types.${selectedLocation.category || 'none'}.name`) }}
        </v-col>
      </v-row>
      <v-row no-gutters v-if="selectedLocation && selectedLocation.faction" align="center">
        <v-col cols="auto" class="d-flex align-center mr-2">
          <ItemSlotBase :size="'25px'" :padding="0" class="rounded-lg">
            <FactionIconWidget :name="selectedLocation.faction.id"></FactionIconWidget>
          </ItemSlotBase>
        </v-col>
        <v-col class="text-caption">
          <FactionNameWidget :id="selectedLocation.faction.id"></FactionNameWidget>
        </v-col>
      </v-row>
    </div>

    <v-row class="mx-5 mt-8" v-if="selectedLocation.difficulty" align="center">
      <v-col>
        {{ t('map.difficulty') }}
      </v-col>
      <v-col cols="auto" class="text-blue d-flex align-center">
        <v-icon>mdi-account-group</v-icon>
        <div class="font-weight-bold ml-2">
          <ShinyText :text="`${selectedLocation.difficulty.minimumPeople || 1 }+ ${selectedLocation.difficulty.type.toUpperCase()}`"
                     :speed=".8"
                     class-name="text-blue"></ShinyText>
        </div>
      </v-col>
    </v-row>

    <template v-if="hasEnemyDescription || getLocationDescription">
      <v-divider class="my-2 mx-4"></v-divider>

      <div class="mx-5 mb-3 pb-2">
        <EnemiesDescriptions v-if="isEnemyLocation" :id="selectedLocation.enemyId"></EnemiesDescriptions>
        <template v-else>{{ getLocationDescription }}</template>
      </div>
    </template>

    <!-- 世界等级 -->
    <template v-if="worldTierKeys.length">
      <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
        {{ t('map.worldTier') }}
      </v-row>
      <div class="mx-5 mb-5 pt-3">
        <v-row v-for="tier in worldTierKeys" :key="tier" align="center" no-gutters class="mb-1">
          <v-col cols="auto">
            <div>{{ t('map.worldTierValue', {num: tier}) }}</div>
          </v-col>
          <v-col>
            <v-divider class="mx-2"></v-divider>
          </v-col>
          <v-col cols="auto">
            <span class="u">{{ worldTiers[tier] }}</span>
          </v-col>
        </v-row>
      </div>
    </template>

    <template v-if="selectedLocation && ['shareLocation'].includes(selectedLocation.category) && selectedLocation.description">
      <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
        {{ t('map.markerDescription') }}
      </v-row>
      <div class="mx-5 mb-5 pt-3">
        <Textarea min-height="40" :readonly="true" v-model="selectedLocation.description"></Textarea>
      </div>
    </template>

    <template v-if="selectedLocation && ['shareLocation'].includes(selectedLocation.category)">
      <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
        {{ t('map.nearbyMarker') }}
      </v-row>
      <div class="mx-5 mb-5 pt-3">
        <v-row v-for="(i, index) in nearbyPoints" :key="index" align="center" no-gutters class="mb-1">
          <v-col cols="auto">
            <ItemSlotBase size="30px" :padding="2" class="mr-2">
              <v-img :src="getPersonalMarkerIcon()"></v-img>
            </ItemSlotBase>
          </v-col>
          <v-col>
            <div>{{ i.title }}</div>
            <!-- 归属地图集时展示地图集名称与创建者 -->
            <div v-if="i.collectionTitle || i.creatorName"
                 class="text-caption text-medium-emphasis d-flex align-center flex-wrap ga-2 mt-1">
              <span v-if="i.collectionTitle" class="d-flex align-center">
                <v-icon size="13" class="mr-1">mdi-folder-outline</v-icon>{{ i.collectionTitle }}
              </span>
              <span v-if="i.creatorName" class="d-flex align-center">
                <v-icon size="13" class="mr-1">mdi-account-outline</v-icon>{{ i.creatorName }}
              </span>
            </div>
          </v-col>
        </v-row>
      </div>
    </template>

    <template v-if="selectedLocation && ['outpost'].includes(selectedLocation.category)">
      <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
        {{ t('map.treasureMapAvailable') }}
        <v-spacer></v-spacer>
        <v-btn icon density="compact" :to="`/codex/treasureMaps?location=${treasureMapObtainables}`">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </v-row>
      <div class="mb-5 pt-3">
        <MapLocationAvailableTreasureMapWidget ref="mapLocationAvailableTreasureMapWidget" :id="selectedLocation.id"></MapLocationAvailableTreasureMapWidget>
      </div>
    </template>

    <template v-if="selectedLocation && ['outpost','den'].includes(selectedLocation.category)">
      <v-row class="map-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
        {{ t('map.npcAvailable') }}
        <v-spacer></v-spacer>
        <v-btn icon density="compact" to="/codex/npcs">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </v-row>
      <div class="mb-5 pt-3">
        <MapLocationAvailableNpcWidget :id="selectedLocation.id" :category="selectedLocation.category"></MapLocationAvailableNpcWidget>
      </div>
    </template>

    <template v-if="hasPossibleLoot">
      <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
        {{ t('map.possibleLoot') }}
      </div>
      <div class="mx-5 mb-5 pt-3 opacity-60">
        <MapPossibleLoot :possible-loot="selectedLocation.possibleLoot"></MapPossibleLoot>
      </div>
    </template>

    <div class="map-title px-10 mx-n6 py-2 text-amber-lighten-4">
      {{ t('empireSkillSimulation.other') }}
    </div>
    <div class="mx-5 mb-5 opacity-80"
         v-if="selectedLocation && selectedLocation.id">
      <v-text-field :value="selectedLocation.id" hide-details readonly variant="underlined" density="compact">
        <template v-slot:append-inner>
          <v-icon>mdi-identifier</v-icon>
        </template>
      </v-text-field>
      <v-text-field :value="selectedLocation.longitude" hide-details readonly variant="underlined"
                    density="compact">
        <template v-slot:append-inner>
          <v-icon size="15">mdi-longitude</v-icon>
        </template>
      </v-text-field>
      <v-text-field :value="selectedLocation.latitude" hide-details readonly variant="underlined"
                    density="compact">
        <template v-slot:append-inner>
          <v-icon size="15">mdi-latitude</v-icon>
        </template>
      </v-text-field>

      <v-row no-gutters class="mt-2" align="center" v-if="selectedLocation.dateAdded">
        <v-col cols="auto" class="mr-2">
          <v-icon icon="mdi-calendar-range" size="19"></v-icon>
          {{ t('empireSkillSimulation.dateAdded') }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="text-right">
          <TimeView :time="selectedLocation.dateAdded" v-if="selectedLocation.dateAdded">
          </TimeView>
        </v-col>
      </v-row>
      <v-row no-gutters class="mt-2" align="center" v-if="selectedLocation.lastUpdated">
        <v-col cols="auto" class="mr-2">
          <v-icon icon="mdi-calendar-range" size="19"></v-icon>
          {{ t('empireSkillSimulation.lastUpdated') }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="text-right">
          <TimeView :time="selectedLocation.lastUpdated" v-if="selectedLocation.lastUpdated">
          </TimeView>
        </v-col>
      </v-row>
    </div>

    <!-- DEBUG 模式标记操作区 -->
    <template v-if="isDebug">
      <div class="map-title px-10 mx-n6 py-2 text-amber d-flex align-center justify-space-between">
        <span class="d-flex align-center">
          <v-icon size="16" class="mr-1">mdi-bug</v-icon>
          DEBUG 标记操作
        </span>
        <v-chip size="x-small" color="amber" variant="flat" class="font-weight-bold">DEBUG</v-chip>
      </div>
      <div class="mx-5 mb-8 mt-3">
        <v-row density="compact">
          <v-col cols="6">
            <v-btn
                block
                size="small"
                variant="tonal"
                color="amber"
                prepend-icon="mdi-pencil"
                @click="emit('edit-marker', selectedLocation)">
              {{ t('map.contextMenu.editMarker') }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
                block
                size="small"
                variant="tonal"
                color="info"
                prepend-icon="mdi-content-copy"
                @click="emit('clone-marker', selectedLocation)">
              {{ t('map.contextMenu.cloneMarker') }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
                block
                size="small"
                variant="tonal"
                prepend-icon="mdi-code-json"
                @click="emit('copy-marker-json', selectedLocation)">
              {{ t('map.contextMenu.copyMarkerJson') || '复制 JSON' }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
                block
                size="small"
                variant="tonal"
                prepend-icon="mdi-crosshairs-gps"
                @click="emit('copy-marker-coords', selectedLocation)">
              {{ t('map.contextMenu.copyMarkerCoordinates') || '复制坐标' }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import { Enemies } from 'glow-prow-data';
import ShieldWidget from "@/components/snbWidget/shieldWidget.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import EnemiesName from "@/components/snbWidget/enemiesName.vue";
import EnemiesDescriptions from "@/components/snbWidget/enemiesDescriptions.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionNameWidget from "@/components/snbWidget/factionNameWidget.vue";
import ShinyText from "@/components/ShinyText.vue";
import Textarea from "@/components/textarea/index.vue";
import MapLocationAvailableTreasureMapWidget from "@/components/snbWidget/mapLocationAvailableTreasureMapWidget.vue";
import MapLocationAvailableNpcWidget from "@/components/snbWidget/mapLocationAvailableNpcWidget.vue";
import MapPossibleLoot from "@/components/snbWidget/mapPossibleLoot.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import { useI18nReadName } from "@/assets/sripts/i18n_read_name";

const props = withDefaults(defineProps<{
  modelValue: boolean;
  selectedLocation: any;
  getCategoryIcon: (category: string) => string;
  getPersonalMarkerIcon: () => string;
  nearbyPoints: any[];
  isDebug?: boolean;
}>(), {
  isDebug: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'edit-marker', location: any): void;
  (e: 'clone-marker', location: any): void;
  (e: 'copy-marker-json', location: any): void;
  (e: 'copy-marker-coords', location: any): void;
}>();

const { t, te } = useI18n();
const { mobile } = useDisplay();
const { enemy } = useI18nReadName();

const codexCategories = ['den', 'outpost', 'capitalSettlement', 'settlement', 'foundry', 'lumberyard', 'weaver', 'militaryBase', 'megafort'];

const isCodexLocation = computed(() => {
  if (!props.selectedLocation) return false;
  return codexCategories.includes(props.selectedLocation.category);
});

/**
 * 敌人坐标：名称与描述统一走 enemiesName / enemiesDescriptions 组件的数据来源
 */
const isEnemyLocation = computed(() => !!props.selectedLocation?.enemyId);

const hasEnemyDescription = computed(() => {
  if (!isEnemyLocation.value) return false
  const enemyId = props.selectedLocation.enemyId
  if (((Enemies as any)[enemyId]?.routes || []).length) return true
  return !!enemy(enemyId).description()
});

/**
 * 世界等级：key 为世界编号，value 为该世界下的敌人等级
 */
const worldTiers = computed<Record<string, number>>(() => props.selectedLocation?.worldTiers || {});
const worldTierKeys = computed(() => Object.keys(worldTiers.value).sort((a, b) => Number(a) - Number(b)));

/**
 * 卡片头部盾牌显示最高世界下的等级，没有世界等级时回退到基础等级
 */
const activeRank = computed(() => {
  const topTier = worldTierKeys.value[worldTierKeys.value.length - 1];
  const tierRank = topTier ? worldTiers.value[topTier] : undefined;
  return tierRank || props.selectedLocation?.baseRank;
});

const getLocationTitle = computed(() => {
  const loc = props.selectedLocation;
  if (!loc) return '';
  if (loc.enemyId) {
    return enemy(loc.enemyId).name();
  }
  if (loc.id && te(`snb.locations.${loc.id}`)) {
    return t(`snb.locations.${loc.id}`);
  }
  if (loc.id && te(`snb.mapLocations.${loc.id}.name`)) {
    return t(`snb.mapLocations.${loc.id}.name`);
  }
  if (loc.category && te(`map.types.${loc.category}.name`)) {
    return t(`map.types.${loc.category}.name`);
  }
  if (loc.id && te(`map.types.${loc.id}.name`)) {
    return t(`map.types.${loc.id}.name`);
  }
  return loc.name || loc.id || '';
});

const getLocationDescription = computed(() => {
  const loc = props.selectedLocation;
  if (!loc) return '';
  if (loc.category && te(`map.types.${loc.category}.description`)) {
    return t(`map.types.${loc.category}.description`);
  }
  if (loc.id && te(`map.types.${loc.id}.description`)) {
    return t(`map.types.${loc.id}.description`);
  }
  if (loc.id && te(`snb.mapLocations.${loc.id}.description`)) {
    return t(`snb.mapLocations.${loc.id}.description`);
  }
  return '';
});

const closeCard = () => {
  emit('update:modelValue', false);
};

const mapLocationAvailableTreasureMapWidget = ref(null);

const treasureMapObtainables = computed(() => {
  if (!props.selectedLocation.id || !mapLocationAvailableTreasureMapWidget.value)
    return [].join(',');

  return (mapLocationAvailableTreasureMapWidget.value as any)?.getObtainables().map(i => i.id).join(',') || [];
});

const hasPossibleLoot = computed(() => {
  const loot = props.selectedLocation?.possibleLoot;
  if (!loot) return false;
  if (Array.isArray(loot)) return loot.length > 0;
  if (typeof loot === 'object') return Object.keys(loot).length > 0;
  return false;
});

defineOptions({ name: 'LocationCard' });
</script>

<style scoped lang="less">
.map-card-info {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  position: absolute;
  z-index: 10;
  right: 30px;
  max-height: 80vh;

  .map-title {
    marker: none;
    background-color: hsl(from #000 h s l / .3);
  }

  .faction-title-image {
    transform: rotate3d(1, -1, 1, 55deg) translate(50px, -190px);
    filter: blur(10px);
    mask-image: linear-gradient(to top, #00000000 0%, black 80%);
  }
}
</style>
