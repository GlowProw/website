/**
 * 收藏状态机
 * 统一管理本地匿名标记与账户已取得记录，并支持双向同步
 */

import {defineStore} from 'pinia'
import {computed, ref, watch} from 'vue'
import {storageCollect} from '@/assets/sripts'
import {useCollectionApi} from '@/assets/sripts/api/collection_service'
import {useAuthStore} from '~/stores/userAccountStore'
import {COLLECTION_TARGET_KINDS, type CollectionSyncResult} from '@/assets/types/Collection'
import type {CollectionStatsResult} from '@/assets/types/Stats'

// 单次批量提交上限，与后端 collection/batch 保持一致
const BATCH_SIZE = 500

export const useCollectionStore = defineStore('collection', () => {
  const authStore = useAuthStore()
  const collectionApi = useCollectionApi()

  // 本地匿名标记，类型 -> 目标 ID -> 收藏时间
  const localMap = ref<Record<string, Record<string, number>>>({})
  // 账户已取得记录，类型 -> 目标 ID -> 创建时间
  const accountMap = ref<Record<string, Record<string, number>>>({})
  const accountLoaded = ref(false)
  const loadingAccount = ref(false)
  const syncing = ref(false)

  /**
   * 从本地存储重建匿名标记索引
   */
  const onLoadLocal = () => {
    const next: Record<string, Record<string, number>> = {}
    for (const kind of COLLECTION_TARGET_KINDS) {
      const result: any = storageCollect.gets(kind)
      if (result?.code !== 0 || !Array.isArray(result.data)) continue

      const records: Record<string, number> = {}
      for (const record of result.data as Array<{ id: string; collectTime?: number }>) {
        if (!record?.id) continue
        records[record.id] = Number(record.collectTime) || 0
      }
      if (Object.keys(records).length) next[kind] = records
    }
    localMap.value = next
  }

  /**
   * 拉取账户全部已取得记录，默认每个会话只请求一次
   * @param force 强制刷新
   */
  const onLoadAccount = async (force = false) => {
    if (!authStore.isLogin || loadingAccount.value) return
    if (accountLoaded.value && !force) return

    loadingAccount.value = true
    try {
      const result: any = await collectionApi.getCollectionStats('all')
      const stats = (result?.data?.data || result?.data) as CollectionStatsResult

      const next: Record<string, Record<string, number>> = {}
      for (const record of stats?.records || []) {
        if (!record?.targetType || !record?.targetId) continue
        if (!next[record.targetType]) next[record.targetType] = {}
        next[record.targetType][record.targetId] = new Date(record.createdTime).getTime() || 0
      }
      accountMap.value = next
      accountLoaded.value = true
    } catch {
      // 账户数据读取失败时保留本地标记，页面照常展示
    } finally {
      loadingAccount.value = false
    }
  }

  /**
   * 判断目标是否已取得，本地标记优先于账户记录
   * @param targetType 目标类型
   * @param targetId 目标 ID
   */
  const isCollected = (targetType: string, targetId: string): boolean => {
    if (!targetId) return false
    const local = localMap.value[targetType]?.[targetId]
    if (local !== undefined) return true
    return accountMap.value[targetType]?.[targetId] !== undefined
  }

  /**
   * 写入或移除本地标记
   * @param targetType 目标类型
   * @param targetId 目标 ID
   * @param collected 是否已取得
   */
  const onSetLocal = (targetType: string, targetId: string, collected: boolean) => {
    if (collected) {
      storageCollect.updata({collectTime: Date.now()}, targetType, targetId)
    } else {
      storageCollect.delete(targetId, targetType)
    }

    if (!localMap.value[targetType]) localMap.value[targetType] = {}
    if (collected) {
      localMap.value[targetType][targetId] = Date.now()
    } else {
      delete localMap.value[targetType][targetId]
    }
  }

  /**
   * 切换已取得状态，未登录只写本地，登录后同时同步账户
   * @param targetType 目标类型
   * @param targetId 目标 ID
   */
  const onToggle = async (targetType: string, targetId: string): Promise<boolean> => {
    const next = !isCollected(targetType, targetId)
    onSetLocal(targetType, targetId, next)

    if (!authStore.isLogin) return next

    try {
      await collectionApi.setCollection(targetType, targetId, next)
      if (!accountMap.value[targetType]) accountMap.value[targetType] = {}
      if (next) {
        accountMap.value[targetType][targetId] = Date.now()
      } else {
        delete accountMap.value[targetType][targetId]
      }
      return next
    } catch (error) {
      onSetLocal(targetType, targetId, !next)
      throw error
    }
  }

  /**
   * 双向合并本地标记与账户收藏
   * 本地独有的上传账户，账户独有的下载本地，本地记录始终保留
   */
  const onSync = async (): Promise<CollectionSyncResult> => {
    if (!authStore.isLogin || syncing.value) return {uploaded: 0, downloaded: 0}

    syncing.value = true
    try {
      await onLoadAccount(true)

      let uploaded = 0
      let downloaded = 0

      for (const kind of COLLECTION_TARGET_KINDS) {
        const local = localMap.value[kind] || {}
        const account = accountMap.value[kind] || {}

        const pending = Object.keys(local).filter(id => account[id] === undefined)
        for (let i = 0; i < pending.length; i += BATCH_SIZE) {
          const chunk = pending.slice(i, i + BATCH_SIZE)
          await collectionApi.setCollectionBatch(kind, chunk, true)
          uploaded += chunk.length
          if (!accountMap.value[kind]) accountMap.value[kind] = {}
          for (const id of chunk) accountMap.value[kind][id] = local[id]
        }

        const missing = Object.keys(account).filter(id => local[id] === undefined)
        for (const id of missing) {
          storageCollect.updata({collectTime: account[id] || Date.now()}, kind, id)
          downloaded += 1
        }
      }

      if (downloaded) onLoadLocal()

      return {uploaded, downloaded}
    } finally {
      syncing.value = false
    }
  }

  /**
   * 本地有、账户没有的标记数量，用于同步提醒
   */
  const pendingLocalCount = computed(() => {
    let count = 0
    for (const [kind, records] of Object.entries(localMap.value)) {
      const account = accountMap.value[kind] || {}
      count += Object.keys(records).filter(id => account[id] === undefined).length
    }
    return count
  })

  /**
   * 本地标记总数
   */
  const localCount = computed(() =>
      Object.values(localMap.value).reduce((sum, records) => sum + Object.keys(records).length, 0)
  )

  watch(() => authStore.isLogin, (isLogin) => {
    if (isLogin) {
      onLoadAccount(true)
      return
    }
    accountMap.value = {}
    accountLoaded.value = false
  })

  onLoadLocal()

  return {
    localMap,
    accountMap,
    accountLoaded,
    loadingAccount,
    syncing,
    pendingLocalCount,
    localCount,
    onLoadLocal,
    onLoadAccount,
    isCollected,
    onToggle,
    onSync,
  }
})
