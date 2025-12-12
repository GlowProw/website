<script setup lang="ts">

import {useAuthStore} from "~/stores/userAccountStore";
import {computed, onMounted, Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useNoticeStore} from "~/stores/noticeStore";

import PrivilegesTagWidget from "@/components/PrivilegesTagWidget.vue";
import Textarea from "@/components/textarea"
import UserAvatar from "@/components/UserAvatar.vue";

import languages from "@/../public/config/languages.json"
import {useUserApi} from "@/assets/sripts/api";
import {ApiError} from "@/assets/types/Api";
import {useRules} from "@/assets/sripts/rules_user";

const authStore = useAuthStore(),
    notice = useNoticeStore(),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    api = useUserApi(),
    rules = useRules()

let
    form = ref(null),
    userAccountData: Ref<any> = ref({
      privilege: [],
      attr: {
        language: '',
        introduction: ''
      }
    }),
    userAlternativeNameLoading = ref(false),
    userAccountAttrLoading = ref(false),

    // 别名
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

    // 获取语言列表
    userAttrLanguages = computed(() => {
      return languages.child
    })

onMounted(() => {
  getUserAccount()
})

/**
 * 获取账户信息
 */
const getUserAccount = async () => {
  try {
    const result = await api.getMe(),
        d = result.data

    userAccountData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  }
}

/**
 * 修改账户密码
 */
const onChangePassword = async () => {
  try {
    const {valid} = await passwordFrom.value.validate()
    if (!valid) return;

    changePasswordLoading.value = true;

    const result = await api.changePassword(passwordFromData.value.data)

    authStore.logout()
    await router.push({name: 'AccountInformation'})

    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    changePasswordLoading.value = false;
    changePasswordModel.value = false;
    onClearPasswordFrom()
  }
}

/**
 * 保存账户
 */
const onSaveAccountAttr = async () => {
  try {
    const {valid} = await form.value.validate()
    if (!valid)
      return

    userAccountAttrLoading.value = true

    const {attr} = userAccountData.value;

    if (attr.language)
      attr.language = attr.language.value;

    const result = await api.updateMeAttr(attr)

    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    userAccountAttrLoading.value = false
  }
}

/**
 * 修改账户别名
 */
const onChangeAlternativeName = async () => {
  try {
    const {valid} = await alternativeNameFrom.value.validate()
    if (!valid) return

    userAlternativeNameLoading.value = true

    const result = await api.changeAlternativeName(alternativeNameData.value.data.username)

    authStore.updateAccountAttr({alternativeName: alternativeNameData.value.data.username})
    userAccountData.value.alternativeName = alternativeNameData.value.data.username

    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    alternativeNameData.value.data.username = ''
    userAlternativeNameLoading.value = false
    alternativeNameModel.value = false
  }
}

/**
 * 擦除变动密码表单数据
 */
const onClearPasswordFrom = () => {
  passwordFromData.value.data.newPassword = ''
  passwordFromData.value.data.oldPassword = ''
}
</script>

<template>
  <div>
    <div class="font-weight-bold text-h5 mb-10">{{ t('account.information.title') }}</div>

    <v-form ref="form">
      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{ t('account.information.form.username.name') }}</b>
        </v-col>
        <v-col cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.username"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
            <template v-slot:prepend>
              <v-card>
                <UserAvatar size="30" :src="userAccountData.userAvatar"></UserAvatar>
              </v-card>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{ t('account.information.form.alternativeName.name')}} </b>
          <p class="text-caption text-grey opacity-80">{{ t('account.information.form.alternativeName.description') }}</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.alternativeName || userAccountData.username"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
            <template v-slot:append-inner>
              <v-btn class="mb-2" density="compact" @click="alternativeNameModel = true">
                {{ t('basic.button.change') }}
              </v-btn>
            </template>
          </v-text-field>

          <v-dialog max-width="500" v-model="alternativeNameModel">
            <v-card border>
              <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n1">
                <v-icon size="80">mdi-form-textbox</v-icon>
                <p class="mt-3">{{ t('account.information.form.alternativeName.changeName') }}</p>
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-5" type="warning" density="comfortable" variant="tonal">
                  {{ t('account.information.form.alternativeName.changeNameDescription') }}
                </v-alert>

                <v-form ref="alternativeNameFrom">
                  <v-text-field v-model="alternativeNameData.data.username"
                                :rules="rules.username"
                                :placeholder="t('account.information.form.alternativeName.placeholder')">
                  </v-text-field>
                  <p class="text-caption text-grey opacity-80">
                    {{ t('signup.alternativeName.hint') }}
                  </p>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="var(--main-color)" @click="onChangeAlternativeName" :loading="userAlternativeNameLoading">
                  {{ t('basic.button.save') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{t('account.information.form.uuid.name')}}</b>
          <p class="text-caption text-grey opacity-80">{{ t('account.information.form.uuid.description') }}</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.id"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{ t('account.information.form.email.name')}}</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.email || ''"
                        :placeholder="t('account.information.form.email.placeholder')"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{t('account.information.form.language.name')}}</b>
          <p class="text-caption text-grey opacity-80">{{t('account.information.form.language.description')}}</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-combobox v-model="userAccountData.attr.language"
                      item-title="label"
                      item-value="value"
                      :placeholder="t('account.information.form.language.placeholder')"
                      :items="userAttrLanguages"></v-combobox>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{ t('account.information.form.language.name')}}</b>
          <p class="text-caption text-grey opacity-80">{{t('account.information.form.language.description')}}</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-card class="pa-2">
          <Textarea v-model="userAccountData.attr.introduction"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                    :placeholder="t('account.information.form.language.description')"
                    maxLength="2"></Textarea>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="mt-5 mb-5"></v-divider>

      <v-row>
        <v-col cols="12" sm="12" :lg="4">
          <b>{{ t('account.information.form.password.name')}}</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field value="******"
                        variant="underlined"
                        density="compact"
                        readonly>
            <template v-slot:append-inner>
              <v-btn class="mb-2" density="compact" @click="changePasswordModel = true">
                {{ t('basic.button.change') }}
              </v-btn>
            </template>
          </v-text-field>

          <v-dialog max-width="500" v-model="changePasswordModel">
            <v-card border>
              <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n1">
                <v-icon size="80">mdi-lock-reset</v-icon>
                <p class="mt-3">{{ t('account.information.form.password.changePasswordName') }}</p>
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-5" type="warning" density="comfortable" variant="tonal">
                  {{ t('account.information.form.password.changePasswordDescription') }}
                </v-alert>

                <v-form ref="passwordFrom">
                  <v-text-field v-model="passwordFromData.data.oldPassword"
                                :rules="passwordFromData.rules.oldPassword"
                                :placeholder="t('account.information.form.password.oldPasswordPlaceholder')">
                  </v-text-field>
                  <v-text-field v-model="passwordFromData.data.newPassword"
                                :rules="passwordFromData.rules.newPassword"
                                :placeholder="t('account.information.form.password.newPasswordPlaceholder')">
                  </v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="onChangePassword" :loading="changePasswordLoading">
                  {{ t('basic.button.change') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>

      <v-divider class="mt-5 mb-5"></v-divider>

      <v-row>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <PrivilegesTagWidget :data="userAccountData.privilege"/>
        </v-col>
      </v-row>
    </v-form>

    <v-row class="pa-3 mt-10">
      <v-btn color="var(--main-color)" :loading="userAccountAttrLoading" @click="onSaveAccountAttr">
        {{ t('basic.button.save') }}
      </v-btn>
    </v-row>
  </div>
</template>

<style scoped lang="less">

</style>
