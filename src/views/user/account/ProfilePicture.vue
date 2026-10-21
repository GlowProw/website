<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import {apis} from "@/assets/sripts";
import {handleApiError} from "@/assets/sripts/error_handler";
import type {AvatarPreset, AvatarQuota} from "@/assets/sripts/api/user_service";
import Cropper from "cropperjs";

import "cropperjs/dist/cropper.css";

import UserAvatar from "@/components/UserAvatar.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {extractPresetId, normalizeAvatarUrl} from "@/assets/sripts/avatar";

const authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n()

type DialogStep = 'select' | 'upload' | 'preset'

let userAccountData = ref<any>({})
const avatarUrl = ref<string>(''),
    presetAvatars = ref<AvatarPreset[]>([]),
    avatarUploading = ref(false),
    avatarSetting = ref(false),
    avatarDeleting = ref(false),
    avatarFileInput = ref<HTMLInputElement | null>(null)

// 弹窗与步骤状态
const dialogOpen = ref(false),
    dialogStep = ref<DialogStep>('select'),
    presetSelected = ref<string>('')

// 头像上传额度（每 3 个月 1 次），为 null 表示尚未加载
const avatarQuota = ref<AvatarQuota | null>(null)
// 无额度时禁用整个「更换头像」入口
const canChangeAvatar = computed(() => avatarQuota.value ? avatarQuota.value.remaining > 0 : true)
// 冷却提示里的日期按本地时区展示
const nextAvailableDateText = computed(() => {
  const iso = avatarQuota.value?.nextAvailableAt
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString()
})

// 裁剪
const croppingImageUrl = ref<string>(''),
    cropperImageRef = ref<HTMLImageElement | null>(null),
    cropperConfirming = ref(false)
let cropperInstance: Cropper | null = null

watch(() => dialogStep.value, (newVal, oldVal) => {
  if (newVal == 'preset' && newVal != oldVal && presetAvatars.value.length <= 0) {
    loadAvatarPresets()
  }
})

onMounted(() => {
  getUserAccount()
  loadAvatarQuota()
})

onBeforeUnmount(() => {
  cleanupCropper()
})

/**
 * 获取当前登录用户的账户数据（含头像）
 */
const getUserAccount = async () => {
  try {
    const result = await apis.userApi().getMe(),
        d = result.data
    userAccountData.value = d.data
    avatarUrl.value = normalizeAvatarUrl(d.data?.userAvatar || '')
  } catch (e) {
    // 兜底：使用本地登录数据
    userAccountData.value = authStore.user || {}
    avatarUrl.value = normalizeAvatarUrl(authStore.user?.userAvatar || '')
  }
}

/**
 * 加载预设头像列表
 */
const loadAvatarPresets = async () => {
  try {
    presetAvatars.value = await apis.userApi().getAvatarPresets()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'ProfilePicture'})
  }
}

/**
 * 加载头像上传额度与冷却状态
 */
const loadAvatarQuota = async () => {
  try {
    avatarQuota.value = await apis.userApi().getAvatarQuota()
  } catch (e) {
    // 额度加载失败不阻塞页面，按钮保持可用由后端兜底拦截
    avatarQuota.value = null
  }
}

/**
 * 头像更新成功后的统一处理
 */
const onAvatarChanged = (url: string) => {
  const normalized = normalizeAvatarUrl(url)

  avatarUrl.value = normalized
  if (userAccountData.value) {
    userAccountData.value.userAvatar = url
    if (!userAccountData.value.attr) userAccountData.value.attr = {}
    userAccountData.value.attr.avatar = url
  }
  authStore.updateAccountAttr({userAvatar: url})

  // 上传/预设都会让后端额度缓存失效，这里同步刷新本地额度
  loadAvatarQuota()
}

/**
 * 当前头像对应的预设 ID，非预设头像时为空串
 */
const currentPresetId = computed<string>(() => {
  const raw = userAccountData.value?.userAvatar || userAccountData.value?.attr?.avatar || ''
  return extractPresetId(raw)
})

/**
 * 打开头像更换弹窗，重置到选方式步骤
 */
const openDialog = () => {
  dialogStep.value = 'select'
  presetSelected.value = ''
  dialogOpen.value = true
}

/**
 * 进入预设头像步骤，并把当前正在使用的预设头像回显为选中态
 */
const onSelectPresetStep = () => {
  presetSelected.value = currentPresetId.value
  dialogStep.value = 'preset'
}

/**
 * 关闭弹窗并清理裁剪资源
 */
const closeDialog = () => {
  dialogOpen.value = false
  cleanupCropper()
}

/**
 * 销毁裁剪器并释放临时 URL
 */
const cleanupCropper = () => {
  if (croppingImageUrl.value) {
    URL.revokeObjectURL(croppingImageUrl.value)
    croppingImageUrl.value = ''
  }
  if (cropperInstance) {
    cropperInstance.destroy()
    cropperInstance = null
  }
}

/**
 * 从"选方式"进入自定义上传，触发文件选择器
 */
const onSelectUpload = () => {
  avatarFileInput.value?.click()
}

/**
 * 选择文件后进入裁剪步骤
 */
const onPickAvatarFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // 重置，便于重复选择同一文件
  target.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    notice.error(t('account.profile-picture.crop.invalidType'))
    return
  }

  cleanupCropper()
  croppingImageUrl.value = URL.createObjectURL(file)
  dialogStep.value = 'upload'

  await nextTick()
  if (cropperImageRef.value) {
    // 头像为正方形，固定 1:1
    cropperInstance = new Cropper(cropperImageRef.value, {
      viewMode: 1,
      aspectRatio: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: false,
      center: false,
      highlight: false,
      cropBoxMovable: false,
      cropBoxResizable: false,
      toggleDragModeOnDblclick: false,
      background: false,
      zoomable: true,
      zoomOnWheel: true,
    })
  }
}

/**
 * 将裁剪结果压缩为 WebP 并转为 File，控制体积在 512KB 以内
 */
const getCroppedFile = (): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!cropperInstance) return reject(new Error('cropper not ready'))

    // 输出 256x256，避免头像占用过多存储
    const canvas = cropperInstance.getCroppedCanvas({
      width: 256,
      height: 256,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    if (!canvas) return reject(new Error('crop failed'))

    // 以 webp 0.85 质量输出
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('crop failed'))
      resolve(new File([blob], 'avatar.webp', {type: 'image/webp'}))
    }, 'image/webp', 0.85)
  })
}

/**
 * 确认裁剪并上传
 */
const onConfirmCrop = async () => {
  try {
    cropperConfirming.value = true
    const file = await getCroppedFile()

    // 超过 512KB，避免无效请求
    const maxBytes = 512 * 1024

    if (file.size > maxBytes) {
      notice.error(t('account.profile-picture.crop.tooLarge'))
      return
    }

    avatarUploading.value = true
    const result = await apis.userApi().uploadAvatar(file)

    onAvatarChanged(result.url)

    notice.success(t('basic.tips.avatar.upload.ok'), {mode: 'minimal'})

    closeDialog()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'ProfilePicture'})
  } finally {
    cropperConfirming.value = false
    avatarUploading.value = false
  }
}

/**
 * 确认应用选中的预设头像
 */
const onConfirmPreset = async () => {
  if (!presetSelected.value) return
  try {
    avatarSetting.value = true

    const result = await apis.userApi().setPresetAvatar(presetSelected.value)
    onAvatarChanged(result.url)

    notice.success(t('basic.tips.avatar.preset.ok'), {mode: 'minimal'})

    closeDialog()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'ProfilePicture'})
  } finally {
    avatarSetting.value = false
  }
}

/**
 * 判断当前是否具备自定义头像（用于控制删除按钮状态）
 */
const hasCustomAvatar = computed(() => {
  const customAttr = userAccountData.value?.attr?.avatar || (authStore.user as any)?.attr?.avatar
  const current = avatarUrl.value
  return Boolean(customAttr || (current && !current.includes('gravatar.com') && !current.includes('gravatar.loli.net') && !current.includes('v2ex.com') && !current.includes('sep.cc')))
})

/**
 * 删除头像（恢复为系统默认头像或 Gravatar）
 */
const handleDeleteAvatar = async () => {
  if (!window.confirm(t('account.profile-picture.deleteConfirm'))) return
  avatarDeleting.value = true
  try {
    const res = await apis.userApi().deleteAvatar()
    const nextUrl = res?.url || ''
    avatarUrl.value = normalizeAvatarUrl(nextUrl)
    if (userAccountData.value) {
      userAccountData.value.userAvatar = nextUrl
      if (userAccountData.value.attr) {
        userAccountData.value.attr.avatar = ''
      }
    }
    if ((authStore.user as any)?.attr) {
      (authStore.user as any).attr.avatar = ''
    }
    authStore.updateAccountAttr({userAvatar: nextUrl, attr: userAccountData.value?.attr || {}})
    notice.success(t('account.profile-picture.deleteSuccess'))
    await Promise.all([getUserAccount(), loadAvatarQuota()])
  } catch (e) {
    handleApiError(e, notice, t, {component: 'ProfilePicture'})
  } finally {
    avatarDeleting.value = false
  }
}

defineOptions({
  name: 'AccountProfilePicture'
})
</script>

<template>
  <div>
    <v-row>
      <!-- 当前头像 + 操作入口 S -->
      <v-col cols="12" lg="5">
        <AffixBoxHasTitleView>
          <v-row class="mb-2">
            <v-col cols="auto" style="min-width: 160px;">
              <div class="d-flex justify-center mb-2">
                <v-card border class="pa-1 d-inline-flex">
                  <UserAvatar v-if="avatarUrl" :src="avatarUrl" :size="160"/>
                  <v-avatar v-else :size="160" rounded="lg">
                    <v-icon icon="mdi-account" size="64" class="opacity-40"/>
                  </v-avatar>
                </v-card>
              </div>

              <div class="d-flex ga-2">
                <v-btn-group density="compact">
                  <v-tooltip :disabled="canChangeAvatar" location="bottom">
                    <template v-slot:activator="{props}">
                      <v-btn
                          v-bind="props"
                          variant="tonal"
                          :disabled="!canChangeAvatar"
                          @click="openDialog">
                        {{ t('account.profile-picture.changeBtn') }}
                      </v-btn>
                    </template>
                    <span v-if="avatarQuota && nextAvailableDateText">
                      {{ t('account.profile-picture.quota.cooldownTip', {date: nextAvailableDateText}) }}
                    </span>
                    <span v-else>{{ t('account.profile-picture.quota.empty') }}</span>
                  </v-tooltip>
                  <v-btn
                      variant="tonal"
                      color="error"
                      :title="t('account.profile-picture.deleteBtn')"
                      :disabled="!hasCustomAvatar || avatarDeleting"
                      :loading="avatarDeleting"
                      @click="handleDeleteAvatar">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-btn-group>
              </div>
            </v-col>

            <v-col>
              <p class="text-caption opacity-60 mb-4">
                {{ t('account.profile-picture.description') }}
              </p>

              <!-- 上传额度 S -->
              <div class="mt-3 d-flex flex-column ga-1"
                   :class="canChangeAvatar ? 'quota-box' : 'quota-box quota-box--empty'">
                <div class="d-flex align-center ga-2">
                  <v-icon :icon="canChangeAvatar ? 'mdi-speedometer' : 'mdi-timer-lock-outline'"
                          :color="canChangeAvatar ? 'amber' : 'error'"
                          size="16"/>
                  <span class="text-caption font-weight-bold">
                    {{ t('account.profile-picture.quota.title') }}
                  </span>
                  <v-spacer/>
                  <v-chip size="x-small" :color="canChangeAvatar ? 'amber' : 'error'" variant="tonal">
                    {{
                      avatarQuota
                          ? t('account.profile-picture.quota.badge', {remaining: avatarQuota.remaining, total: avatarQuota.total})
                          : '—'
                    }}
                  </v-chip>
                </div>
                <div class="text-caption opacity-70">
                  <template v-if="canChangeAvatar">
                    {{ t('account.profile-picture.quota.ruleTip') }}
                  </template>
                  <template v-else-if="nextAvailableDateText">
                    {{ t('account.profile-picture.quota.cooldownTip', {date: nextAvailableDateText}) }}
                  </template>
                  <template v-else>
                    {{ t('account.profile-picture.quota.empty') }}
                  </template>
                </div>
              </div>
              <!-- 上传额度 E -->

              <v-alert
                  v-if="userAccountData?.email"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="text-caption mt-2">
                {{ t('account.profile-picture.associatedEmailNotification', {email: userAccountData.email}) }}
              </v-alert>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.profile-picture.uploadTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 当前头像 + 操作入口 E -->

      <!-- 多尺寸预览 S -->
      <v-col cols="12" lg="7">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-4">
            {{ t('account.profile-picture.previewDesc') }}
          </p>

          <v-row align="end" class="ga-3">
            <v-col cols="auto" v-for="size in [160, 120, 100 ,99 , 80, 56, 40, 28]" :key="size">
              <div class="text-center">
                <v-card border class="pa-1 d-inline-block mb-2">
                  <UserAvatar :src="avatarUrl" v-if="avatarUrl" :size="size"/>
                  <v-avatar v-else :size="size">
                    <v-icon icon="mdi-account" :size="size * 0.7" class="opacity-60"/>
                  </v-avatar>
                </v-card>
                <div class="text-caption opacity-50 font-weight-bold">{{ size }}px</div>
              </div>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('account.profile-picture.previewTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 多尺寸预览 E -->
    </v-row>

    <!-- 隐藏文件输入 -->
    <input
        ref="avatarFileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="d-none"
        @change="onPickAvatarFile">

    <!-- 统一头像弹窗 S -->
    <v-dialog
        v-model="dialogOpen"
        max-width="500"
        scrollable
        :persistent="dialogStep === 'upload'"
        @update:model-value="(v) => !v && closeDialog()">

      <!-- 步骤：选择方式 S -->
      <v-card border v-if="dialogStep === 'select'">
        <v-card-title class="py-8 text-center bg-black">
          <v-icon size="64">mdi-account-circle-outline</v-icon>
        </v-card-title>

        <v-card-title class="pa-5 pb-2 d-flex align-center ga-2">
          {{ t('account.profile-picture.dialog.title') }}
        </v-card-title>
        <v-card-subtitle class="px-5 pb-4 opacity-60">
          {{ t('account.profile-picture.dialog.subtitle') }}
        </v-card-subtitle>

        <v-card-text class="pa-5 pt-0">
          <div class="d-flex flex-column ga-3">

            <!-- 自定义上传 -->
            <v-card
                variant="tonal"
                color="primary"
                class="select-option pa-4 cursor-pointer"
                rounded="lg"
                @click="onSelectUpload">
              <div class="d-flex align-center ga-4">
                <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
                  <v-icon icon="mdi-upload" size="22"/>
                </v-avatar>
                <div>
                  <div class="text-body-2 font-weight-bold">
                    {{ t('account.profile-picture.dialog.option.upload.title') }}
                  </div>
                  <div class="text-caption opacity-70">
                    {{ t('account.profile-picture.dialog.option.upload.desc') }}
                  </div>
                </div>
                <v-spacer/>
                <v-icon icon="mdi-chevron-right" class="opacity-40"/>
              </div>
            </v-card>

            <!-- 预设头像 -->
            <v-card
                variant="tonal"
                class="select-option pa-4 cursor-pointer"
                rounded="lg"
                @click="onSelectPresetStep">
              <div class="d-flex align-center ga-4">
                <v-avatar color="" variant="tonal" size="44" rounded="lg">
                  <v-icon icon="mdi-view-grid-outline" size="22"/>
                </v-avatar>
                <div>
                  <div class="text-body-2 font-weight-bold">
                    {{ t('account.profile-picture.dialog.option.preset.title') }}
                  </div>
                  <div class="text-caption opacity-70">
                    {{ t('account.profile-picture.dialog.option.preset.desc') }}
                  </div>
                </div>
                <v-spacer/>
                <v-icon icon="mdi-chevron-right" class="opacity-40"/>
              </div>
            </v-card>

            <!-- 选项 3：Gravatar -->
            <v-card
                variant="tonal"
                class="select-option pa-4 cursor-pointer"
                rounded="lg">
              <div class="d-flex align-center ga-4">
                <v-avatar variant="tonal" size="44" rounded="lg">
                  <v-icon icon="mdi-earth" size="22"/>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">Gravatar</div>
                  <div class="text-caption opacity-70">
                    {{ t('account.profile-picture.dialog.option.gravatar.desc') }}
                  </div>
                </div>
                <v-btn
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-open-in-new"
                    href="https://gravatar.com/connect/"
                    target="_blank">
                  {{ t('account.profile-picture.goToGravatar') }}
                </v-btn>
              </div>
            </v-card>

          </div>
        </v-card-text>

        <v-card-actions class="pa-5 pt-0">
          <v-btn variant="text" @click="closeDialog">{{ t('basic.button.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
      <!-- 步骤：选择方式 E -->

      <!-- 步骤：裁剪上传 S -->
      <v-card border v-else-if="dialogStep === 'upload'">
        <v-card-title class="py-8 text-center bg-black">
          <v-icon size="64">mdi-account-circle-outline</v-icon>
        </v-card-title>

        <v-card-title class="pa-4 pb-3 d-flex align-center ga-2">
          {{ t('account.profile-picture.crop.title') }}
        </v-card-title>

        <v-card-text class="pa-0">
          <div class="crop-canvas-wrap">
            <img
                ref="cropperImageRef"
                :src="croppingImageUrl"
                alt="crop"
                class="d-block w-100">
          </div>
        </v-card-text>

        <v-divider/>

        <v-card-actions class="pa-4">
          <div class="text-caption opacity-50 d-flex align-center ga-1">
            <v-icon icon="mdi-gesture-pinch" size="14"/>
            {{ t('account.profile-picture.crop.zoomTip') }}
          </div>
          <v-spacer/>
          <v-btn
              variant="text"
              :disabled="cropperConfirming || avatarUploading"
              @click="dialogStep = 'select'; cleanupCropper()">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              color="amber"
              variant="tonal"
              :loading="cropperConfirming || avatarUploading"
              @click="onConfirmCrop">
            {{ t('account.profile-picture.crop.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <!-- 步骤：裁剪上传 E -->

      <!-- 步骤：预设选择 S -->
      <v-card border v-else-if="dialogStep === 'preset'">
        <v-card-title class="py-8 text-center bg-black">
          <v-icon size="64">mdi-account-circle-outline</v-icon>
        </v-card-title>

        <v-card-title class="pa-5 pb-2 d-flex align-center ga-2">
          {{ t('account.profile-picture.presetTitle') }}
        </v-card-title>
        <v-card-subtitle class="pb-3 px-5 opacity-60">
          {{ t('account.profile-picture.presetDesc') }}
        </v-card-subtitle>

        <v-card-text class="px-4 py-5 pt-2">
          <v-row class="preset-grid" density="compact">
            <v-col
                v-for="item in presetAvatars"
                :key="item.id || item.path"
                class="preset-item"
                :class="{'preset-item--active': presetSelected === (item.id || item.path)}"
                @click="presetSelected = (item.id || item.path)">
              <v-avatar size="80">
                <v-img :src="normalizeAvatarUrl(item.path)" :alt="item.name"/>
              </v-avatar>

              <div class="d-flex justify-center mt-2">
                <v-icon
                    v-if="presetSelected === (item.id || item.path)"
                    icon="mdi-check-circle"
                    color="amber"
                    class="preset-item__check"/>
                <v-icon
                    v-else
                    icon="mdi-check-circle-outline"
                    class="preset-item__check opacity-60"/>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider/>

        <v-card-actions class="pa-4">
          <v-btn variant="text" :disabled="avatarSetting" @click="dialogStep = 'select'">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-spacer/>
          <v-btn
              color="amber"
              variant="tonal"
              :disabled="!presetSelected"
              :loading="avatarSetting"
              @click="onConfirmPreset">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <!-- 步骤：预设选择 E -->

    </v-dialog>
    <!-- 统一头像弹窗 E -->
  </div>
</template>

<style scoped lang="less">
.select-option {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.crop-canvas-wrap {
  max-height: 52vh;
  overflow: hidden;
  background: #111;

  img {
    display: block;
    max-width: 100%;
  }
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
}

.preset-item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;

  img {
    display: block;
    width: 72px;
    height: 72px;
    object-fit: cover;
  }
}

.preset-preview {
  background: rgba(var(--v-theme-primary), 0.06);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
</style>
