<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, assemblyViewConfig} from "@/assets/sripts/index";
import {useRoute, useRouter} from "vue-router";

import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import ImgView from "@/components/ImgView.vue";
import languagesConfig from "@/config/languages";

const {t, messages} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    props = withDefaults(defineProps<{ modelValue: any, isShowDelete?: boolean }>(), {
      isShowDelete: true
    })

let emit = defineEmits(['update:modelValue']),
    settingConfig = ref({
      visibilitys: [
        {
          label: t('assembly.setting.publicly'),
          value: 'publicly'
        },
        {
          label: t('assembly.setting.private'),
          value: 'private'
        }
      ]
    }),
    delAssemblyLoading = ref(false),
    deleteDialog = ref(false),
    tabValue = ref('assembly')

let languages = computed(() => {
      return languagesConfig.child.map(item => ({
        label: item.label,
        value: item.value
      }));
    }),
    /**
     * 语言友好标签解析（兼容下划线和连字符格式）
     */
    getLanguageLabel = (val: any) => {
      if (!val) return "";
      const raw = typeof val === 'object' ? (val.value || val.title || '') : String(val);
      const normalized = raw.replace("_", "-").toLowerCase();
      const found = languagesConfig.child.find((item) => item.value.toLowerCase() === normalized);
      return found ? found.label : raw;
    },
    // 密码是否已设置：保存后立即切换按钮状态，无需等待重新拉取
    passwordOperated = ref<'none' | 'set' | null>(null),
    passwordDialog = ref(false),
    passwordMode = ref<'set' | 'change'>('set'),
    passwordValue = ref(''),
    // 属性背景图选择器
    imagePicker = ref()

const hasPassword = computed(() => {
  if (passwordOperated.value === 'none') return false
  if (passwordOperated.value === 'set') return true

  return !!(props.modelValue.password || props.modelValue.assembly.attr.password)
})

const passwordInvalid = computed(() => {
  const value = passwordValue.value
  if (!value) return false

  return value.length < 6 || value.length > 32 || !/^[a-zA-Z0-9_]+$/.test(value)
})

/**
 * 打开密码设置/更改弹窗
 * @param mode 设置新密码或更改已有密码
 */
const openPasswordDialog = (mode: 'set' | 'change') => {
  passwordMode.value = mode
  passwordValue.value = ''
  passwordDialog.value = true
}

/**
 * 提交密码设置或更改
 */
const submitPassword = () => {
  if (!passwordValue.value || passwordInvalid.value) return

  props.modelValue.assembly.attr.password = passwordValue.value
  passwordOperated.value = 'set'
  passwordDialog.value = false
}

/**
 * 删除配装密码
 */
const deletePassword = () => {
  // 传 null 交由保存流程转换为清空密码
  props.modelValue.assembly.attr.password = null
  passwordOperated.value = 'none'
}

/**
 * 选择属性背景图
 */
const onBackgroundChange = () => {
  imagePicker.value?.openPanel(props.modelValue.assembly.attr.backgroundPresentation || '')
}

/**
 * 接收图片选择结果
 * @param src 图片地址
 */
const onBackgroundPicked = (src: string) => {
  props.modelValue.assembly.attr.backgroundPresentation = src
}


watch(() => props.modelValue.value, (value, oldValue) => {
  const changes = {}
  for (const key in value) {
    if (!isEqual(value[key], oldValue[key])) {
      changes[key] = value[key]
    }
  }

  if (Object.keys(changes).length > 0) {
    emit('update:modelValue', {...props.modelValue, ...changes})
  }
}, {flush: 'sync'})

const isEqual = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * 删除配装
 */
const delAssembly = async () => {
  try {
    const uuid = props.modelValue.uuid;
    delAssemblyLoading.value = true

    const result = await apis.assemblyApi().deleteAssembly(<string>uuid),
        d = result.data;

    await router.push("/assembly")

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AssmblySettingWidget'})
  } finally {
    delAssemblyLoading.value = false
    deleteDialog.value = false
  }
}

const isDebug = computed(() => (route as any)?.query?.debug)

defineOptions({
  name: 'AssmblySettingWidget'
})
</script>

<template>
  <v-row no-gutters>
    <v-col cols="2">
      <v-tabs
          class="pa-0 w-100"
          v-model="tabValue"
          direction="vertical">
        <v-tab :text="t('assembly.setting.general')"
               value="common"
               prepend-icon="mdi-tune-variant">
        </v-tab>
        <v-tab :text="t(`assembly.additions.${i}`)"
               :value="i"
               :disabled="!modelValue[i]"
               v-for="(i,index) in assemblyViewConfig.onlyRead"
               :key="index">
        </v-tab>
      </v-tabs>
    </v-col>
    <v-divider vertical></v-divider>
    <v-col>
      <v-card elevation="0" class="overflow-y-auto pa-5" max-height="70vh">
        <v-tabs-window v-model="tabValue">
          <v-tabs-window-item value="common">
            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.usePassword') }}</b>
                <p class="text-caption">{{ t('assembly.setting.passwordDescription') }}</p>
              </v-col>
              <v-col class="d-flex align-center flex-wrap ga-2">
                <template v-if="isDebug">
                  {{ modelValue.assembly.attr.password }}
                </template>

                <v-btn v-if="!hasPassword"
                       variant="flat"
                       class="bg-amber text-black"
                       @click="openPasswordDialog('set')">
                  {{ t('basic.button.setting') }}
                </v-btn>

                <template v-else>
                  <v-btn variant="flat" class="bg-amber text-black" @click="openPasswordDialog('change')">
                    {{ t('basic.button.change') }}
                  </v-btn>
                  <v-btn variant="flat" class="bg-red" @click="deletePassword">
                    {{ t('basic.button.delete') }}
                  </v-btn>
                </template>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.anonymous') }}</b>
                <p class="text-caption">{{ t('assembly.setting.anonymousDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isAnonymous"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.comments') }}</b>
                <p class="text-caption">{{ t('assembly.setting.commentsDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isComment"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.likes') }}</b>
                <p class="text-caption">{{ t('assembly.setting.likesDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isLike"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.allowClone') }}</b>
                <p class="text-caption">{{ t('assembly.setting.allowCloneDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isAllowClone"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.allowSearch') }}</b>
                <p class="text-caption">{{ t('assembly.setting.allowSearchDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isAllowSearch"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <v-tabs-window-item value="assembly">
            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.visibility') }}</b>
                <p class="text-caption">{{ t('assembly.setting.visibilityDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    item-title="label"
                    v-model="modelValue.assembly.visibility"
                    :items="settingConfig.visibilitys"
                    :label="t('assembly.setting.selectVisibility')"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.language') }}</b>
                <p class="text-caption">{{ t('assembly.setting.languageDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    item-title="label"
                    item-value="value"
                    v-model="modelValue.assembly.attr.language"
                    multiple
                    :items="languages"
                    :label="t('assembly.setting.selectLanguage')"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip size="small" class="mr-1">
                      {{ getLanguageLabel(item.value || item) }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.backgroundImage') }}</b>
                <p class="text-caption">{{ t('assembly.setting.backgroundImageDescription') }}</p>
              </v-col>
              <v-col>
                <v-card border class="pa-2">
                  <div class="background-preview mb-2">
                    <v-img
                        v-if="modelValue.assembly.attr.backgroundPresentation"
                        :src="modelValue.assembly.attr.backgroundPresentation"
                        :alt="t('assembly.setting.backgroundImageAlt')"
                        height="120"
                        cover
                        class="rounded"
                    ></v-img>
                    <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
                      <v-icon icon="mdi-image-outline" size="40"></v-icon>
                    </div>
                  </div>

                  <v-btn variant="flat" class="bg-amber text-black" @click="onBackgroundChange">
                    {{ t('basic.button.change') }}
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.showItemName') }}</b>
                <p class="text-caption">{{ t('assembly.setting.showItemNameDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isShowItemName"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row v-show="modelValue.assembly.attr.isShowItemName">
              <v-col>
                <b>{{ t('assembly.setting.showFullName') }}</b>
                <p class="text-caption">{{ t('assembly.setting.showFullNameDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isFullName"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.showWeaponIconArray') }}</b>
                <p class="text-caption">{{ t('assembly.setting.showWeaponIconArrayDescription') }}</p>
              </v-col>
              <v-col>
                <v-checkbox
                    v-model="modelValue.assembly.attr.isShowWeaponIconArray"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-divider class="mt-10 mb-10">{{ t('assembly.setting.other') }}</v-divider>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.rendererVersion') }}</b>
                <p class="text-caption">{{ t('assembly.setting.rendererVersionDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    :placeholder="t('assembly.setting.selectVersion')"
                    :items="AssemblyDataProcessing.versions"
                    v-model="modelValue.assembly.attr.assemblyUseVersion"
                    :label="t('assembly.setting.version')"
                ></v-select>
              </v-col>
            </v-row>

            <v-row v-if="isShowDelete">
              <v-col>
                <b>{{ t('basic.button.delete') }}</b>
                <p class="text-caption">{{ t('assembly.setting.deleteDescription') }}</p>
              </v-col>
              <v-col>
                <v-btn
                    class="bg-red"
                    @click="deleteDialog = true"
                    :loading="delAssemblyLoading">
                  {{ t('basic.button.delete') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item value="wheel">
            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.wheelRendererVersion') }}</b>
                <p class="text-caption">{{ t('assembly.setting.wheelRendererVersionDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    :placeholder="t('assembly.setting.selectVersion')"
                    :items="WheelDataProcessing.versions"
                    v-model="modelValue.wheel.attr.wheelUseVersion"
                    :label="t('assembly.setting.version')"
                ></v-select>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item value="warehouse">
            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.warehouseRendererVersion') }}</b>
                <p class="text-caption">{{ t('assembly.setting.warehouseRendererVersionDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    :placeholder="t('assembly.setting.selectVersion')"
                    :items="WarehouseDataProcessing.versions"
                    v-model="modelValue.warehouse.attr.warehouseUseVersion"
                    :label="t('assembly.setting.version')"
                ></v-select>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item value="mastery">
            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.masteryRendererVersion') }}</b>
                <p class="text-caption">{{ t('assembly.setting.masteryRendererVersionDescription') }}</p>
              </v-col>
              <v-col>
                <v-select
                    :placeholder="t('assembly.setting.selectVersion')"
                    :items="MasteryDataProcessing.versions"
                    v-model="modelValue.mastery.attr.masteryUseVersion"
                    :label="t('assembly.setting.version')"
                ></v-select>
              </v-col>
            </v-row>
          </v-tabs-window-item>

        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>

  <!-- 删除确认对话框 -->
  <v-dialog v-model="deleteDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">{{ t('assembly.setting.deleteConfirmation') }}</v-card-title>
      <v-card-text>{{ t('assembly.setting.deleteWarning') }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="deleteDialog = false">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="red" @click="delAssembly" :loading="delAssemblyLoading">{{ t('basic.button.submit') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 密码设置/更改对话框 -->
  <v-dialog v-model="passwordDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">
        {{ passwordMode === 'set' ? t('assembly.setting.usePassword') : t('basic.button.change') }}
      </v-card-title>
      <v-card-text>
        <v-text-field
            v-model="passwordValue"
            :label="t('assembly.setting.passwordInput')"
            :placeholder="passwordMode === 'change' ? '******' : ''"
            :error="passwordInvalid"
            :error-messages="passwordInvalid ? [t('assembly.setting.passwordHint')] : []"
            autocomplete="new-password"
            persistent-hint
            :hint="t('assembly.setting.passwordHint')"
            density="comfortable"
            maxlength="32"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="passwordDialog = false">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="amber" class="text-black"
               :disabled="!passwordValue || passwordInvalid"
               @click="submitPassword">
          {{ t('basic.button.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 属性背景图选择：复用媒体库/链接/上传三合一选择器 -->
  <ImgView ref="imagePicker" @finish="onBackgroundPicked"></ImgView>
</template>

<style scoped lang="less">
.background-preview {
  height: 120px;
  overflow: hidden;
  border-radius: 4px;
  background: rgb(255 255 255 / 4%);
}
</style>
