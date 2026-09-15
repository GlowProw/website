<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import languagesConfig from "@/config/languages";

const props = withDefaults(defineProps<{
  type?: 'assembly' | 'mastery' | 'both';
  hasMastery?: boolean;
  assemblyModelValue?: any;
  masteryModelValue?: any;
  generateImageConfig?: any;
}>(), {
  type: 'assembly',
  hasMastery: false,
  assemblyModelValue: () => ({}),
  masteryModelValue: () => ({}),
  generateImageConfig: () => ({
    widths: [1050, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2048],
    formats: ['png', 'jpg', 'webp'],
    qualitys: [.6, .8, .9, 1],
    backgrounds: ['#1a1a1a', '#000', '#0a0d12', '#121924', 'rgb(35,26,0)'],
    languages: languagesConfig.child
  })
});

const emit = defineEmits<{
  'update:assemblyModelValue': [val: any];
  'update:masteryModelValue': [val: any];
}>();

const {t} = useI18n();
const {mobile} = useDisplay();

const activeTab = ref<'assembly' | 'mastery'>('assembly');

const isBothMode = computed(() => props.type === 'both' && props.hasMastery);
const showMasteryOnly = computed(() => props.type === 'mastery');
const showAssemblyOnly = computed(() => props.type === 'assembly' || (props.type === 'both' && !props.hasMastery));
</script>

<template>
  <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
    <v-card-title class="py-8 text-center bg-black mb-4 mx-n5 mt-n5 position-relative">
      <v-icon size="60">mdi-cog</v-icon>
      <div class="text-subtitle-1 font-weight-bold mt-2">
        {{ t('assembly.share.configHint') }}
      </div>
    </v-card-title>

    <!-- 标签切换（在同时包含配装和精通海报时显示） -->
    <v-tabs
        v-if="isBothMode"
        v-model="activeTab"
        color="amber"
        grow
        density="comfortable"
        class="mb-4">
      <v-tab value="assembly">
        <v-icon start icon="mdi-ship-wheel"></v-icon>
        {{ t('assembly.share.title') }} (1/2)
      </v-tab>
      <v-tab value="mastery">
        <v-icon start icon="mdi-creation"></v-icon>
        {{ t('mastery.share.title') }} (2/2)
      </v-tab>
    </v-tabs>

    <v-window :model-value="showMasteryOnly ? 'mastery' : (showAssemblyOnly ? 'assembly' : activeTab)">
      <!-- 配装海报设置页 S -->
      <v-window-item value="assembly" v-if="!showMasteryOnly">
        <v-row>
          <v-col cols="12">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.filename') }}</div>
            <v-text-field
                v-model="assemblyModelValue.filename"
                density="comfortable"
                variant="filled"
                hide-details></v-text-field>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.width') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="assemblyModelValue.width"
                :items="generateImageConfig.widths"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.format') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="assemblyModelValue.format"
                :items="generateImageConfig.formats"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.quality') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="assemblyModelValue.quality"
                :items="generateImageConfig.qualitys"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.language') }}</div>
            <v-select
                variant="filled"
                item-value="value"
                item-title="label"
                density="comfortable"
                v-model="assemblyModelValue.language"
                :items="generateImageConfig.languages"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="12">
            <v-divider>{{ t('assembly.share.imageStyleTitle') }}</v-divider>
          </v-col>

          <v-col cols="12">
            <div class="mb-2 text-caption opacity-80">{{ t('assembly.share.backgroundColor') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="assemblyModelValue.background"
                :items="generateImageConfig.backgrounds"
                hide-details>
              <template v-slot:append>
                <v-card border variant="text">
                  <ItemSlotBase size="40px" :padding="0" :style="`background: ${assemblyModelValue.background}`"></ItemSlotBase>
                </v-card>
              </template>
              <template v-slot:item="{props: itemProps, item}">
                <v-list-item v-bind="itemProps">
                  <template v-slot:append>
                    <ItemSlotBase size="30px" :padding="0" :style="`background: ${item.raw}`"></ItemSlotBase>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowEmptySlot" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showEmptySlot') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowItemName" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showItemName') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isFullName" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.fullName') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowTitle" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showTitle') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowHeader" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showHeader') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowTabs" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showTabs') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="assemblyModelValue.isShowDescription" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('assembly.share.showDescription') }}</span>
                  </template>
                </v-switch>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>
      <!-- 配装海报设置页 E -->

      <!-- 精通海报设置页 S -->
      <v-window-item value="mastery" v-if="!showAssemblyOnly">
        <v-row>
          <v-col cols="12">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.filename') }}</div>
            <v-text-field
                v-model="masteryModelValue.filename"
                density="comfortable"
                variant="filled"
                hide-details></v-text-field>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.width') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="masteryModelValue.width"
                :items="generateImageConfig.widths"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.format') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="masteryModelValue.format"
                :items="generateImageConfig.formats"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.quality') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="masteryModelValue.quality"
                :items="generateImageConfig.qualitys"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="6">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.language') }}</div>
            <v-select
                variant="filled"
                item-value="value"
                item-title="label"
                density="comfortable"
                v-model="masteryModelValue.language"
                :items="generateImageConfig.languages"
                hide-details>
            </v-select>
          </v-col>

          <v-col cols="12">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.treeTitle') }} ({{ t('mastery.share.imageStyleTitle') }})</div>
            <v-btn-toggle
                v-model="masteryModelValue.viewMode"
                mandatory
                density="compact"
                color="amber"
                class="w-100">
              <v-btn value="full" class="flex-grow-1">
                {{ t('mastery.share.viewFullTree') }}
              </v-btn>
              <v-btn value="active" class="flex-grow-1">
                {{ t('mastery.share.viewActivePath') }}
              </v-btn>
            </v-btn-toggle>
          </v-col>

          <v-col cols="12">
            <v-divider>{{ t('mastery.share.imageStyleTitle') }}</v-divider>
          </v-col>

          <v-col cols="12">
            <div class="mb-2 text-caption opacity-80">{{ t('mastery.share.backgroundColor') }}</div>
            <v-select
                variant="filled"
                density="comfortable"
                v-model="masteryModelValue.background"
                :items="generateImageConfig.backgrounds"
                hide-details>
              <template v-slot:append>
                <v-card border variant="text">
                  <ItemSlotBase size="40px" :padding="0" :style="`background: ${masteryModelValue.background}`"></ItemSlotBase>
                </v-card>
              </template>
              <template v-slot:item="{props: itemProps, item}">
                <v-list-item v-bind="itemProps">
                  <template v-slot:append>
                    <ItemSlotBase size="30px" :padding="0" :style="`background: ${item.raw}`"></ItemSlotBase>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12">
            <v-row>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowHeader" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showHeader') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowTitle" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showTitle') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowTree" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showTree') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowSeasonal" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showSeasonal') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowEffects" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showEffects') }}</span>
                  </template>
                </v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch v-model="masteryModelValue.isShowQrCode" inset hide-details density="compact">
                  <template v-slot:append>
                    <span class="text-caption">{{ t('mastery.share.showQrCode') }}</span>
                  </template>
                </v-switch>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>
      <!-- 精通海报设置页 E -->
    </v-window>
  </v-card>
</template>
