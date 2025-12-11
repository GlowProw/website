<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, assemblyViewConfig} from "@/assets/sripts/index";
import {useHttpToken} from "@/assets/sripts/http_util";
import {useRoute, useRouter} from "vue-router";

import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

const {t, messages} = useI18n(),
    http = useHttpToken(),
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

let languages = computed(() => Object.keys(messages.value)),
    // 密码提示
    passwordPlaceholder = computed(() => {
      if (props.modelValue.password && props.modelValue.assembly.attr.password === '')
        return t('assembly.setting.includePasswordHint')

      else if (props.modelValue.password && props.modelValue.assembly.attr.password === null)
        return t('assembly.setting.existingPasswordButNewDelete')

      else if (!props.modelValue.password && props.modelValue.assembly.attr.password === '')
        return t('assembly.setting.notPassword')

      return t('assembly.setting.notPassword')
    })

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
    const {uuid} = route.params;
    delAssemblyLoading.value = true

    const result = await apis.assemblyApi().deleteAssembly(<string>uuid),
        d = result.data;

    await router.push("/assembly")

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  } finally {
    delAssemblyLoading.value = false
    deleteDialog.value = false
  }
}
</script>

<template>
  <v-row no-gutters>
    <v-col cols="2">
      <v-tabs
          class="pa-0 w-100"
          v-model="tabValue"
          direction="vertical">
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
                <b>{{ t('assembly.setting.usePassword') }}</b>
                <p class="text-caption">{{ t('assembly.setting.passwordDescription') }}</p>
              </v-col>
              <v-col>
                <template v-if="route?.debug">
                  {{ modelValue.assembly.attr.password }}
                </template>

                <v-text-field
                    item-title="label"
                    :placeholder="passwordPlaceholder"
                    clearable
                    v-model="modelValue.assembly.attr.password"
                    :label="t('assembly.setting.passwordInput')"
                >
                  <template v-slot:details>
                    {{ t('assembly.setting.passwordHint') }}
                  </template>
                  <template v-slot:append>
                    <v-btn
                        icon="mdi-delete"
                        v-if="modelValue.assembly.attr.password  === ''"
                        @click="modelValue.assembly.attr.password = null"
                        :title="t('basic.button.delete')"
                    ></v-btn>
                  </template>
                </v-text-field>
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
                    v-model="modelValue.assembly.attr.language"
                    multiple
                    :items="languages"
                    :label="t('assembly.setting.selectLanguage')"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>{{ t('assembly.setting.backgroundImage') }}</b>
                <p class="text-caption">{{ t('assembly.setting.backgroundImageDescription') }}</p>
              </v-col>
              <v-col>
                <v-card border>
                  <v-img
                      v-if="modelValue.assembly.attr.backgroundPresentation"
                      :src="modelValue.assembly.attr.backgroundPresentation"
                      :alt="t('assembly.setting.backgroundImageAlt')"
                  ></v-img>
                  <v-text-field
                      tile hide-details clearable persistent-hint
                      type="src"
                      placeholder="https://"
                      v-model="modelValue.assembly.attr.backgroundPresentation"
                      :label="t('assembly.setting.backgroundImageUrl')"
                  ></v-text-field>
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
                    :loading="delAssemblyLoading"
                >
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
        <v-btn @click="deleteDialog = false">{{ t('basic.cancel') }}</v-btn>
        <v-btn color="red" @click="delAssembly" :loading="delAssemblyLoading">{{ t('basic.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
