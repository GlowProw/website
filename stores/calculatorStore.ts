import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Items, Ships, Materials, Material } from 'glow-prow-data'
import { v4 as uuidv4 } from 'uuid'
import {useI18n} from "vue-i18n";

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
    excludedMaterials: string[]
): { nodes: SankeyNode[], links: SankeyLink[] } {
    const nodesMap = new Map<string, SankeyNode>()
    const linksMap = new Map<string, SankeyLink>()

    const colorPalette = [
        '#f48fb1', '#ce93d8', '#9fa8da', '#81d4fa',
        '#80cbc4', '#a5d6a7', '#fff59d', '#ffcc80',
        '#ffab91', '#bcaaa4', '#b0bec5', '#ef9a9a'
    ]

    let colorIndex = 0

    function getColor(id: string): string {
        if (!nodesMap.has(id)) {
            return colorPalette[colorIndex++ % colorPalette.length]
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

    // === 目标列表 ===
    const targets = ref<CalculatorTarget[]>([])

    // === 排除材料 ===
    const excludedMaterials = ref<string[]>([])

    // === 保存的配置 ===
    const savedConfigs = ref<SavedConfig[]>([])

    // === 显示设置 ===
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

    // === 目标操作 ===
    function addTarget(id: string, type: 'item' | 'ship' | 'material', quantity: number = 1) {
        // 检查是否已存在相同目标
        const existing = targets.value.find(t => t.id === id && t.type === type)
        if (existing) {
            existing.quantity += quantity
            targets.value = [...targets.value]
            return
        }
        targets.value = [...targets.value, {
            uid: uuidv4(),
            id,
            type,
            quantity
        }]
    }

    function removeTarget(uid: string) {
        targets.value = targets.value.filter(t => t.uid !== uid)
    }

    function updateTargetQuantity(uid: string, quantity: number) {
        const target = targets.value.find(t => t.uid === uid)
        if (target) {
            target.quantity = Math.max(1, quantity)
        }
    }

    function clearTargets() {
        targets.value = []
    }

    // === 排除材料操作 ===
    function addExcludedMaterial(id: string) {
        if (!excludedMaterials.value.includes(id)) {
            excludedMaterials.value = [...excludedMaterials.value, id]
        }
    }

    function removeExcludedMaterial(id: string) {
        excludedMaterials.value = excludedMaterials.value.filter(m => m !== id)
    }

    function clearExcludedMaterials() {
        excludedMaterials.value = []
    }

    // === 计算结果 ===
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
        return buildSankeyData(targets.value, currentExcludes)
    })

    // === 配置管理 ===
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
    }

    function loadConfig(uid: string) {
        const config = savedConfigs.value.find(c => c.uid === uid)
        if (!config) return

        targets.value = JSON.parse(JSON.stringify(config.targets))
        excludedMaterials.value = [...config.excludedMaterials]
        displaySettings.value = JSON.parse(JSON.stringify(config.displaySettings))
    }

    function deleteConfig(uid: string) {
        savedConfigs.value = savedConfigs.value.filter(c => c.uid !== uid)
    }

    // === 导出 ===
    function exportJSON() {
        const data = {
            targets: targets.value,
            excludedMaterials: excludedMaterials.value,
            results: flatMaterials.value,
            trees: materialTrees.value
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        downloadBlob(blob, `${t('name')}.calculator-export.json`)
    }

    function exportCSV(headersStr?: string, yesLabel?: string, noLabel?: string, getNameCallback?: (id: string) => string) {
        const headers = headersStr || 'Material ID,Name,Quantity,Is Raw Material'
        const rows = flatMaterials.value.map(m => {
            const name = getNameCallback ? getNameCallback(m.id) : m.id
            const isRawStr = m.isRaw ? (yesLabel || 'Yes') : (noLabel || 'No')
            return [m.id, name, m.totalQuantity, isRawStr]
        })
        const csvContent = [
            headers,
            ...rows.map(r => r.join(','))
        ].join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        downloadBlob(blob, `${t('name')}.calculator-export.csv`)
    }

    function importFile(file: File, type: 'json' | 'csv') {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (!e.target?.result) return
            const content = e.target.result as string
            if (type === 'json') {
                try {
                    const data = JSON.parse(content)
                    if (data.targets) targets.value = data.targets
                    if (data.excludedMaterials) excludedMaterials.value = data.excludedMaterials
                } catch (err) {
                    console.error('Failed to parse JSON', err)
                }
            } else if (type === 'csv') {
                try {
                    const rows = content.trim().split('\n')
                    rows.shift() // remove headers
                    const newTargets: CalculatorTarget[] = []
                    for (const row of rows) {
                        const cols = row.split(',')
                        if (cols.length >= 2) {
                            const id = cols[0].trim()
                            const qty = parseInt(cols[1].trim()) || 1
                            if (id) {
                                let tType: 'item' | 'ship' = 'item'
                                if (Ships[id]) tType = 'ship'
                                newTargets.push({
                                    uid: uuidv4(),
                                    id: id,
                                    type: tType,
                                    quantity: qty
                                })
                            }
                        }
                    }
                    if (newTargets.length > 0) {
                        targets.value = newTargets
                    }
                } catch (err) {
                    console.error('Failed to parse CSV', err)
                }
            }
        }
        reader.readAsText(file)
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

    // === 跨标签页同步 ===
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
            if (e.key === 'calculator' && e.newValue) {
                try {
                    const state = JSON.parse(e.newValue)
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
        clearExcludedMaterials,
        materialTrees,
        flatMaterials,
        sankeyData,
        saveConfig,
        loadConfig,
        deleteConfig,
        exportJSON,
        exportCSV
    }
}, {
    persist: {
        pick: ['targets', 'excludedMaterials', 'savedConfigs', 'displaySettings']
    }
})
