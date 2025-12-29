<template>
  <v-container>
    <!-- 头部 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">权限管理</span>
            <v-btn
                color="primary"
                @click="savePrivileges"
                :loading="loading"
                :disabled="loading"
            >
              <v-icon left>mdi-content-save</v-icon>
              保存权限
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            当前用户：{{ currentUser.username }} (ID: {{ currentUser.id }})
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- 用户搜索 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-text-field
                    v-model="searchUserId"
                    label="用户ID"
                    placeholder="输入用户ID进行搜索"
                    hide-details
                    outlined
                    dense
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                    v-model="searchUsername"
                    label="用户名"
                    placeholder="输入用户名进行搜索"
                    hide-details
                    outlined
                    dense
                />
              </v-col>
              <v-col cols="12" md="4">
                <div class="d-flex">
                  <v-btn
                      color="primary"
                      @click="searchUser"
                      :loading="searchLoading"
                      class="mr-2"
                  >
                    <v-icon left>mdi-magnify</v-icon>
                    搜索用户
                  </v-btn>
                  <v-btn
                      color="secondary"
                      @click="clearSearch"
                  >
                    清空
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 权限列表 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="text-h6">权限列表</span>
            <v-spacer />
            <v-btn
                color="primary"
                outlined
                small
                @click="selectAll"
            >
              全选
            </v-btn>
            <v-btn
                color="secondary"
                outlined
                small
                @click="deselectAll"
                class="ml-2"
            >
              全不选
            </v-btn>
          </v-card-title>
          <v-divider />

          <v-card-text>
            <!-- 加载状态 -->
            <v-row v-if="loading" class="my-8">
              <v-col cols="12" class="text-center">
                <v-progress-circular
                    indeterminate
                    color="primary"
                />
                <div class="mt-2">加载权限中...</div>
              </v-col>
            </v-row>

            <!-- 权限树 -->
            <div v-else>
              {{ privilegesList }}
              <div v-for="category in privilegesList" :key="category.title">
                <!-- 分类标题 -->
                <v-list-item class="pl-0">
                  <v-list-item-content>
                    <v-list-item-title class="text-subtitle-1 font-weight-bold">
                      {{ getCategoryTitle(category.title) }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <!-- 权限项 -->
                <div v-for="(child, privilegeName) in category"
                     :key="privilegeName"
                     v-if="privilegeName !== 'title' && privilegeName !== 'child'"
                >
                  <!-- 父权限 -->
                  <v-list-item class="pl-4">
                    <v-list-item-action>
                      <v-checkbox
                          v-model="selectedPrivileges"
                          :value="privilegeName"
                          @change="onParentPrivilegeChange(privilegeName, $event)"
                          hide-details
                      />
                    </v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ getPrivilegeName(privilegeName) }}
                        <v-chip
                            v-if="isPrivilegeExpiring(privilegeName)"
                            small
                            color="warning"
                            class="ml-2"
                        >
                          即将过期
                        </v-chip>
                        <v-chip
                            v-if="isPrivilegeExpired(privilegeName)"
                            small
                            color="error"
                            class="ml-2"
                        >
                          已过期
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        权限代码：{{ privilegeName }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-btn
                          icon
                          small
                          @click="toggleChildPrivileges(privilegeName)"
                      >
                        <v-icon>
                          {{ showChildPrivileges[privilegeName] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                        </v-icon>
                      </v-btn>
                    </v-list-item-action>
                  </v-list-item>

                  <!-- 子权限（可展开） -->
                  <v-expand-transition>
                    <div v-show="showChildPrivileges[privilegeName]">
                      <v-list-item
                          v-for="(subChild, subPrivilegeName) in child.child"
                          :key="subPrivilegeName"
                          class="pl-12"
                      >
                        <v-list-item-action>
                          <v-checkbox
                              v-model="selectedPrivileges"
                              :value="subPrivilegeName"
                              @change="onChildPrivilegeChange(privilegeName, subPrivilegeName, $event)"
                              :disabled="selectedPrivileges.includes(privilegeName)"
                              hide-details
                          />
                        </v-list-item-action>
                        <v-list-item-content>
                          <v-list-item-title>
                            {{ getPrivilegeName(subPrivilegeName) }}
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            权限代码：{{ subPrivilegeName }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    </div>
                  </v-expand-transition>

                  <v-divider class="my-2" />
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="privilegesList.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey">mdi-shield-off-outline</v-icon>
                <div class="text-h6 mt-4">暂无权限配置</div>
                <div class="text-body-1 mt-2">请联系管理员配置权限</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 批量操作 -->
    <v-row v-if="selectedPrivileges.length > 0" class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-information</v-icon>
              <span>已选择 {{ selectedPrivileges.length }} 个权限</span>
              <v-spacer />
              <v-btn
                  color="primary"
                  @click="batchGrant"
                  :loading="batchLoading"
                  class="mr-2"
                  small
              >
                批量授予
              </v-btn>
              <v-btn
                  color="error"
                  @click="batchRevoke"
                  :loading="batchLoading"
                  small
              >
                批量吊销
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 当前用户的权限 -->
    <v-row v-if="currentUserPrivileges.length > 0" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="text-h6">当前拥有的权限</span>
          </v-card-title>
          <v-card-text>
            <v-chip
                v-for="privilege in currentUserPrivileges"
                :key="privilege.privilegeType"
                class="ma-1"
                :color="getPrivilegeColor(privilege)"
            >
              {{ getPrivilegeName(privilege.privilegeType) }}
              <v-icon right small v-if="privilege.expiryTime">
                mdi-clock-outline
              </v-icon>
              <v-tooltip bottom v-if="privilege.expiryTime">
                <template v-slot:activator="{ on }">
                  <span v-on="on">{{ formatDate(privilege.expiryTime) }}</span>
                </template>
                <span>过期时间</span>
              </v-tooltip>
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 操作确认对话框 -->
    <v-dialog v-model="confirmDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          {{ dialogTitle }}
        </v-card-title>
        <v-card-text>
          {{ dialogMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="confirmDialog = false">
            取消
          </v-btn>
          <v-btn color="primary" text @click="confirmAction">
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {useNoticeStore} from "~/stores/noticeStore";
import {apis} from "@/assets/sripts/index";

// API
const privilegeApi = apis.privilegeApi()
const notice = useNoticeStore()

// 数据
const privilegesList = ref<any[]>([])
const selectedPrivileges = ref<string[]>([])
const currentUser = ref<any>({ id: '', username: '' })
const currentUserPrivileges = ref<any[]>([])
const loading = ref(false)
const searchLoading = ref(false)
const batchLoading = ref(false)

// 搜索相关
const searchUserId = ref('')
const searchUsername = ref('')

// 展开状态
const showChildPrivileges = ref<Record<string, boolean>>({})

// 确认对话框
const confirmDialog = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const pendingAction = ref<() => Promise<void>>()

// 计算属性
const allPrivilegeNames = computed(() => {
  const names: string[] = []
  privilegesList.value.forEach(category => {
    Object.keys(category).forEach(key => {
      if (key !== 'title' && key !== 'child') {
        names.push(key)
        if (category[key]?.child) {
          names.push(...Object.keys(category[key].child))
        }
      }
    })
  })
  return names
})

// 方法
const getCategoryTitle = (title: string) => {
  const titles: Record<string, string> = {
    'smuggler_weekly': '走私犯周报权限'
  }
  return titles[title] || title
}

const getPrivilegeName = (privilegeType: string) => {
  const names: Record<string, string> = {
    'smuggler_weekly_report_ownership': '周报所有权',
    'smuggler_weekly_report_create': '创建周报',
    'smuggler_weekly_report_update': '更新周报',
    'smuggler_weekly_report_delete': '删除周报',
    'smuggler_weekly_report_comment_create': '创建评论',
    'smuggler_weekly_report_comment_update': '更新评论',
    'smuggler_weekly_report_comment_delete': '删除评论'
  }
  return names[privilegeType] || privilegeType
}

const toggleChildPrivileges = (privilegeName: string) => {
  showChildPrivileges.value[privilegeName] = !showChildPrivileges.value[privilegeName]
}

const onParentPrivilegeChange = (privilegeName: string, isChecked: boolean) => {
  // 找到这个父权限的所有子权限
  const parentPrivilege = findPrivilege(privilegeName)
  if (parentPrivilege?.child) {
    const childPrivileges = Object.keys(parentPrivilege.child)

    if (isChecked) {
      // 选择父权限时，移除所有子权限（因为只提交父权限）
      selectedPrivileges.value = selectedPrivileges.value.filter(
          p => !childPrivileges.includes(p)
      )
    } else {
      // 取消父权限时，什么都不做
    }
  }
}

const onChildPrivilegeChange = (parentName: string, childName: string, isChecked: boolean) => {
  if (isChecked) {
    // 选择子权限时，如果父权限被选中，先取消父权限
    if (selectedPrivileges.value.includes(parentName)) {
      selectedPrivileges.value = selectedPrivileges.value.filter(p => p !== parentName)
    }
  }
}

const findPrivilege = (privilegeName: string) => {
  for (const category of privilegesList.value) {
    for (const [key, value] of Object.entries(category)) {
      if (key === privilegeName) {
        return value
      }
      if (key !== 'title' && (value as any).child) {
        for (const [childKey] of Object.entries((value as any).child)) {
          if (childKey === privilegeName) {
            return { child: { [childKey]: {} } }
          }
        }
      }
    }
  }
  return null
}

const selectAll = () => {
  // 只选择父权限，不选择子权限
  selectedPrivileges.value = allPrivilegeNames.value.filter(name => {
    const privilege = findPrivilege(name)
    return !privilege?.child // 只有没有child的才是父权限（根据你的数据结构）
  })
}

const deselectAll = () => {
  selectedPrivileges.value = []
}

const savePrivileges = async () => {
  if (!currentUser.value.id) {
    notice.error('请先选择用户')
    return
  }

  loading.value = true
  try {
    // 准备要提交的权限
    const privilegesToSubmit = selectedPrivileges.value.filter(privilege => {
      // 如果是父权限且有子权限被选中，不提交父权限（应该通过父权限的子权限提交）
      const hasChildren = selectedPrivileges.value.some(p =>
          p !== privilege && p.startsWith(privilege.replace('_ownership', ''))
      )
      return !hasChildren
    })

    // 批量授予权限
    const result = await privilegeApi.batchGrantPrivilege({
      userIds: [currentUser.value.id],
      privilegeType: 'smuggler' // 或者根据实际情况调整
    })

    // 然后授予具体的权限
    for (const privilege of privilegesToSubmit) {
      await privilegeApi.grantPrivilege({
        userId: currentUser.value.id,
        privilegeType: privilege
      })
    }

    notice.success('权限保存成功')
    loadUserPrivileges()
  } catch (error) {
    notice.error('保存权限失败')
  } finally {
    loading.value = false
  }
}

const searchUser = async () => {
  searchLoading.value = true
  try {
    // TODO: 这里需要调用用户搜索API
    // 暂时模拟数据
    if (searchUserId.value || searchUsername.value) {
      currentUser.value = {
        id: searchUserId.value || 'test-user-id',
        username: searchUsername.value || '测试用户'
      }
      await loadUserPrivileges()
    }
  } catch (error) {
    notice.error('搜索用户失败')
  } finally {
    searchLoading.value = false
  }
}

const clearSearch = () => {
  searchUserId.value = ''
  searchUsername.value = ''
  currentUser.value = { id: '', username: '' }
  selectedPrivileges.value = []
  currentUserPrivileges.value = []
}

const loadUserPrivileges = async () => {
  if (!currentUser.value.id) return

  try {
    const result = await privilegeApi.getUserPrivileges(currentUser.value.id, {
      includeInactive: true
    })
    currentUserPrivileges.value = result.data.privileges || []

    // 更新选中的权限
    selectedPrivileges.value = currentUserPrivileges.value
        .filter(p => p.status === 'active')
        .map(p => p.privilegeType)
  } catch (error) {
    console.error('加载用户权限失败:', error)
  }
}

const batchGrant = async () => {
  if (!currentUser.value.id) {
    notice.error('请先选择用户')
    return
  }

  dialogTitle.value = '批量授予权限'
  dialogMessage.value = `确认要为用户 ${currentUser.value.username} 授予 ${selectedPrivileges.value.length} 个权限吗？`
  pendingAction.value = async () => {
    batchLoading.value = true
    try {
      // 过滤掉子权限，只提交父权限
      const parentPrivileges = selectedPrivileges.value.filter(privilege => {
        const hasChild = selectedPrivileges.value.some(p =>
            p !== privilege && p.startsWith(privilege.replace('_ownership', ''))
        )
        return !hasChild || !p.includes('_ownership')
      })

      for (const privilege of parentPrivileges) {
        await privilegeApi.grantPrivilege({
          userId: currentUser.value.id,
          privilegeType: privilege
        })
      }
      notice.success('批量授权成功')
      loadUserPrivileges()
    } catch (error) {
      notice.error('批量授权失败')
    } finally {
      batchLoading.value = false
    }
  }
  confirmDialog.value = true
}

const batchRevoke = async () => {
  if (!currentUser.value.id) {
    notice.error('请先选择用户')
    return
  }

  dialogTitle.value = '批量吊销权限'
  dialogMessage.value = `确认要吊销用户 ${currentUser.value.username} 的 ${selectedPrivileges.value.length} 个权限吗？`
  pendingAction.value = async () => {
    batchLoading.value = true
    try {
      for (const privilege of selectedPrivileges.value) {
        await privilegeApi.revokePrivilege({
          userId: currentUser.value.id,
          privilegeType: privilege
        })
      }
      notice.success('批量吊销成功')
      loadUserPrivileges()
      selectedPrivileges.value = []
    } catch (error) {
      notice.error('批量吊销失败')
    } finally {
      batchLoading.value = false
    }
  }
  confirmDialog.value = true
}

const confirmAction = async () => {
  if (pendingAction.value) {
    await pendingAction.value()
  }
  confirmDialog.value = false
}

const getPrivilegeColor = (privilege: any) => {
  if (privilege.status === 'revoked') return 'error'
  if (privilege.status === 'inactive') return 'warning'
  if (isPrivilegeExpired(privilege.privilegeType)) return 'error'
  if (isPrivilegeExpiring(privilege.privilegeType)) return 'warning'
  return 'primary'
}

const isPrivilegeExpiring = (privilegeName: string) => {
  const privilege = currentUserPrivileges.value.find(p => p.privilegeType === privilegeName)
  if (!privilege?.expiryTime) return false

  const expiryDate = new Date(privilege.expiryTime)
  const now = new Date()
  const daysDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
  return daysDiff > 0 && daysDiff <= 7 // 7天内过期
}

const isPrivilegeExpired = (privilegeName: string) => {
  const privilege = currentUserPrivileges.value.find(p => p.privilegeType === privilegeName)
  if (!privilege?.expiryTime) return false

  const expiryDate = new Date(privilege.expiryTime)
  return expiryDate < new Date()
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString)
  } catch {
    return dateString
  }
}

// 生命周期
onMounted(() => {
  // 加载权限配置
  privilegesList.value = [
    {
      "smuggler_weekly_report_ownership": {
        "title": "smuggler_weekly",
        "child": {
          "smuggler_weekly_report_create": {},
          "smuggler_weekly_report_update": {},
          "smuggler_weekly_report_delete": {},
          "smuggler_weekly_report_comment_create": {},
          "smuggler_weekly_report_comment_update": {},
          "smuggler_weekly_report_comment_delete": {}
        }
      }
    }
  ]
})
</script>

<style scoped>
</style>
