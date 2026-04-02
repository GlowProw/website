<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {ref} from "vue";
import {useCalculatorStore} from "~/stores/calculatorStore";
import {useDisplay} from "vuetify/framework";

const {t} = useI18n()
const {mobile} = useDisplay()
const store = useCalculatorStore()

const dialog = ref(false)
const configName = ref('')
const deleteConfirmUid = ref<string | null>(null)

function onSave() {
  if (!configName.value.trim()) return
  store.saveConfig(configName.value.trim())
  configName.value = ''
}

function onLoad(uid: string) {
  store.loadConfig(uid)
  dialog.value = false
}

function onDelete(uid: string) {
  store.deleteConfig(uid)
  deleteConfirmUid.value = null
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString()
}

defineExpose({dialog})
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" scrollable>
    <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
        <v-icon size="80">mdi-content-save-cog</v-icon>
        <p>{{ t('calculator.config.title') }}</p>
      </v-card-title>

      <v-card-text>
        <!-- 保存新配置 -->
        <v-row dense align="center">
          <v-col>
            <v-text-field
                v-model="configName"
                :placeholder="t('calculator.config.name')"
                :label="t('calculator.config.save')"
                density="compact"
                variant="outlined"
                hide-details
                @keyup.enter="onSave"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
                color="amber"
                variant="tonal"
                @click="onSave"
                :disabled="!configName.trim()">
              <v-icon icon="mdi-content-save" class="mr-1"/>
              {{ t('basic.button.save') }}
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="my-4"/>

        <!-- 已保存列表 -->
        <p class="text-subtitle-2 mb-2 font-weight-bold">{{ t('calculator.config.savedConfigs') }}</p>

        <div v-if="store.savedConfigs.length === 0" class="text-center py-6 opacity-50">
          <v-icon icon="mdi-folder-open" size="40" class="mb-2"/>
          <p class="text-body-2">{{ t('calculator.config.noSavedConfigs') }}</p>
        </div>

        <v-list v-else density="compact">
          <v-list-item
              v-for="config in store.savedConfigs"
              :key="config.uid"
          >
            <v-list-item-title class="font-weight-medium">
              {{ config.name }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ formatDate(config.createdAt) }} ·
              {{ config.targets.length }} {{ t('calculator.targets.title') }} ·
              {{ config.excludedMaterials.length }} {{ t('calculator.exclude.title') }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex ga-1">
                <v-btn
                    density="compact"
                    icon="mdi-download"
                    variant="text"
                    color="success"
                    size="small"
                    @click="onLoad(config.uid)"
                    :title="t('calculator.config.load')"
                />
                <v-btn
                    density="compact"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="deleteConfirmUid = config.uid"
                    :title="t('calculator.config.delete')"
                />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="dialog = false">{{ t('basic.button.cancel') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 删除确认 -->
  <v-dialog :model-value="!!deleteConfirmUid" @update:model-value="(v: boolean) => { if (!v) deleteConfirmUid = null }" max-width="380">
    <v-card v-if="deleteConfirmUid">
      <v-card-title>{{ t('calculator.config.delete') }}</v-card-title>
      <v-card-text>{{ t('comment.deleteWarning') }}</v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="deleteConfirmUid = null">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="error" variant="tonal" @click="onDelete(deleteConfirmUid)">{{ t('basic.button.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
