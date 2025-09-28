<script setup lang="ts">

import {useAuthStore} from "~/stores/userAccountStore";
import {computed, onMounted, Ref, ref} from "vue";
import {useHttpToken} from "@/assets/sripts/http_util";
import {api} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import PrivilegesTagWidget from "@/components/PrivilegesTagWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import {useRoute, useRouter} from "vue-router";
import Textarea from "@/components/textarea"

import languages from "@/../public/config/languages.json"

const authStore = useAuthStore(),
    httpToken = useHttpToken(),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n()

let
    form = ref(null),
    userAccountData = ref({
      attr: {
        language: '',
        introduction: ''
      }
    }),
    userAlternativeNameLoading = ref(false),
    userAccountAttrLoading = ref(false),

    messages = ref([]),

    alternativeNameModel = ref(false),
    alternativeNameFrom: Ref<H> = ref(null),
    alternativeNameData = ref({
      rules: {
        username: [
          v => !!v || '必须填写用户名称',
          v => (v && v.length >= 6 && v.length <= 40) || '长度6-40',
        ],
      },
      data: {
        username: '',
      }
    }),

    changePasswordModel = ref(false),
    changePasswordLoading = ref(false),
    passwordFrom: Ref<H> = ref(null),
    passwordFromData = ref({
      rules: {
        oldPassword: [
          v => !!v || '必须填写旧密码',
          v => (v && v.length >= 6 && v.length <= 40) || '长度6-40',
        ],
        newPassword: [
          v => !!v || '必须填写新密码',
          v => (v && v.length >= 6 && v.length <= 40) || '长度6-40',
        ]
      },
      data: {
        oldPassword: '',
        newPassword: '',
      }
    }),

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
  userAccountData.value = authStore.user;

  if (userAccountData.value.attr.language) {
    let defaultLanguage = languages.child[languages.default],
        language = languages.child.filter(i => i.value == userAccountData.value.attr.language)[0];
    userAccountData.value.attr.language = language ? language : defaultLanguage
  }
}

/**
 * 修改账户密码
 */
const onChangePassword = async () => {
  try {
    const {valid} = await passwordFrom.value.validate();
    if (!valid)
      return

    changePasswordLoading.value = true

    const result = await httpToken.post(api["user_changePassword"], {
          data: passwordFromData.value.data
        }),
        d = result.itemData;

    if (d.error == 1)
      return Error(d)

    messages.value.push(t(`basic.tips.${d.code}`))
    authStore.logout()
    await router.push({name: 'AccountInformation'})
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.itemData.code}`, {
        context: e.response.itemData.code
      }))
  } finally {
    changePasswordLoading.value = false
    changePasswordModel.value = false

    onClearPasswordFrom()
  }
}

/**
 * 擦除变动密码表单数据
 */
const onClearPasswordFrom = () => {
  passwordFromData.value.data.newPassword = ''
  passwordFromData.value.data.oldPassword = ''
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

    let attr = userAccountData.value.attr;

    if (attr.language)
      attr.language = attr.language.value;

    const result = await httpToken.post(api["user_me"], {
          data: {
            attr
          }
        }),
        d = result.itemData;

    if (d.error == 1)
      return Error(d)

    messages.value.push(t(`basic.tips.${d.code}`))
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.itemData.code}`, {
        context: e.response.itemData.code
      }))
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
    if (!valid)
      return

    userAlternativeNameLoading.value = true

    const result = await httpToken.post(api["user_changeAlternativeName"], {
          data: alternativeNameData.value.data
        }),
        d = result.itemData;

    if (d.error == 1)
      return Error(d)

    authStore.updateAccountAttr({
      alternativeName: alternativeNameData.value.data.username
    })
    userAccountData.value.alternativeName = alternativeNameData.value.data.username
    messages.value.push(t(`basic.tips.${d.code}`))
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.itemData.code}`, {
        context: e.response.itemData.code
      }))
  } finally {
    alternativeNameData.value.data.username = ''
    userAlternativeNameLoading.value = false
    alternativeNameModel.value = false
  }
}
</script>

<template>
  <div>
    <div class="font-weight-bold text-h5 mb-10">账户基本信息</div>

    <v-form ref="form">
      <v-row class="mb-6" no-gutters>
        <v-col cols="12" sm="12" :lg="4">
          <b>账户登陆id</b>
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
          <b>账户别名</b>
          <p class="text-caption text-grey opacity-80">展示名称</p>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <v-text-field :value="userAccountData.alternativeName || userAccountData.username"
                        variant="underlined"
                        density="compact"
                        hide-details
                        readonly>
            <template v-slot:append-inner>
              <v-btn class="mb-2" density="compact" @click="alternativeNameModel = true">修改</v-btn>
            </template>
          </v-text-field>

          <v-dialog max-width="1024" v-model="alternativeNameModel">
            <v-card>
              <v-card-title>
                修改别名
              </v-card-title>
              <v-card-text>
                <v-alert class="mb-5" type="warning" density="comfortable" variant="tonal">
                  设置新的名称，展示你独特名字
                </v-alert>

                <v-form ref="alternativeNameFrom">
                  <v-text-field v-model="alternativeNameData.data.username"
                                :rules="alternativeNameData.rules.username"
                                placeholder="输入新用户名称">
                  </v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="onChangeAlternativeName" :loading="userAlternativeNameLoading">确定</v-btn>
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
                <v-btn @click="onChangePassword" :loading="changePasswordLoading">确定</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>

      <v-divider class="mt-5 mb-5"></v-divider>

      <v-row>
        <v-col cols="12" sm="12" :lg="4">
          <b>身份</b>
        </v-col>
        <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="8">
          <PrivilegesTagWidget :data="userAccountData.privilege"/>
        </v-col>
      </v-row>
    </v-form>

    <v-row class="pa-3 mt-10">
      <v-btn color="var(--main-color)" :loading="userAccountAttrLoading" @click="onSaveAccountAttr">
        保存
      </v-btn>
    </v-row>
  </div>

  <v-snackbar-queue v-model="messages"/>
</template>

<style scoped lang="less">

</style>
