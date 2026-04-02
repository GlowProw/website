<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {ref} from "vue";
import {useCalculatorStore} from "~/stores/calculatorStore";
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";

import TargetPanel from "./TargetPanel.vue";
import ExcludeMaterialPanel from "./ExcludeMaterialPanel.vue";
import ResultListView from "./ResultListView.vue";
import ResultSankeyView from "./ResultSankeyView.vue";
import SaveConfigDialog from "./SaveConfigDialog.vue";
import Silk from "@/components/Silk.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {Items, Materials, Ships} from 'glow-prow-data';

const {t} = useI18n()
const store = useCalculatorStore()
const i18nReadName = useI18nReadName()

function getDisplayName(id: string): string {
  try {
    let nameData: any = null
    if (Materials[id]) nameData = i18nReadName.material(id)
    else if (Items[id]) nameData = i18nReadName.item(id)
    else if (Ships[id]) nameData = i18nReadName.ship(id)
    else nameData = i18nReadName.material(id)

    const name = nameData.name()
    if (name && typeof name === 'string' && name !== id) return name
  } catch (e) {
  }
  return id
}

function handleExportCSV() {
  store.exportCSV(
    t('calculator.export.csvHeaders'),
    t('basic.yes'),
    t('basic.no'),
    getDisplayName
  )
}

const configDialog = ref<InstanceType<typeof SaveConfigDialog> | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const importType = ref<'json' | 'csv'>('json')

function openConfigDialog() {
  if (configDialog.value) {
    configDialog.value.dialog = true
  }
}

function triggerImport(type: 'json' | 'csv') {
  importType.value = type
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.accept = type === 'json' ? '.json' : '.csv'
    fileInput.value.click()
  }
}

function onFileImport(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  store.importFile(file, importType.value)
}
</script>

<template>
  <v-app>
    <Header/>
    <v-main>
      <div class="calculator-background">
        <div class="calculator-pattern">
          <v-breadcrumbs>
            <v-container class="pa-0">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider/>
              <v-breadcrumbs-item>{{ t('calculator.title') }}</v-breadcrumbs-item>
            </v-container>
          </v-breadcrumbs>
          <v-divider/>

          <v-card height="200px">
            <template v-slot:image>
              <Silk
                  :speed="3"
                  :scale=".7"
                  :color="'#1c1c1c'"
                  :noise-intensity="0.1"
                  :rotation="-.6"
                  class="bg-black">
              </Silk>
            </template>
            <template v-slot:default>
              <v-container class="pa-2 mt-4 position-relative">
                <p class="mt-2 opacity-60">{{ t('calculator.description') }}</p>

                <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
                  <v-icon icon="mdi-calculator-variant" size="120"></v-icon>
                </div>
              </v-container>
            </template>
          </v-card>
          <v-divider></v-divider>

          <div class="bg-black">
            <v-container class="position-relative">
              <v-row align="center">
                <v-col>
                  <!-- 视图切换 -->
                  <div>
                    <v-card-text class="pa-0">
                      <v-btn-toggle
                          v-model="store.displaySettings.viewMode"
                          mandatory
                          density="compact"
                          color="amber">
                        <v-btn value="list">
                          <v-icon icon="mdi-format-list-bulleted-type" class="mr-1" size="18"/>
                          {{ t('calculator.results.listView') }}
                        </v-btn>
                        <v-btn value="sankey">
                          <v-icon icon="mdi-chart-sankey" class="mr-1" size="18"/>
                          {{ t('calculator.results.sankeyView') }}
                        </v-btn>
                      </v-btn-toggle>
                    </v-card-text>
                  </div>
                </v-col>
                <v-spacer/>
                <v-col cols="auto">
                  <div class="d-flex ga-2">
                    <!-- 导入 -->
                    <v-menu>
                      <template v-slot:activator="{props}">
                        <v-btn variant="tonal" v-bind="props">
                          <v-icon icon="mdi-import" class="mr-1"/>
                          {{ t('calculator.import.title') }}
                        </v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item @click="triggerImport('json')">
                          <template v-slot:prepend>
                            <v-icon icon="mdi-code-json"/>
                          </template>
                          <v-list-item-title>{{ t('calculator.import.json') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="triggerImport('csv')">
                          <template v-slot:prepend>
                            <v-icon icon="mdi-file-delimited"/>
                          </template>
                          <v-list-item-title>{{ t('calculator.import.csv') }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>

                    <!-- 导出 -->
                    <v-menu>
                      <template v-slot:activator="{props}">
                        <v-btn variant="tonal" v-bind="props">
                          <v-icon icon="mdi-export" class="mr-1"/>
                          {{ t('calculator.export.title') }}
                        </v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item @click="store.exportJSON()">
                          <template v-slot:prepend>
                            <v-icon icon="mdi-code-json"/>
                          </template>
                          <v-list-item-title>{{ t('calculator.export.json') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="handleExportCSV()">
                          <template v-slot:prepend>
                            <v-icon icon="mdi-file-delimited"/>
                          </template>
                          <v-list-item-title>{{ t('calculator.export.csv') }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>

                    <v-divider vertical inset opacity=".5"></v-divider>

                    <!-- 配置管理 -->
                    <v-btn variant="tonal" color="amber" @click="openConfigDialog">
                      <v-icon icon="mdi-content-save-cog" class="mr-1"/>
                      {{ t('calculator.config.title') }}
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </div>

          <v-divider></v-divider>

          <v-container>
            <v-row>
              <!-- 左侧：设置面板 -->
              <v-col cols="12" md="5" lg="4">
                <TargetPanel class="mb-4"/>
                <ExcludeMaterialPanel/>
              </v-col>

              <!-- 右侧：结果展示 -->
              <v-col cols="12" md="7" lg="8">
                <!-- 结果视图 S -->
                <ResultListView v-if="store.displaySettings.viewMode === 'list'"/>
                <ResultSankeyView v-else/>
                <!-- 结果视图 E -->
              </v-col>
            </v-row>
          </v-container>
        </div>
      </div>
    </v-main>
    <Footer/>

    <!-- 配置文件上传 -->
    <input type="file" ref="fileInput" @change="onFileImport" style="display: none" />

    <!-- 配置对话框 -->
    <SaveConfigDialog ref="configDialog"/>
  </v-app>
</template>

<style scoped lang="less">
.calculator-background {
  min-height: 100vh;
}

.calculator-pattern {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 80px;
  --color: rgba(255, 255, 255, 0.03);

  background-size: 160px 160px;
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}

.calculator-header {
  background-color: #000;
  position: relative;
  padding-bottom: 20px;

  &:before {
    content: "";
    position: absolute;
    z-index: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    padding: 6% 0 0;
    background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
    background-size: cover;
  }
}
</style>
