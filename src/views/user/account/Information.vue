<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import {computed, onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useNoticeStore} from "~/stores/noticeStore";

import RolesTagWidget from "@/components/RolesTagWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

import languages from "@/config/languages";
import {apis} from "@/assets/sripts";
import {useRules} from "@/assets/sripts/rules_user";
import {handleApiError} from "@/assets/sripts/error_handler";

const authStore = useAuthStore(),
    notice = useNoticeStore(),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    rules = useRules()

let form = ref<any>(null),
    userAccountData: Ref<any> = ref({
      privilege: [],
      attr: {
        language: '',
        introduction: ''
      }
    }),
    userAlternativeNameLoading = ref(false),
    userAccountAttrLoading = ref(false),

    // 别名修改
    alternativeNameModel = ref(false),
    alternativeNameFrom: Ref<any> = ref(null),
    alternativeNameData = ref({
      data: {
        username: '',
      }
    }),

    // 重置密码
    changePasswordModel = ref(false),
    changePasswordLoading = ref(false),
    passwordFrom: Ref<any> = ref(null),
    passwordFromData = ref({
      rules: {
        oldPassword: rules.password,
        newPassword: rules.password
      },
      data: {
        oldPassword: '',
        newPassword: '',
      }
    }),

    // 换绑邮箱
    changeEmailModel = ref(false),
    changeEmailLoading = ref(false),
    changeEmailRequestLoading = ref(false),
    emailChangeFrom: Ref<any> = ref(null),
    emailChangeData = ref({
      data: {
        newEmail: '',
        code: ''
      }
    }),

    userAttrLanguages = computed(() => {
      return languages.child
    })

onMounted(() => {
  getUserAccount()
})

const getUserAccount = async () => {
  try {
    const result = await apis.userApi().getMe(),
        d = result.data
    userAccountData.value = d.data;
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  }
}

const onChangePassword = async () => {
  try {
    const {valid} = await passwordFrom.value.validate()
    if (!valid) return;

    changePasswordLoading.value = true;
    const result = await apis.userApi().changePassword(passwordFromData.value.data)

    authStore.logout()
    await router.push({name: 'AccountInformation'})
    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  } finally {
    changePasswordLoading.value = false;
    changePasswordModel.value = false;
    onClearPasswordFrom()
  }
}

const onSaveAccountAttr = async () => {
  try {
    const {valid} = await form.value.validate()
    if (!valid) return

    userAccountAttrLoading.value = true
    const {attr} = userAccountData.value;
    if (attr.language && typeof attr.language === 'object') {
      attr.language = attr.language.value;
    }

    const result = await apis.userApi().updateMeAttr(attr)
    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  } finally {
    userAccountAttrLoading.value = false
  }
}

const onChangeAlternativeName = async () => {
  try {
    const {valid} = await alternativeNameFrom.value.validate()
    if (!valid) return

    userAlternativeNameLoading.value = true
    const newName = alternativeNameData.value.data.username
    const result = await apis.userApi().changeAlternativeName(newName)

    authStore.updateAccountAttr({alternativeName: newName})
    userAccountData.value.alternativeName = newName
    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  } finally {
    alternativeNameData.value.data.username = ''
    userAlternativeNameLoading.value = false
    alternativeNameModel.value = false
  }
}

const onClearPasswordFrom = () => {
  passwordFromData.value.data.newPassword = ''
  passwordFromData.value.data.oldPassword = ''
}

const onChangeEmailRequest = async () => {
  try {
    if (!emailChangeData.value.data.newEmail) {
      notice.error(t('account.information.form.email.error.required'))
      return
    }

    changeEmailRequestLoading.value = true
    const result = await apis.userApi().requestEmailChangeCode(emailChangeData.value.data.newEmail)
    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  } finally {
    changeEmailRequestLoading.value = false
  }
}

const onChangeEmailConfirm = async () => {
  try {
    const {valid} = await emailChangeFrom.value.validate()
    if (!valid) return

    changeEmailLoading.value = true
    const {newEmail, code} = emailChangeData.value.data
    const result = await apis.userApi().confirmEmailChange(newEmail, code)

    notice.success(t(`basic.tips.${result.code}`))
    userAccountData.value.email = newEmail
    changeEmailModel.value = false
    emailChangeData.value.data.newEmail = ''
    emailChangeData.value.data.code = ''
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Information'})
  } finally {
    changeEmailLoading.value = false
  }
}

defineOptions({
  name: 'AccountInformation'
})
</script>

<template>
  <div>
    <!-- 顶部标题 S -->
    <div class="mb-6">
      <p class="text-caption opacity-60 mt-1">
        {{ t('account.information.subtitle') }}
      </p>
    </div>
    <!-- 顶部标题 E -->

    <v-form ref="form">
      <v-row>
        <!-- 基础档案 S -->
        <v-col cols="12" lg="6">
          <AffixBoxHasTitleView>
            <div class="mb-4">
              <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                {{ t('account.information.form.username.name') }}
              </label>
              <v-text-field
                  :value="userAccountData.username"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly>
                <template v-slot:prepend-inner>
                  <v-avatar tile size="26" class="mr-2 bg-black">
                    <UserAvatar size="26" :src="userAccountData.userAvatar"></UserAvatar>
                  </v-avatar>
                </template>
              </v-text-field>
            </div>

            <div class="mb-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <label class="text-caption font-weight-bold opacity-80">
                  {{ t('account.information.form.alternativeName.name') }}
                </label>
                <span class="text-caption opacity-50">{{ t('account.information.form.alternativeName.description') }}</span>
              </div>
              <v-text-field
                  :value="userAccountData.alternativeName || userAccountData.username"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly>
                <template v-slot:append-inner>
                  <v-btn size="x-small" color="amber" variant="tonal" @click="alternativeNameModel = true">
                    {{ t('basic.button.change') }}
                  </v-btn>
                </template>
              </v-text-field>
            </div>

            <div class="mb-4">
              <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                {{ t('account.information.form.uuid.name') }}
              </label>
              <v-text-field
                  :value="userAccountData.id || userAccountData.userId"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly>
              </v-text-field>
            </div>

            <div v-if="userAccountData.privilege && userAccountData.privilege.length > 0">
              <label class="text-caption font-weight-bold opacity-80 mb-2 d-block">
                {{ t('account.roles') }}
              </label>
              <RolesTagWidget :data="userAccountData.privilege"></RolesTagWidget>
            </div>

            <template v-slot:title>
              {{ t('account.profile') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <!-- 基础档案 E -->

        <!-- 账户安全 S -->
        <v-col cols="12" lg="6">
          <AffixBoxHasTitleView>
            <div class="mb-4">
              <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                {{ t('account.information.form.email.name') }}
              </label>
              <v-text-field
                  :value="userAccountData.email || ''"
                  :placeholder="t('account.information.form.email.placeholder')"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly>
                <template v-slot:append-inner>
                  <v-btn size="x-small" color="amber" variant="tonal" @click="changeEmailModel = true">
                    {{ t('basic.button.change') }}
                  </v-btn>
                </template>
              </v-text-field>
            </div>

            <div class="mb-4">
              <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                {{ t('account.information.form.password.name') }}
              </label>
              <v-text-field
                  value="••••••••••••"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly>
                <template v-slot:append-inner>
                  <v-btn size="x-small" color="amber" variant="tonal" @click="changePasswordModel = true">
                    {{ t('basic.button.change') }}
                  </v-btn>
                </template>
              </v-text-field>
              <p class="text-caption opacity-50 mt-1">
                {{ t('account.information.form.password.changePasswordDescription') }}
              </p>
            </div>

            <template v-slot:title>
              {{ t('account.security') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <!-- 账户安全 E -->

        <!-- 偏好与个人介绍 S -->
        <v-col cols="12">
          <AffixBoxHasTitleView>
            <v-row>
              <v-col cols="12" md="6">
                <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                  {{ t('account.information.form.language.name') }}
                </label>
                <v-combobox
                    v-model="userAccountData.attr.language"
                    item-title="label"
                    item-value="value"
                    :placeholder="t('account.information.form.language.placeholder')"
                    :items="userAttrLanguages"
                    variant="outlined"
                    density="compact">
                </v-combobox>
              </v-col>

              <v-col cols="12" md="12">
                <label class="text-caption font-weight-bold opacity-80 mb-1 d-block">
                  {{ t('account.information.form.introduction.name') }}
                </label>
                <v-card border variant="text" class="pa-2">
                  <Textarea
                      v-model="userAccountData.attr.introduction"
                      :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                      :placeholder="t('account.information.form.introduction.placeholder')">
                  </Textarea>
                </v-card>
              </v-col>

              <!-- 隐私与通知开关 -->
              <v-col cols="12" md="6">
                <v-list border density="compact" class="pa-0 bg-transparent">
                  <v-list-item link>
                    <v-list-item-title class="text-caption font-weight-bold">
                      {{ t('account.information.form.spaceEnabled.name') }}
                    </v-list-item-title>
                    <v-list-item-subheader>
                      <p class="text-caption opacity-50">{{ t('account.information.form.spaceEnabled.description') }}</p>
                    </v-list-item-subheader>
                    <template v-slot:append>
                      <v-switch
                          v-model="userAccountData.attr.spaceEnabled"
                          inset color="amber"
                          :prepend-icon="userAccountData.attr.spaceEnabled ? 'mdi-eye-outline' : 'mdi-eye-off-outline'">
                      </v-switch>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <div class="d-flex justify-end mt-4">
              <v-btn
                  color="amber"
                  variant="tonal"
                  :loading="userAccountAttrLoading"
                  @click="onSaveAccountAttr">
                {{ t('basic.button.save') }}
              </v-btn>
            </div>

            <template v-slot:title>
              {{ t('account.preference') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <!-- 偏好与个人介绍 E -->
      </v-row>
    </v-form>

    <!-- 修改别名弹窗 S -->
    <v-dialog max-width="450" v-model="alternativeNameModel">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('account.information.form.alternativeName.changeName') }}</span>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="alternativeNameModel = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert class="mb-4 text-caption" type="warning" density="compact" variant="tonal">
            {{ t('account.information.form.alternativeName.changeNameDescription') }}
          </v-alert>
          <v-form ref="alternativeNameFrom">
            <v-text-field
                v-model="alternativeNameData.data.username"
                :rules="rules.username"
                variant="outlined"
                density="compact"
                :placeholder="t('account.information.form.alternativeName.placeholder')">
            </v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="alternativeNameModel = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="userAlternativeNameLoading" @click="onChangeAlternativeName">
            {{ t('basic.button.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 修改别名弹窗 E -->

    <!-- 修改密码弹窗 S -->
    <v-dialog max-width="450" v-model="changePasswordModel">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('account.information.form.password.changePasswordName') }}</span>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="changePasswordModel = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert class="mb-4 text-caption" type="info" density="compact" variant="tonal">
            {{ t('account.information.form.password.changePasswordDescription') }}
          </v-alert>
          <v-form ref="passwordFrom">
            <v-text-field
                v-model="passwordFromData.data.oldPassword"
                type="password"
                :rules="passwordFromData.rules.oldPassword"
                :label="t('account.information.form.password.oldPassword')"
                variant="outlined"
                density="compact"
                class="mb-2">
            </v-text-field>
            <v-text-field
                v-model="passwordFromData.data.newPassword"
                type="password"
                :rules="passwordFromData.rules.newPassword"
                :label="t('account.information.form.password.newPassword')"
                variant="outlined"
                density="compact">
            </v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="changePasswordModel = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="changePasswordLoading" @click="onChangePassword">
            {{ t('basic.button.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 修改密码弹窗 E -->

    <!-- 换绑邮箱弹窗 S -->
    <v-dialog max-width="450" v-model="changeEmailModel">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('account.information.form.email.changeName') }}</span>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="changeEmailModel = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert class="mb-4 text-caption" type="info" density="compact" variant="tonal">
            {{ t('account.information.form.email.changeDescription') }}
          </v-alert>
          <v-form ref="emailChangeFrom">
            <v-text-field
                v-model="emailChangeData.data.newEmail"
                :rules="rules.email"
                :label="t('account.information.form.email.newEmail')"
                variant="outlined"
                density="compact"
                class="mb-2">
              <template v-slot:append-inner>
                <v-btn size="x-small" variant="text" color="amber" @click="onChangeEmailRequest" :loading="changeEmailRequestLoading">
                  {{ t('account.information.form.email.sendCode') }}
                </v-btn>
              </template>
            </v-text-field>
            <v-text-field
                v-model="emailChangeData.data.code"
                :rules="rules.code"
                :label="t('account.information.form.email.code')"
                variant="outlined"
                density="compact">
            </v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="changeEmailModel = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="changeEmailLoading" @click="onChangeEmailConfirm">
            {{ t('basic.button.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 换绑邮箱弹窗 E -->
  </div>
</template>

<style scoped lang="less">
</style>
