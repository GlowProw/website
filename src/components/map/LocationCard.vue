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
        <div class="d-flex">
          <div class="mr-2">
            <ShieldWidget :size="30"
                          :class="{'opacity-30': selectedLocation.category == 'den' || selectedLocation.category == 'outpost'}">
              {{ selectedLocation.baseRank || 0 }}
            </ShieldWidget>
          </div>
          <div>
            <template v-if="selectedLocation.category != 'shareLocation'">
              <router-link :to="`/codex/mapLocation/${selectedLocation.id}`">
                <div
                    class="d-flex align-center text-amber singe-line"
                    :title="t(`snb.locations.${selectedLocation.id}`)">
                  <MapLocationName :id="selectedLocation.id" v-if="selectedLocation.id"></MapLocationName>
                </div>
              </router-link>
            </template>
            <template v-else-if="selectedLocation.category == 'shareLocation'">
              <div
                  class="d-flex align-center text-amber singe-line"
                  :title="selectedLocation.name || selectedLocation.id">
                {{ selectedLocation.name || selectedLocation.id }}
              </div>
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

    <div class="mx-5 pb-3">
      <v-row no-gutters align="center">
        <v-col cols="auto" class="d-flex align-center mr-2">
          <v-img
              :src="getCategoryIcon(selectedLocation.category)"
              v-if="getCategoryIcon(selectedLocation.category)"
              width="25"
              height="25"
              cover/>
        </v-col>
        <v-col class="text-caption">
          {{ t(`map.types.${selectedLocation.category || 'none'}.name`) }}
        </v-col>
      </v-row>
      <v-row no-gutters class="mt-1" v-if="selectedLocation && selectedLocation.faction" align="center">
        <v-col cols="auto" class="d-flex align-center mr-2">
          <ItemSlotBase :size="'25px'" :padding="0">
            <FactionIconWidget :name="selectedLocation.faction.id"></FactionIconWidget>
          </ItemSlotBase>
        </v-col>
        <v-col class="text-caption">
          <FactionNameWidget :id="selectedLocation.faction.id"></FactionNameWidget>
        </v-col>
      </v-row>
    </div>

    <v-row class="mx-2 mt-8" v-if="selectedLocation.difficulty" align="center">
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

    <template v-if="t(`map.types.${selectedLocation.category}.description`)">
      <v-divider class="my-2 mx-4"></v-divider>

      <div class="mx-5 mb-3 pb-2">
        {{ t(`map.types.${selectedLocation.category}.description`) }}
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
            {{ i.title }}
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

    <template v-if="selectedLocation.possibleLoot">
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
    <div class="mx-5 mb-10 opacity-60"
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
            <Time :time="selectedLocation.dateAdded"></Time>
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
            <Time :time="selectedLocation.lastUpdated"></Time>
          </TimeView>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import ShieldWidget from "@/components/snbWidget/shieldWidget.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
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

const props = defineProps<{
  modelValue: boolean;
  selectedLocation: any;
  getCategoryIcon: (category: string) => string;
  getPersonalMarkerIcon: () => string;
  nearbyPoints: any[];
}>();

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const { mobile } = useDisplay();

const closeCard = () => {
  emit('update:modelValue', false);
};

const mapLocationAvailableTreasureMapWidget = ref(null);

const treasureMapObtainables = computed(() => {
  if (!props.selectedLocation.id || !mapLocationAvailableTreasureMapWidget.value)
    return [].join(',');
  return (mapLocationAvailableTreasureMapWidget.value as any)?.getObtainables().join(',') || [];
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
