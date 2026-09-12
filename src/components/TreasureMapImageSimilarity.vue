<template>
  <!-- 对话框触发入口（仅非页面模式时渲染） -->
  <span v-if="!pageMode" @click="openDialog">
    <slot></slot>
  </span>

  <!-- 对话框模式 -->
  <v-dialog
      v-if="!pageMode"
      v-model="model"
      @close="onResetSearch"
      :fullscreen="mobile">
    <v-card border>
      <template v-if="showCropper">
        <v-card-title class="d-flex align-center py-4 px-6 border-bottom">
          <div class="text-h6 text-amber">
            <v-icon>mdi-image-search-outline</v-icon>
          </div>
          <v-spacer/>
          <v-btn variant="tonal" icon @click="cancelCrop">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <div style="height: 65vh" class="bg-black d-flex align-center justify-center overflow-hidden">
          <img ref="cropperImageRef"
               :src="croppingImageUrl"
               style="max-width: 100%; max-height: 100%;display: block"/>
        </div>
      </template>

      <v-row no-gutters v-else>
        <v-col cols="2" v-if="!mobile">
          <div class="d-flex bg-black mb-4 h-100 align-center justify-center">
            <v-icon size="80">mdi-image-search-outline</v-icon>
          </div>
        </v-col>
        <v-col>
          <v-card tile variant="text">
            <template v-slot:title>
              <div class="text-h5 text-amber">{{ t('codex.treasureMaps.comparison.title') }}</div>
            </template>
            <template v-slot:append>
              <v-btn variant="tonal" icon @click="closeDialog">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>

            <div class="px-5">
              <!-- 筛选与算法选择 -->
              <v-row class="mb-2" align="center">
                <v-col cols="auto" v-if="queryImageData">
                  <v-tooltip width="38%" height="38%" min-width="400" content-class="pa-0" location="bottom">
                    <template v-slot:activator="{props}">
                      <v-card border v-bind="props">
                        <v-img
                            :src="queryImageData.url"
                            width="50"
                            height="50"
                            class="mx-auto"
                            aspect-ratio="1"
                        ></v-img>
                      </v-card>
                    </template>
                    <v-card border class="bg-black">
                      <v-img
                          :src="queryImageData.url"
                          class="mx-2"
                          aspect-ratio="1"
                      ></v-img>
                    </v-card>
                  </v-tooltip>
                </v-col>
                <v-col cols="6">
                  <v-select
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      @update:model-value="onSearchSimilarImages"
                      :label="t('codex.treasureMaps.comparison.selectAlgorithm')"
                      :disabled="searching"
                      :items="algorithms"
                      v-model="selectedAlgorithm">
                    <template v-slot:selection>
                      {{ t(`codex.treasureMaps.comparison.algorithms.${selectedAlgorithm}`) }}
                    </template>
                    <template v-slot:item="{props, item}">
                      <v-list-item v-bind="props">
                        <template v-slot:title>
                          {{ t(`codex.treasureMaps.comparison.algorithms.${item.raw.value}`) }}
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="auto">
                  <v-menu open-on-click :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props">
                        <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                        <v-icon>mdi-dots-vertical</v-icon>
                      </div>
                    </template>

                    <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
                      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                        <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                      </v-card-title>

                      <v-row>
                        <v-col cols="12">
                          <v-select
                              v-model="selectedObtainables"
                              :items="obtainableOptions"
                              :label="t('codex.treasureMaps.comparison.filter.source')"
                              multiple
                              clearable
                              variant="outlined">
                            <template v-slot:selection="{item}">
                              {{ t(`snb.mapLocations.${item.value}.name`) }}
                            </template>
                            <template v-slot:item="{props, item}">
                              <v-list-item v-bind="props">
                                <template v-slot:title>
                                  {{ t(`snb.mapLocations.${item.raw.value}.name`) }}
                                </template>
                              </v-list-item>
                            </template>
                          </v-select>
                        </v-col>
                        <v-col cols="12">
                          <v-select
                              v-model="selectedCategories"
                              :items="categoryOptions"
                              :label="t('codex.treasureMaps.comparison.filter.category')"
                              multiple
                              clearable
                              variant="outlined"></v-select>
                        </v-col>
                        <v-col cols="12">
                          <v-number-input v-model="searchMinimumCondition"
                                          :max="100"
                                          :min="0"
                                          :label="t('codex.treasureMaps.comparison.filter.similarityPercent')"
                                          variant="outlined">
                            <template v-slot:append-inner>
                              <span class="mr-4">%</span>
                            </template>
                            <template v-slot:details>
                              {{ t('codex.treasureMaps.comparison.filter.similarityHint') }}
                            </template>
                          </v-number-input>
                        </v-col>
                        <v-col cols="12">
                          <v-number-input v-model="searchRangeMax"
                                          :label="t('codex.treasureMaps.comparison.filter.searchRange')"
                                          :min="30"
                                          clearable
                                          variant="outlined">
                            <template v-slot:details>
                              {{ t('codex.treasureMaps.comparison.filter.rangeHint', {range: searchRangeMax}) }}
                            </template>
                          </v-number-input>
                        </v-col>
                        <v-col cols="12" class="pt-0">
                          <v-checkbox
                              v-model="useGrayscale"
                              color="amber"
                              density="compact"
                              hide-details="auto">
                            <template v-slot:label>
                              <div>
                                <div class="text-body-2">{{ t('codex.treasureMaps.comparison.filter.grayscale') }}</div>
                                <div class="text-caption text-grey">{{ t('codex.treasureMaps.comparison.filter.grayscaleHint') }}</div>
                              </div>
                            </template>
                          </v-checkbox>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <!-- TF.js 模型状态提示 -->
              <v-expand-transition>
                <div v-if="selectedAlgorithm === 'tensorflow-mobilenet'" class="mb-4">
                  <v-card border class="pa-3">
                    <div class="d-flex align-center ga-3">
                      <div class="flex-grow-1">
                        <div class="text-caption text-grey">{{ t('codex.treasureMaps.comparison.tfjs.hint') }}</div>
                      </div>
                      <v-chip v-if="tfModelLoading" color="amber" size="small" variant="tonal">
                        <v-progress-circular size="12" width="2" indeterminate class="mr-1"/>
                        {{ t('codex.treasureMaps.comparison.tfjs.loading') }}
                      </v-chip>
                      <v-chip v-else-if="tfModelLoaded" color="green" size="small" variant="tonal">
                        <v-icon start size="12">mdi-check-circle</v-icon>
                        {{ t('codex.treasureMaps.comparison.tfjs.ready') }}
                      </v-chip>
                      <v-chip v-else-if="tfModelError" color="error" size="small" variant="tonal">
                        <v-icon start size="12">mdi-alert-circle</v-icon>
                        {{ t('codex.treasureMaps.comparison.tfjs.error') }}
                      </v-chip>
                    </div>
                  </v-card>
                </div>
              </v-expand-transition>

              <!-- 搜索进度显示 -->
              <div v-if="searching" class="mb-4">
                <v-card border class="pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-body-1 font-weight-medium">
                      {{ t('codex.treasureMaps.comparison.searchingProgress') }}
                    </div>
                    <div class="text-amber">
                      {{ currentProgress }} / {{ totalImages }}
                      ({{ progressPercentage }}%)
                    </div>
                  </div>
                  <v-progress-linear
                      v-model="progressPercentage"
                      color="amber"
                      height="8"
                      rounded
                  ></v-progress-linear>

                  <v-row v-if="currentComparingImage" class="mt-4">
                    <v-col cols="auto" class="text-caption text-grey mb-1">
                      {{ t('codex.treasureMaps.comparison.currentComparing') }}
                    </v-col>
                    <v-col class="d-flex align-center gap-2">
                      <div>
                        <div class="text-body-2">{{ currentComparingImage.id }}</div>
                      </div>
                    </v-col>
                  </v-row>
                </v-card>
              </div>

              <!-- 初始选择图片提示 -->
              <template v-if="searchResults.length <= 0 && !searching && !queryImageData">
                <v-card class="pa-10 d-flex justify-center align-center" :height="`calc(100vh - ${mobile ? 480 : 400}px)`" elevation="0" border>
                  <div class="text-center">
                    <v-btn type="button" class="mt-7" size="x-large" variant="tonal" @click.stop.prevent="triggerFileInput">
                      <v-icon>mdi-image-plus</v-icon>
                      {{ t('codex.treasureMaps.comparison.selectImage') }}
                    </v-btn>
                  </div>
                </v-card>

                <v-alert type="info" variant="tonal" density="compact" class="my-3">
                  <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
                  <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
                  <p>{{ t('codex.treasureMaps.comparison.noResult.useFilter') }}</p>
                </v-alert>
              </template>

              <!-- 搜索结果 -->
              <v-card variant="text" min-height="300" v-if="searchResults.length > 0">
                <v-row>
                  <v-col cols="auto" class="overflow-y-auto w-100 mb-3">
                    <div class="results-grid">
                      <v-card border min-height="235" v-for="(result, index) in searchResults" :key="index">
                        <v-card-text class="text-center px-2 bg-black">
                          <div>
                            <ItemSlotBase class="position-relative mx-auto">
                              <TreasureMapIconWidget :id="result.id "></TreasureMapIconWidget>
                            </ItemSlotBase>
                          </div>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-row no-gutters align="center" class="py-2 px-4">
                          <v-col>
                            <div class="text-amber singe-line"><u class="u">{{ result.similarity.toFixed(1) }}%</u></div>
                          </v-col>
                          <v-col cols="auto">
                            <div class="singe-line"><span class="opacity-60 mr-1">{{ result.index }}</span>#</div>
                          </v-col>
                        </v-row>
                        <div class="px-4 mb-2">
                          <ByObtainableWidget :data="result.original" byType="treasureMap"></ByObtainableWidget>
                        </div>
                      </v-card>
                    </div>
                  </v-col>
                </v-row>
              </v-card>

              <!-- 无结果提示 -->
              <v-card variant="text" border class="overflow-y-auto text-center py-10 mb-3" v-if="searched && searchResults.length <= 0">
                <v-icon size="48" color="grey" class="mb-2">mdi-image-off</v-icon>
                <div class="text-caption">
                  <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
                  <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
                </div>
              </v-card>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider></v-divider>
      <v-card-actions class="d-flex align-center ga-2">
        <v-spacer></v-spacer>
        <template v-if="!showCropper">
          <v-btn v-if="!searching" type="button" variant="text" @click.stop.prevent="onResetSearch"
                 :disabled="!queryImageData && searchResults.length === 0">
            {{ t('basic.button.reset') }}
          </v-btn>
          <v-btn v-if="searching" type="button" variant="text" color="error" @click.stop.prevent="onAbortSearch">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn type="button" color="var(--main-color)" @click.stop.prevent="onSearchSimilarImages"
                 :disabled="!queryImageData" :loading="searching">
            {{ t('basic.button.search') }}
          </v-btn>
        </template>
        <template v-if="showCropper">
          <v-btn variant="text" @click="cancelCrop">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="var(--main-color)" @click="confirmCrop">{{ t('basic.button.submit') }}</v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 页面模式：直接平铺渲染卡片 -->
  <div v-else class="w-100">
    <template v-if="showCropper">
      <v-card-title class="d-flex align-center py-4 px-6 border-bottom">
        <div class="text-h6 text-amber">
          <v-icon>mdi-crop</v-icon>
        </div>
        <v-spacer/>
        <v-btn variant="tonal" icon @click="cancelCrop">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <div style="height: 65vh" class="bg-black d-flex align-center justify-center overflow-hidden">
        <img ref="cropperImageRef"
             :src="croppingImageUrl"
             style="max-width: 100%; max-height: 100%;display: block"/>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="d-flex align-center ga-2 pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="cancelCrop">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="var(--main-color)" @click="confirmCrop">{{ t('basic.button.submit') }}</v-btn>
      </v-card-actions>
    </template>

    <template v-else>
      <div class="">
        <!-- 筛选与算法选择 -->
        <v-row class="mb-2" align="center">
          <v-col cols="auto" v-if="queryImageData">
            <v-tooltip width="38%" height="38%" min-width="400" content-class="pa-0" location="bottom">
              <template v-slot:activator="{props}">
                <v-card border v-bind="props">
                  <v-img
                      :src="queryImageData.url"
                      width="50"
                      height="50"
                      class="mx-auto"
                      aspect-ratio="1"
                  ></v-img>
                </v-card>
              </template>
              <v-card border class="bg-black">
                <v-img
                    :src="queryImageData.url"
                    class="mx-2"
                    aspect-ratio="1"
                ></v-img>
              </v-card>
            </v-tooltip>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="onSearchSimilarImages"
                :label="t('codex.treasureMaps.comparison.selectAlgorithm')"
                :disabled="searching"
                :items="algorithms"
                v-model="selectedAlgorithm">
              <template v-slot:selection>
                {{ t(`codex.treasureMaps.comparison.algorithms.${selectedAlgorithm}`) }}
              </template>
              <template v-slot:item="{props, item}">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ t(`codex.treasureMaps.comparison.algorithms.${item.raw.value}`) }}
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn :icon="hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline'" variant="tonal" v-bind="props" :color="hasActiveFilters ? 'amber' : undefined">
                </v-btn>
              </template>

              <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
                <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                  <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                </v-card-title>

                <v-row>
                  <v-col cols="12">
                    <v-select
                        v-model="selectedObtainables"
                        :items="obtainableOptions"
                        :label="t('codex.treasureMaps.comparison.filter.source')"
                        multiple
                        clearable
                        variant="outlined">
                      <template v-slot:selection="{item}">
                        {{ t(`snb.mapLocations.${item.value}.name`) }}
                      </template>
                      <template v-slot:item="{props, item}">
                        <v-list-item v-bind="props">
                          <template v-slot:title>
                            {{ t(`snb.mapLocations.${item.raw.value}.name`) }}
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                        v-model="selectedCategories"
                        :items="categoryOptions"
                        :label="t('codex.treasureMaps.comparison.filter.category')"
                        multiple
                        clearable
                        variant="outlined"></v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-number-input v-model="searchMinimumCondition"
                                    :max="100"
                                    :min="0"
                                    :label="t('codex.treasureMaps.comparison.filter.similarityPercent')"
                                    variant="outlined">
                      <template v-slot:append-inner>
                        <span class="mr-4">%</span>
                      </template>
                      <template v-slot:details>
                        {{ t('codex.treasureMaps.comparison.filter.similarityHint') }}
                      </template>
                    </v-number-input>
                  </v-col>
                  <v-col cols="12">
                    <v-number-input v-model="searchRangeMax"
                                    :label="t('codex.treasureMaps.comparison.filter.searchRange')"
                                    :min="30"
                                    clearable
                                    variant="outlined">
                      <template v-slot:details>
                        {{ t('codex.treasureMaps.comparison.filter.rangeHint', {range: searchRangeMax}) }}
                      </template>
                    </v-number-input>
                  </v-col>
                  <v-col cols="12" class="pt-0">
                    <v-checkbox
                        v-model="useGrayscale"
                        color="amber"
                        density="compact"
                        hide-details="auto">
                      <template v-slot:label>
                        <div>
                          <div class="text-body-2">{{ t('codex.treasureMaps.comparison.filter.grayscale') }}</div>
                          <div class="text-caption text-grey">{{ t('codex.treasureMaps.comparison.filter.grayscaleHint') }}</div>
                        </div>
                      </template>
                    </v-checkbox>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </v-col>
        </v-row>

        <!-- TF.js 模型状态提示 -->
        <v-expand-transition>
          <div v-if="selectedAlgorithm === 'tensorflow-mobilenet'" class="mb-4">
            <v-card border class="pa-3">
              <div class="d-flex align-center ga-3">
                <div class="flex-grow-1">
                  <div class="text-caption text-grey">{{ t('codex.treasureMaps.comparison.tfjs.hint') }}</div>
                </div>
                <v-chip v-if="tfModelLoading" color="amber" size="small" variant="tonal">
                  <v-progress-circular size="12" width="2" indeterminate class="mr-1"/>
                  {{ t('codex.treasureMaps.comparison.tfjs.loading') }}
                </v-chip>
                <v-chip v-else-if="tfModelLoaded" color="green" size="small" variant="tonal">
                  <v-icon start size="12">mdi-check-circle</v-icon>
                  {{ t('codex.treasureMaps.comparison.tfjs.ready') }}
                </v-chip>
                <v-chip v-else-if="tfModelError" color="error" size="small" variant="tonal">
                  <v-icon start size="12">mdi-alert-circle</v-icon>
                  {{ t('codex.treasureMaps.comparison.tfjs.error') }}
                </v-chip>
              </div>
            </v-card>
          </div>
        </v-expand-transition>

        <!-- 搜索进度显示 -->
        <div v-if="searching" class="mb-4">
          <v-card border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-1 font-weight-medium">
                {{ t('codex.treasureMaps.comparison.searchingProgress') }}
              </div>
              <div class="text-amber">
                {{ currentProgress }} / {{ totalImages }}
                ({{ progressPercentage }}%)
              </div>
            </div>
            <v-progress-linear
                v-model="progressPercentage"
                color="amber"
                height="8"
                rounded
            ></v-progress-linear>

            <v-row v-if="currentComparingImage" class="mt-4">
              <v-col cols="auto" class="text-caption text-grey mb-1">
                {{ t('codex.treasureMaps.comparison.currentComparing') }}
              </v-col>
              <v-col class="d-flex align-center gap-2">
                <div>
                  <div class="text-body-2">{{ currentComparingImage.id }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </div>

        <!-- 初始选择图片提示 -->
        <template v-if="searchResults.length <= 0 && !searching && !queryImageData">
          <v-card class="pa-10 d-flex justify-center align-center" :height="`calc(100vh - ${mobile ? 480 : 400}px)`" elevation="0" border>
            <div class="text-center">
              <v-btn type="button" class="mt-7" size="x-large" variant="tonal" @click.stop.prevent="triggerFileInput">
                <v-icon>mdi-image-plus</v-icon>
                {{ t('codex.treasureMaps.comparison.selectImage') }}
              </v-btn>
              <p class="mt-3 opacity-60 text-caption">{{ t('codex.treasureMaps.comparison.uploadPrompt') }}</p>
            </div>
          </v-card>

          <v-alert type="info" variant="tonal" density="compact" class="my-3">
            <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
            <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
            <p>{{ t('codex.treasureMaps.comparison.noResult.useFilter') }}</p>
          </v-alert>
        </template>

        <!-- 搜索结果 -->
        <v-card variant="text" min-height="300" v-if="searchResults.length > 0">
          <v-row>
            <v-col cols="auto" class="w-100 mb-3">
              <div class="results-grid">
                <v-card border min-height="235" v-for="(result, index) in searchResults" :key="index">
                  <v-card-text class="text-center px-2 bg-black">
                    <div>
                      <ItemSlotBase class="position-relative mx-auto">
                        <TreasureMapIconWidget :id="result.id "></TreasureMapIconWidget>
                      </ItemSlotBase>
                    </div>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-row no-gutters align="center" class="py-2 px-4">
                    <v-col>
                      <div class="text-amber singe-line"><u class="u">{{ result.similarity.toFixed(1) }}%</u></div>
                    </v-col>
                    <v-col cols="auto">
                      <div class="singe-line"><span class="opacity-60 mr-1">{{ result.index }}</span>#</div>
                    </v-col>
                  </v-row>
                  <div class="px-4 mb-2">
                    <ByObtainableWidget :data="result.original" byType="treasureMap"></ByObtainableWidget>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <!-- 无结果提示 -->
        <v-card variant="text" border class="overflow-y-auto text-center py-10 mb-3" v-if="searched && searchResults.length <= 0">
          <v-icon size="48" color="grey" class="mb-2">mdi-image-off</v-icon>
          <div class="text-caption">
            <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
            <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
          </div>
        </v-card>
      </div>

      <v-divider></v-divider>
      <v-card-actions class="d-flex align-center ga-2 pa-4">
        <v-spacer></v-spacer>
        <v-btn v-if="!searching" type="button" variant="text" @click.stop.prevent="onResetSearch"
               :disabled="!queryImageData && searchResults.length === 0">
          {{ t('basic.button.reset') }}
        </v-btn>
        <v-btn v-if="searching" type="button" variant="text" color="error" @click.stop.prevent="onAbortSearch">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn type="button" color="var(--main-color)" @click.stop.prevent="onSearchSimilarImages"
               :disabled="!queryImageData" :loading="searching">
          {{ t('basic.button.search') }}
        </v-btn>
      </v-card-actions>
    </template>
  </div>

  <!-- 隐藏的文件上传 input -->
  <input
      ref="fileInput"
      type="file"
      @change="onQueryImageUpload"
      accept="image/*"
      style="display: none"
  />
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch, nextTick} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  calculateHashSimilarity,
  compareHistograms,
  compareStructuralFeatures,
  compareBlockFeatures,
  computeBlockFeatures,
  computeColorHistogram,
  computeStructuralFeatures,
  getImageHash,
  computeTFEmbedding,
  cosineSimilarity,
  loadMobileNetModel
} from '@/assets/sripts/image_similarity';
import {TreasureMaps} from "glow-prow-data";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useSimilarityStore} from "~/stores/similarityStore";
import {QueryImageData, SearchResult, Algorithm, ComparingImage} from '@/assets/types/Similarity';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";

const props = withDefaults(defineProps<{
  pageMode?: boolean
}>(), {
  pageMode: false
});

const treasureMaps = TreasureMaps;
const {t} = useI18n();
const {mobile} = useDisplay();
const {currentService: currentImageService} = useCDNAssetsServiceStore();
const route = useRoute();
const router = useRouter();

const fileInput = ref<HTMLInputElement | null>(null);
const showCropper = ref(false);
const croppingImageUrl = ref('');
const cropperImageRef = ref<HTMLImageElement | null>(null);
let cropperInstance: Cropper | null = null;

const triggerFileInput = () => {
  fileInput.value?.click();
};

const model = ref(false);
const searched = ref(false);
const queryImageData = ref<QueryImageData | null>(null);
const searchResults = ref<SearchResult[]>([]);
const searchMinimumCondition = ref(50);
const searchRangeMax = ref(100);
const selectedAlgorithm = ref<string>('feature-matching');
const imageList = ref<string[]>([]);
const similarityStore = useSimilarityStore();

const selectedCategories = ref<string[]>([]);
const selectedObtainables = ref<string[]>([]);
const currentProgress = computed(() => similarityStore.progress);
const totalImages = computed(() => similarityStore.total);
const searching = computed(() => similarityStore.isProcessing);
const currentComparingImage = ref<ComparingImage | null>(null);

const algorithms: Algorithm[] = [
  {value: 'perceptual-hash'},
  {value: 'color-histogram'},
  {value: 'feature-matching'},
  {value: 'structural-similarity'},
  {value: 'tensorflow-mobilenet'}
];

// TF.js 模型加载状态
const tfModelLoading = ref(false);
const tfModelLoaded = ref(false);
const tfModelError = ref<string | null>(null);

// 灰度模式：默认勾选，忽略颜色差异只比结构
const useGrayscale = ref(true);

// 切换灰度选项时，清除已缓存的 tfEmbedding（确保下次重新提取）
watch(useGrayscale, () => {
  for (const [url, feat] of similarityStore.featuresCache.entries()) {
    if (feat?.tfEmbedding) {
      const { tfEmbedding: _, ...rest } = feat;
      similarityStore.setFeatures(url, rest);
    }
  }
});

/**
 * 预热加载 MobileNet 模型
 */
const ensureTFModelLoaded = async () => {
  if (tfModelLoaded.value) return;
  tfModelLoading.value = true;
  tfModelError.value = null;
  try {
    await loadMobileNetModel();
    tfModelLoaded.value = true;
  } catch (e: any) {
    tfModelError.value = e.message;
    console.error('TF.js 模型加载失败:', e);
  } finally {
    tfModelLoading.value = false;
  }
};

const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 || selectedObtainables.value.length > 0;
});

const progressPercentage = computed(() => {
  if (totalImages.value === 0) return 0;
  return Math.round((currentProgress.value / totalImages.value) * 100);
});

const categoryOptions = computed(() => [
  {value: 'recent'},
  {value: 'old'},
  {value: 'veryOld'},
  {value: 'legend'}
].map(i => {
  i['title'] = t(`codex.treasureMap.categorys.${i.value}`);
  return i;
}));

/**
 * 从 obtainable 元素（string | MapLocation | 嵌套数组）中提取字符串 ID
 */
const extractObtainableIds = (obtainable: any): string[] => {
  if (!obtainable) return [];
  if (Array.isArray(obtainable)) {
    return obtainable.flatMap((item: any) => extractObtainableIds(item));
  }
  if (typeof obtainable === 'string') return [obtainable];
  if (typeof obtainable === 'object' && obtainable.id) return [obtainable.id];
  return [];
};

const obtainableOptions = computed(() => {
  const allObtainables = new Set<string>();
  Object.values(treasureMaps).forEach((map: any) => {
    extractObtainableIds(map.obtainable).forEach(id => allObtainables.add(id));
  });
  return Array.from(allObtainables).map(id => ({
    value: id,
    title: id
  }));
});

const filteredImageList = computed(() => {
  return imageList.value.filter((url) => {
    const imageId = getImageIdFromUrl(url);
    const mapData = treasureMaps[imageId];
    if (!mapData) return false;

    // 分类筛选
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(mapData.category)) {
      return false;
    }

    // 来源筛选
    if (selectedObtainables.value.length > 0) {
      const ids = extractObtainableIds((mapData as any).obtainable);
      const hasMatchingObtainable = ids.some(id => selectedObtainables.value.includes(id));
      if (!hasMatchingObtainable) return false;
    }

    return true;
  });
});

// ======================= URL Query 同步机制 =======================
let isSyncingFromRoute = false;

const initFiltersFromRoute = () => {
  if (!route) return;
  const q = route.query;

  if (q.algorithm && typeof q.algorithm === 'string') {
    if (algorithms.some(a => a.value === q.algorithm)) {
      selectedAlgorithm.value = q.algorithm;
    }
  }

  if (q.categories) {
    if (typeof q.categories === 'string') {
      selectedCategories.value = q.categories.split(',').filter(Boolean);
    } else if (Array.isArray(q.categories)) {
      selectedCategories.value = q.categories.map(String).filter(Boolean);
    }
  }

  const rawSources = q.sources || q.obtainables;
  if (rawSources) {
    if (typeof rawSources === 'string') {
      selectedObtainables.value = rawSources.split(',').filter(Boolean);
    } else if (Array.isArray(rawSources)) {
      selectedObtainables.value = rawSources.map(String).filter(Boolean);
    }
  }

  if (q.minSimilarity !== undefined) {
    const n = Number(q.minSimilarity);
    if (!isNaN(n) && n >= 0 && n <= 100) {
      searchMinimumCondition.value = n;
    }
  }

  const rawRange = q.maxRange || q.range;
  if (rawRange !== undefined) {
    const n = Number(rawRange);
    if (!isNaN(n) && n >= 0) {
      searchRangeMax.value = n;
    }
  }

  if (q.grayscale !== undefined) {
    useGrayscale.value = q.grayscale !== 'false' && q.grayscale !== '0';
  }
};

const syncFiltersToRoute = () => {
  if (isSyncingFromRoute || !route || !router) return;

  const query: Record<string, any> = { ...route.query };

  if (selectedAlgorithm.value && selectedAlgorithm.value !== 'feature-matching') {
    query.algorithm = selectedAlgorithm.value;
  } else {
    delete query.algorithm;
  }

  if (selectedCategories.value.length > 0) {
    query.categories = selectedCategories.value.join(',');
  } else {
    delete query.categories;
  }

  if (selectedObtainables.value.length > 0) {
    query.sources = selectedObtainables.value.join(',');
    delete query.obtainables;
  } else {
    delete query.sources;
    delete query.obtainables;
  }

  if (searchMinimumCondition.value !== 50) {
    query.minSimilarity = searchMinimumCondition.value.toString();
  } else {
    delete query.minSimilarity;
  }

  if (searchRangeMax.value !== 100) {
    query.maxRange = searchRangeMax.value.toString();
    delete query.range;
  } else {
    delete query.maxRange;
    delete query.range;
  }

  if (!useGrayscale.value) {
    query.grayscale = 'false';
  } else {
    delete query.grayscale;
  }

  delete query.comparison;

  router.replace({ query }).catch(() => {});
};

// 监听筛选参数变动并同步到 URL
watch([
  selectedAlgorithm,
  selectedCategories,
  selectedObtainables,
  searchMinimumCondition,
  searchRangeMax,
  useGrayscale
], () => {
  syncFiltersToRoute();
}, { deep: true });

// 监听 URL 变动（如前进/后退/粘贴新URL）
watch(() => route.query, () => {
  isSyncingFromRoute = true;
  initFiltersFromRoute();
  nextTick(() => {
    isSyncingFromRoute = false;
  });
});

onMounted(() => {
  initFiltersFromRoute();

  imageList.value = Object.values(treasureMaps).map((d: any) => {
    return currentImageService.url({
      id: d.id,
      category: `treasureMaps/${d.category}`
    }, 'glow-prow');
  });
});

onUnmounted(() => {
  if (queryImageData.value?.url && queryImageData.value.url.startsWith('blob:')) {
    URL.revokeObjectURL(queryImageData.value.url);
  }
});

watch(() => queryImageData.value, (value, oldValue) => {
  if (value && value !== oldValue) {
    onSearchSimilarImages();
  }
});

const openDialog = () => {
  model.value = true;
};

const closeDialog = () => {
  model.value = false;
  onResetSearch();
};

const onResetSearch = () => {
  queryImageData.value = null;
  searchResults.value = [];
  searched.value = false;
  similarityStore.abortProcessing();
  currentComparingImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const onAbortSearch = () => {
  similarityStore.abortProcessing();
  onResetSearch();
};

const getImageIdFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url, window.location.origin);
    const id = urlObj.searchParams.get('id');
    if (id) return id;
  } catch (e) {
  }
  const filename = url.split('/').pop() || '';
  return filename.split('.')[0];
};

const loadImageToImageData = (imageUrl: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

const onQueryImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const imageUrl = URL.createObjectURL(file);

  croppingImageUrl.value = imageUrl;
  showCropper.value = true;

  nextTick(() => {
    if (cropperImageRef.value) {
      if (cropperInstance) {
        cropperInstance.destroy();
      }
      cropperInstance = new Cropper(cropperImageRef.value, {
        viewMode: 1,
        dragMode: 'crop',
        autoCropArea: 0.9,
        restore: false,
        zoomable: true,
        guides: false,
        background: false,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    }
  });
};

const cancelCrop = () => {
  showCropper.value = false;
  if (croppingImageUrl.value) {
    URL.revokeObjectURL(croppingImageUrl.value);
    croppingImageUrl.value = '';
  }
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  onResetSearch();
};

const confirmCrop = async () => {
  if (!cropperInstance) return;

  const canvas = cropperInstance.getCroppedCanvas();
  const croppedUrl = canvas.toDataURL('image/png');

  showCropper.value = false;
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }

  try {
    const features: Partial<QueryImageData> = {};

    switch (selectedAlgorithm.value) {
      case 'perceptual-hash':
        features.hash = await getImageHash(croppedUrl);
        break;
      case 'color-histogram':
        const colorImageData = await loadImageToImageData(croppedUrl);
        features.colorHistogram = computeColorHistogram(colorImageData);
        break;
      case 'structural-similarity':
        const structImageData = await loadImageToImageData(croppedUrl);
        features.structuralFeatures = computeStructuralFeatures(structImageData);
        break;
      case 'feature-matching':
        const blockImageData = await loadImageToImageData(croppedUrl);
        features.blockFeatures = computeBlockFeatures(blockImageData);
        break;
      case 'tensorflow-mobilenet':
        await ensureTFModelLoaded();
        features.tfEmbedding = await computeTFEmbedding(croppedUrl, useGrayscale.value);
        break;
    }

    queryImageData.value = {
      url: croppedUrl,
      ...features
    };

    searchResults.value = [];
    searched.value = false;
    currentComparingImage.value = null;

    if (croppingImageUrl.value) {
      URL.revokeObjectURL(croppingImageUrl.value);
      croppingImageUrl.value = '';
    }
  } catch (error) {
    console.error('图片处理失败:', error);
  }
};

const calculateSimilarity = (queryData: QueryImageData, features: any): number => {
  if (!features) return 0;
  switch (selectedAlgorithm.value) {
    case 'perceptual-hash':
      return queryData.hash ? calculateHashSimilarity(queryData.hash, features.hash) : 0;
    case 'color-histogram':
      return queryData.colorHistogram ? compareHistograms(queryData.colorHistogram, features.colorHistogram) : 0;
    case 'structural-similarity':
      return queryData.structuralFeatures ? compareStructuralFeatures(queryData.structuralFeatures, features.structuralFeatures) : 0;
    case 'feature-matching':
      return queryData.blockFeatures ? compareBlockFeatures(queryData.blockFeatures, features.blockFeatures || features.structuralFeatures) : 0;
    case 'tensorflow-mobilenet':
      return queryData.tfEmbedding && features.tfEmbedding
          ? cosineSimilarity(queryData.tfEmbedding, features.tfEmbedding)
          : 0;
    default:
      return 0;
  }
};

const onSearchSimilarImages = async () => {
  if (!queryImageData.value) return;

  searchResults.value = [];
  searched.value = false;
  currentComparingImage.value = null;

  try {
    const filteredList = filteredImageList.value;

    if (selectedAlgorithm.value === 'tensorflow-mobilenet') {
      await ensureTFModelLoaded();
      similarityStore.isProcessing = true;
      similarityStore.total = filteredList.length;
      similarityStore.progress = 0;

      const results: SearchResult[] = [];
      for (let index = 0; index < filteredList.length; index++) {
        const imgUrl = filteredList[index];
        const imageId = getImageIdFromUrl(imgUrl);
        const mapData = treasureMaps[imageId];

        currentComparingImage.value = { id: imageId, url: imgUrl, category: mapData?.category ?? '', index };

        let features = similarityStore.featuresCache.get(imgUrl);
        if (!features || !features.tfEmbedding) {
          try {
            const tfEmb = await computeTFEmbedding(imgUrl, useGrayscale.value);
            features = { ...(features || {}), tfEmbedding: tfEmb };
            similarityStore.setFeatures(imgUrl, features);
          } catch (e) {
            console.warn('TF embedding 提取失败:', imgUrl, e);
            similarityStore.progress++;
            continue;
          }
        }

        if (mapData) {
          const similarity = calculateSimilarity(queryImageData.value, features);
          results.push({
            id: imageId,
            index,
            similarity,
            imageUrl: imgUrl,
            original: mapData,
            category: mapData.category,
            obtainable: mapData.obtainable
          });
        }
        similarityStore.progress++;
      }

      similarityStore.isProcessing = false;

      searchResults.value = results
          .filter(item => item.similarity >= searchMinimumCondition.value)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, searchRangeMax.value);
    } else {
      await similarityStore.startProcessing(filteredList);

      const results: SearchResult[] = [];
      for (let index = 0; index < filteredList.length; index++) {
        const imgUrl = filteredList[index];
        const imageId = getImageIdFromUrl(imgUrl);
        const mapData = treasureMaps[imageId];
        const features = similarityStore.featuresCache.get(imgUrl);

        if (features && mapData) {
          const similarity = calculateSimilarity(queryImageData.value, features);
          results.push({
            id: imageId,
            index,
            similarity,
            imageUrl: imgUrl,
            original: mapData,
            category: mapData.category,
            obtainable: mapData.obtainable
          });
        }
      }

      searchResults.value = results
          .filter(item => item.similarity >= searchMinimumCondition.value)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, searchRangeMax.value);
    }

  } catch (error: any) {
    if (error.message !== 'Operation aborted') {
      console.error('搜索过程中出错:', error);
    }
  } finally {
    searched.value = true;
    currentComparingImage.value = null;
  }
};

const openModel = () => {
  model.value = true;
};

defineOptions({
  name: 'TreasureMapImageSimilarity',
});

defineExpose({
  openModel
});
</script>

<style scoped lang="less">
@import "@/assets/styles/link";

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(180px * 1.3), 1fr));
  gap: 16px;
}

.similarity {
  font-size: 1.1em;
  font-weight: bold;
  margin: 4px 0;
}

/* 裁切组件主题样式重写 */
:deep(.cropper-view-box) {
  outline-color: var(--main-color) !important;
}

:deep(.cropper-point) {
  background-color: var(--main-color) !important;
}

:deep(.cropper-line) {
  background-color: var(--main-color) !important;
}

:deep(.cropper-center::before),
:deep(.cropper-center::after) {
  background-color: var(--main-color) !important;
}

:deep(.cropper-dashed) {
  border-color: hsl(from var(--main-color) h s l / .5) !important;
}
</style>
