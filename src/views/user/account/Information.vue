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
    userApi = useUserApi(),
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
    const result = await userApi.getMe(),
        d = result.data

    userAccountData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  }
}

/**
 * 修改账户密码
 */
const onChangePassword = async () => {
  try {
    const {valid} = await passwordFrom.value.validate();
    if (!valid) return;

    changePasswordLoading.value = true;

    const result = await userApi.changePassword(passwordFromData.value.data);

    authStore.logout();
    await router.push({name: 'AccountInformation'});

    notice.success(t(`basic.tips.${result.code}`));
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  } finally {
    changePasswordLoading.value = false;
    changePasswordModel.value = false;
    onClearPasswordFrom();
  }
}

/**
 * 保存账户
 */
const onSaveAccountAttr = async () => {
  try {
    const {valid} = await form.value.validate();
    if (!valid)
      return

    userAccountAttrLoading.value = true

    const {attr} = userAccountData.value;

    if (attr.language)
      attr.language = attr.language.value;

    const result = await userApi.updateMeAttr(attr)

    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
  } finally {
    userAccountAttrLoading.value = false
  }
}

/**
 * 修改账户别名
 */
const onChangeAlternativeName = async () => {
  try {
    const {valid} = await alternativeNameFrom.value.validate();
    if (!valid) return

    userAlternativeNameLoading.value = true

    const result = await userApi.changeAlternativeName(alternativeNameData.value.data.username);

    authStore.updateAccountAttr({alternativeName: alternativeNameData.value.data.username})
    userAccountData.value.alternativeName = alternativeNameData.value.data.username

    notice.success(t(`basic.tips.${result.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }));
    }
    console.error(e);
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

          <v-dialog max-width="1024" v-model="alternativeNameModel">
            <v-card>
              <v-card-title>
                {{ t('account.information.form.alternativeName.changeName') }}
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-5" type="warning" density="comfortable" variant="tonal">
                  {{ t('account.information.form.alternativeName.changeNameDescription') }}
                </v-alert>

                <p class="text-caption text-grey opacity-80">
                  {{ t('signup.alternativeName.hint') }}
                </p>

                <v-form ref="alternativeNameFrom">
                  <v-text-field v-model="alternativeNameData.data.username"
                                :rules="rules.username"
                                placeholder="输入新用户名称">
                  </v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="onChangeAlternativeName" :loading="userAlternativeNameLoading">
                  {{ t('basic.button.save') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>账户唯一标识</b>
          <p class="text-caption text-grey opacity-80">这是唯一标识，由系统分配</p>
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
          <b>邮箱</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.email || ''"
                        placeholder="账户邮箱"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>语种</b>
          <p class="text-caption text-grey opacity-80">设置账户偏向语种</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-combobox v-model="userAccountData.attr.language"
                      item-title="label"
                      item-value="value"
                      placeholder="选择语种"
                      :items="userAttrLanguages"></v-combobox>
        </v-col>
      </v-row>

      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>描述</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-card class="pa-2">
          <Textarea v-model="userAccountData.attr.introduction"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                    placeholder="自我介绍一下:D"
                    maxLength="2"></Textarea>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="mt-5 mb-5"></v-divider>

      <v-row>
        <v-col cols="12" sm="12" :lg="4">
          <b>密码</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field value="******"
                        variant="underlined"
                        density="compact"
                        readonly>
            <template v-slot:append-inner>
              <v-btn class="mb-2" density="compact" @click="changePasswordModel = true">修改</v-btn>
            </template>
          </v-text-field>

          <v-dialog max-width="1024" v-model="changePasswordModel">
            <v-card>
              <v-card-title>
                修改密码
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-5" type="warning" density="comfortable" variant="tonal">
                  此操作会在成功后推出登陆，需要重新登陆账号
                </v-alert>

                <v-form ref="passwordFrom">
                  <v-text-field v-model="passwordFromData.data.oldPassword"
                                :rules="passwordFromData.rules.oldPassword"
                                placeholder="输入旧密码">
                  </v-text-field>
                  <v-text-field v-model="passwordFromData.data.newPassword"
                                :rules="passwordFromData.rules.newPassword"
                                placeholder="输入新密码">
                  </v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="onChangePassword" :loading="changePasswordLoading">
                  {{ t('basic.button.save') }}
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
