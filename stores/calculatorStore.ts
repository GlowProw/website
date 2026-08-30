import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {Items, Material, Materials, Ships} from 'glow-prow-data'
import {v4 as uuidv4} from 'uuid'
import {useI18n} from "vue-i18n";
import {storage} from "@/assets/sripts/index"

// 版本号
const STORE_VERSION = '1.0.0'

export interface CalculatorTarget {
    uid: string
    id: string
    type: 'item' | 'ship' | 'material'
    quantity: number
}

export interface MaterialTreeNode {
    id: string
    name: string
    quantity: number
    isExcluded: boolean
    children: MaterialTreeNode[]
}

export interface FlatMaterialEntry {
    id: string
    totalQuantity: number
    isRaw: boolean
}

export interface SankeyNode {
    id: string
    name: string
    text: string
    color: string
}

export interface SankeyLink {
    source: string
    target: string
    name: string
    text: string
    color: string
    value: number
}

export interface SavedConfig {
    uid: string
    name: string
    createdAt: number
    targets: CalculatorTarget[]
    excludedMaterials: string[]
    displaySettings: DisplaySettings
}

export interface DisplaySettings {
    viewMode: 'list' | 'sankey'
    listColumns: {
        name: boolean
        quantity: boolean
        id: boolean
        link: boolean
    }
    sankey: {
        showName: boolean
        showQuantity: boolean
    }
}

const materials: Record<string, any> = Materials
const items: Record<string, any> = Items
const ships: Record<string, any> = Ships

const color = [
    {
        name: 'basicColor',
        value: [
            '#f48fb1', '#ce93d8', '#9fa8da', '#81d4fa',
            '#80cbc4', '#a5d6a7', '#fff59d', '#ffcc80',
            '#ffab91', '#bcaaa4', '#b0bec5', '#ef9a9a'
        ]
    },
    {
        name: 'richVividColor',
        value: [
            '#f48fb1', '#ce93d8', '#9fa8da', '#81d4fa',
            '#80cbc4', '#a5d6a7', '#fff59d', '#ffcc80',
            '#ffab91', '#bcaaa4', '#b0bec5', '#ef9a9a',
            '#f06292', '#ba68c8', '#7986cb', '#4fc3f7',
            '#4db6ac', '#81c784', '#fff176', '#ffb74d',
            '#ff8a65', '#a1887f', '#90a4ae', '#e57373',
            '#ec407a', '#ab47bc', '#5c6bc0', '#29b6f6',
            '#26a69a', '#66bb6a', '#ffee58', '#ffa726',
            '#ff7043', '#8d6e63', '#78909c', '#ef5350',
            '#f06292', '#ce93d8', '#9fa8da', '#4fc3f7',
            '#80cbc4', '#aed581', '#fff59d', '#ffb74d',
            '#ffab91', '#bcaaa4', '#b0bec5', '#e57373'
        ]
    },
    {
        name: 'coolBlack',
        value: [
            '#1E1E1E', '#252526', '#2C2C2C', '#323232',
            '#37373D', '#3E3E42', '#454545', '#4A4A4A',
            '#505050', '#555555', '#5C5C5C', '#616161'
        ]
    },
    {
        name: 'milkWhite',
        value: [
            '#FFFFFF', '#FFFBFA', '#FFFDF5', '#FAF9F6',
            '#F8F8F2', '#F5F5DC', '#F5F5F0', '#F3EFE0',
            '#F2F2F2', '#FFFDD0', '#FEF9E7', '#F0EAD6'
        ]
    },
]

const STORAGE_KEY = 'calculator'

interface PersistedState {
    useColorPanel: { name: string, value: string[] }
    targets: CalculatorTarget[]
    excludedMaterials: string[]
    savedConfigs: SavedConfig[]
    displaySettings: DisplaySettings
}

/**
 * 从 localStorage 加载状态
 */
function loadPersistedState(): PersistedState | null {
    const data = storage.local.get(STORAGE_KEY)
    if (data?.code == 0) {
        return data.data?.value || null
    }

    return null
}

/**
 * 保存状态到 localStorage
 */
function savePersistedState(state: PersistedState) {
    try {
        storage.local.set(STORAGE_KEY, state)
    } catch (err) {
        console.error('Failed to save persisted state:', err)
    }
}

/**
 * 递归计算材料树
 */
function buildMaterialTree(
    materialId: string,
    quantity: number,
    excludedMaterials: string[],
    visited: Set<string> = new Set()
): MaterialTreeNode {
    const mat = materials[materialId]
    const isExcluded = excludedMaterials.includes(materialId)

    const node: MaterialTreeNode = {
        id: materialId,
        name: materialId,
        quantity,
        isExcluded,
        children: []
    }

    // 防止循环引用
    if (visited.has(materialId)) return node
    visited.add(materialId)

    // 如果材料被排除或没有子材料，则作为叶子节点
    if (!isExcluded && mat && mat.required) {
        const requiredEntries = Array.from(mat.required) as Array<[Material, number]>
        for (const [childMat, childQty] of requiredEntries) {
            const childNode = buildMaterialTree(
                childMat.id,
                childQty * quantity,
                excludedMaterials,
                new Set(visited)
            )
            node.children.push(childNode)
        }
    }

    return node
}

/**
 * 扁平化汇总材料
 */
function flattenMaterialTree(node: MaterialTreeNode, result: Map<string, FlatMaterialEntry>) {
    if (node.children.length === 0 || node.isExcluded) {
        // 叶子节点，汇总数量
        const existing = result.get(node.id)
        if (existing) {
            existing.totalQuantity += node.quantity
        } else {
            result.set(node.id, {
                id: node.id,
                totalQuantity: node.quantity,
                isRaw: node.children.length === 0 && !node.isExcluded
            })
        }
    }

    for (const child of node.children) {
        flattenMaterialTree(child, result)
    }
}

/**
 * 构建桑基图数据
 */
function buildSankeyData(
    targets: CalculatorTarget[],
    excludedMaterials: string[],
    useColorPalette: { name: string, value: any[] }
): { nodes: SankeyNode[], links: SankeyLink[] } {
    const nodesMap = new Map<string, SankeyNode>()
    const linksMap = new Map<string, SankeyLink>()

    const colorPalette: { name: string; value: any[] } | any[] = useColorPalette.value
    let colorIndex = 0

    function getColor(id: string): string {
        if (!nodesMap.has(id)) {
            return colorPalette[colorIndex++ % useColorPalette.value.length]
        }
        return nodesMap.get(id)!.color
    }

    function processNode(
        parentId: string,
        materialId: string,
        quantity: number,
        excludedMaterials: string[],
        visited: Set<string>
    ) {
        const mat = materials[materialId]
        const isExcluded = excludedMaterials.includes(materialId)

        const nodeId = `m|${materialId}`
        if (!nodesMap.has(nodeId)) {
            const color = getColor(nodeId)
            nodesMap.set(nodeId, {
                id: nodeId,
                name: materialId,
                text: `${quantity}`,
                color
            })
        } else {
            const existing = nodesMap.get(nodeId)!
            const prev = parseFloat(existing.text) || 0
            existing.text = `${prev + quantity}`
        }

        const linkKey = `${nodeId}->${parentId}`
        if (!linksMap.has(linkKey)) {
            linksMap.set(linkKey, {
                source: nodeId,
                target: parentId,
                name: materialId,
                text: `${quantity}`,
                color: nodesMap.get(nodeId)?.color || '#705d76',
                value: quantity
            })
        } else {
            const existing = linksMap.get(linkKey)!
            existing.value += quantity
            existing.text = `${existing.value}`
        }

        if (visited.has(materialId)) return
        visited.add(materialId)

        if (!isExcluded && mat && mat.required) {
            const requiredEntries = Array.from(mat.required) as Array<[Material, number]>
            for (const [childMat, childQty] of requiredEntries) {
                processNode(nodeId, childMat.id, childQty * quantity, excludedMaterials, new Set(visited))
            }
        }
    }

    for (const target of targets) {
        const data = target.type === 'item' ? items[target.id] : ships[target.id]
        if (!data) continue

        const targetNodeId = `t|${target.id}`
        const color = getColor(targetNodeId)
        nodesMap.set(targetNodeId, {
            id: targetNodeId,
            name: target.id,
            text: `×${target.quantity}`,
            color
        })

        if (data.required) {
            const requiredEntries = Array.from(data.required) as Array<[Material, number]>
            for (const [mat, qty] of requiredEntries) {
                processNode(targetNodeId, mat.id, qty * target.quantity, excludedMaterials, new Set())
            }
        }
    }

    return {
        nodes: Array.from(nodesMap.values()),
        links: Array.from(linksMap.values())
    }
}

export const useCalculatorStore = defineStore('calculator', () => {
    const {t} = useI18n()

    // 色板
    const useColorPanel = ref<any>(color[0])

    // 目标列表
    const targets = ref<CalculatorTarget[]>([])

    // 排除材料
    const excludedMaterials = ref<string[]>([])

    // 保存的配置
    const savedConfigs = ref<SavedConfig[]>([])

    // 显示设置
    const displaySettings = ref<DisplaySettings>({
        viewMode: 'list',
        listColumns: {
            name: true,
            id: true,
            quantity: true,
            link: true
        },
        sankey: {
            showName: true,
            showQuantity: true
        }
    })

    // 保存状态到 localStorage 的辅助函数
    const persistState = () => {
        savePersistedState({
            useColorPanel: useColorPanel.value,
            targets: targets.value,
            excludedMaterials: excludedMaterials.value,
            savedConfigs: savedConfigs.value,
            displaySettings: displaySettings.value
        })
    }

    // 加载持久化状态
    const loadState = () => {
        const persisted = loadPersistedState()
        if (persisted) {
            useColorPanel.value = persisted.useColorPanel
            targets.value = persisted.targets
            excludedMaterials.value = persisted.excludedMaterials
            savedConfigs.value = persisted.savedConfigs
            displaySettings.value = persisted.displaySettings
        }
    }

    // 立即加载保存的状态
    loadState()

    /**
     * 目标操作
     * @param id
     * @param type
     * @param quantity
     */
    function addTarget(id: string, type: 'item' | 'ship' | 'material', quantity: number = 1) {
        // 检查是否已存在相同目标
        const existing = targets.value.find(t => t.id === id && t.type === type)
        if (existing) {
            existing.quantity += quantity
            targets.value = [...targets.value]
            persistState() // 保存
            return
        }
        targets.value = [...targets.value, {
            uid: uuidv4(),
            id,
            type,
            quantity
        }]
        persistState() // 保存
    }

    /**
     * 移除目标
     * @param uid
     */
    function removeTarget(uid: string) {
        targets.value = targets.value.filter(t => t.uid !== uid)
        persistState() // 保存
    }

    /**
     * 更新目标
     * @param uid
     * @param quantity
     */
    function updateTargetQuantity(uid: string, quantity: number) {
        const target = targets.value.find(t => t.uid === uid)
        if (target) {
            target.quantity = Math.max(1, quantity)
            persistState() // 保存
        }
    }

    /**
     * 擦除
     */
    function clearTargets() {
        targets.value = []
        persistState() // 保存
    }

    /**
     * 排除材料操作
     * @param id
     */
    function addExcludedMaterial(id: string) {
        if (!excludedMaterials.value.includes(id)) {
            excludedMaterials.value = [...excludedMaterials.value, id]
            persistState() // 保存
        }
    }

    function removeExcludedMaterial(id: string) {
        excludedMaterials.value = excludedMaterials.value.filter(m => m !== id)
        persistState() // 保存
    }

    function clearExcludedMaterials() {
        excludedMaterials.value = []
        persistState() // 保存
    }

    /**
     * 计算结果
     */
    const materialTrees = computed(() => {
        const trees: MaterialTreeNode[] = []
        // 显式读取排除列表长度以确保 Vue 跟踪依赖
        const currentExcludes = [...excludedMaterials.value]

        for (const target of targets.value) {
            const data = target.type === 'item' ? items[target.id] : ships[target.id]
            if (!data || !data.required) continue

            const requiredEntries = Array.from(data.required) as Array<[Material, number]>
            for (const [mat, qty] of requiredEntries) {
                trees.push(
                    buildMaterialTree(mat.id, qty * target.quantity, currentExcludes)
                )
            }
        }

        return trees
    })

    const flatMaterials = computed(() => {
        const result = new Map<string, FlatMaterialEntry>()
        for (const tree of materialTrees.value) {
            flattenMaterialTree(tree, result)
        }
        return Array.from(result.values()).sort((a, b) => b.totalQuantity - a.totalQuantity)
    })

    const sankeyData = computed(() => {
        const currentExcludes = [...excludedMaterials.value]
        return buildSankeyData(targets.value, currentExcludes, useColorPanel.value)
    })

    /**
     * 配置管理
     * @param name
     */
    function saveConfig(name: string) {
        const config: SavedConfig = {
            uid: uuidv4(),
            name,
            createdAt: Date.now(),
            targets: JSON.parse(JSON.stringify(targets.value)),
            excludedMaterials: [...excludedMaterials.value],
            displaySettings: JSON.parse(JSON.stringify(displaySettings.value))
        }
        savedConfigs.value.push(config)
        persistState() // 保存
    }

    function loadConfig(uid: string) {
        const config = savedConfigs.value.find(c => c.uid === uid)
        if (!config) return

        targets.value = JSON.parse(JSON.stringify(config.targets))
        excludedMaterials.value = [...config.excludedMaterials]
        displaySettings.value = JSON.parse(JSON.stringify(config.displaySettings))
        persistState() // 保存
    }

    function deleteConfig(uid: string) {
        savedConfigs.value = savedConfigs.value.filter(c => c.uid !== uid)
        persistState() // 保存
    }

    /**
     * 导出 JSON - 导出目标列表，包含时间和版本信息
     */
    function exportJSON() {
        const exportData = {
            version: STORE_VERSION,
            exportTime: Date.now(),
            exportTimeLocale: new Date().toLocaleString(),
            data: {
                targets: targets.value,
                excludedMaterials: excludedMaterials.value,
                displaySettings: displaySettings.value
            },
            metadata: {
                totalTargets: targets.value.length,
                totalExcludedMaterials: excludedMaterials.value.length
            }
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'})
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        downloadBlob(blob, `${t('name')}.targets.${timestamp}.json`)
    }

    /**
     * 导出 CSV - 导出目标列表，包含时间和版本信息
     * @param getNameCallback 获取目标名称的回调函数
     */
    function exportCSV(getNameCallback?: (id: string, type: string) => string) {
        // CSV 头部
        const headers = t('calculator.export.csvHeaders').split(',')

        // 构建数据行
        const rows = targets.value.map(target => {
            const name = getNameCallback
                ? getNameCallback(target.id, target.type)
                : `${target.id} (${target.type})`
            return [
                target.id,
                name,
                target.type,
                target.quantity,
            ]
        })

        // 添加元数据行（注释形式）
        const exportTime = new Date().toLocaleString()
        const versionInfo = '# ' + t('calculator.export.exportedTime', {time: exportTime})
        const versionLine = '# ' + t(`calculator.export.version`, {version: STORE_VERSION})
        const totalLine = '# ' + t(`calculator.export.totalTargets`, {number: targets.value.length})
        const separator = '#'

        // 构建 CSV 内容
        const csvRows = [
            versionInfo,
            versionLine,
            totalLine,
            separator,
            headers.join(','),
            ...rows.map(r => r.map(cell => {
                // 处理可能包含逗号的内容
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`
                }
                return cell
            }).join(','))
        ]

        const csvContent = csvRows.join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], {type: 'text/csv;charset=utf-8;'})
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        downloadBlob(blob, `${t('name')}.targets.${timestamp}.csv`)
    }

    function importFile(file: File, type: 'json' | 'csv') {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (!e.target?.result) return
            const content = e.target.result as string
            if (type === 'json') {
                try {
                    const importData = JSON.parse(content)
                    // 支持新格式（带版本信息）和旧格式
                    let targetsData: CalculatorTarget[] = []
                    let excludedData: string[] = []

                    if (importData.data && importData.data.targets) {
                        // 新格式
                        targetsData = importData.data.targets
                        excludedData = importData.data.excludedMaterials || []
                        console.log(`Imported from version: ${importData.version}, time: ${importData.exportTimeLocale}`)
                    } else if (importData.targets) {
                        // 旧格式兼容
                        targetsData = importData.targets
                        excludedData = importData.excludedMaterials || []
                    }

                    if (targetsData.length > 0) {
                        targets.value = targetsData
                    }
                    if (excludedData.length > 0) {
                        excludedMaterials.value = excludedData
                    }
                    persistState() // 保存
                } catch (err) {
                    console.error('Failed to parse JSON', err)
                }
            } else if (type === 'csv') {
                try {
                    const lines = content.trim().split('\n')
                    // 过滤掉注释行（以 # 开头）
                    const dataLines = lines.filter(line => !line.trim().startsWith('#'))
                    if (dataLines.length === 0) return

                    const headers = dataLines[0].split(',')
                    const targetIndex = headers.findIndex(h => h === 'ID' || h === 'id')
                    const quantityIndex = headers.findIndex(h => h === 'Quantity' || h === 'quantity')
                    const typeIndex = headers.findIndex(h => h === 'Type' || h === 'type')

                    const newTargets: CalculatorTarget[] = []
                    for (let i = 1; i < dataLines.length; i++) {
                        const cols = parseCSVLine(dataLines[i])
                        if (cols.length < 2) continue

                        const id = targetIndex >= 0 ? cols[targetIndex]?.trim() : cols[0]?.trim()
                        const qty = parseInt((quantityIndex >= 0 ? cols[quantityIndex] : cols[1])?.trim()) || 1

                        if (id) {
                            let tType: 'item' | 'ship' | 'material' = 'item'
                            const typeStr = typeIndex >= 0 ? cols[typeIndex]?.trim().toLowerCase() : ''
                            if (typeStr === 'ship') tType = 'ship'
                            else if (typeStr === 'material') tType = 'material'
                            else if (Ships[id]) tType = 'ship'

                            newTargets.push({
                                uid: uuidv4(),
                                id: id,
                                type: tType,
                                quantity: qty
                            })
                        }
                    }
                    if (newTargets.length > 0) {
                        targets.value = newTargets
                        persistState() // 保存
                    }
                } catch (err) {
                    console.error('Failed to parse CSV', err)
                }
            }
        }
        reader.readAsText(file)
    }

    /**
     * 导入配装数据
     * @param data
     */
    function importAssembly(data: any) {
        if (!data) return

        // 提取所有有效的 ID
        const itemsToProcess: { id: string, type: 'item' | 'ship' | 'material' }[] = []

        // 1. 船只
        if (data.shipSlot?.id) {
            itemsToProcess.push({id: data.shipSlot.id, type: 'ship'})
        }

        // 2. 船端升级、终结技、装甲
        if (data.shipUpgradeSlot?.id) itemsToProcess.push({id: data.shipUpgradeSlot.id, type: 'item'})
        if (data.ultimateSlot?.id) itemsToProcess.push({id: data.ultimateSlot.id, type: 'item'})
        if (data.armorSlot?.id) itemsToProcess.push({id: data.armorSlot.id, type: 'item'})

        // 3. 武器
        if (Array.isArray(data.weaponSlots)) {
            data.weaponSlots.forEach((w: any) => {
                if (w?.id) itemsToProcess.push({id: w.id, type: 'item'})
            })
        }

        // 4. 副武器
        if (Array.isArray(data.secondaryWeaponSlots)) {
            data.secondaryWeaponSlots.forEach((sw: any) => {
                if (sw?.id) itemsToProcess.push({id: sw.id, type: 'item'})
            })
        }

        // 5. 陈设
        if (Array.isArray(data.displaySlots)) {
            data.displaySlots.forEach((d: any) => {
                if (d?.id) itemsToProcess.push({id: d.id, type: 'item'})
            })
        }

        // 批量添加
        itemsToProcess.forEach(item => {
            addTarget(item.id, item.type, 1)
        })

        persistState()
    }

    // 辅助函数：解析 CSV 行（处理引号）
    function parseCSVLine(line: string): string[] {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        result.push(current.trim())
        return result
    }

    function downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // 跨标签页同步
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
            if (e.key === storage.local.name(STORAGE_KEY) && e.newValue) {
                try {
                    const state: any = JSON.parse(e.newValue).value

                    if (state.targets) targets.value = state.targets
                    if (state.excludedMaterials) excludedMaterials.value = state.excludedMaterials
                    if (state.savedConfigs) savedConfigs.value = state.savedConfigs
                    if (state.displaySettings) displaySettings.value = state.displaySettings
                } catch (err) {
                    console.error('Failed to parse calculator storage sync:', err)
                }
            }
        })
    }

    return {
        useColorPanel,
        color,
        targets,
        excludedMaterials,
        savedConfigs,
        displaySettings,
        addTarget,
        removeTarget,
        updateTargetQuantity,
        clearTargets,
        addExcludedMaterial,
        removeExcludedMaterial,
        importFile,
        importAssembly,
        clearExcludedMaterials,
        materialTrees,
        flatMaterials,
        sankeyData,
        saveConfig,
        loadConfig,
        deleteConfig,
        exportJSON,
        exportCSV,
    }
})
