<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref, watch, nextTick} from "vue";
import {useCalculatorStore} from "~/stores/calculatorStore";
import * as d3 from 'd3';
import {sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink} from 'd3-sankey';
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t} = useI18n()
const store = useCalculatorStore()
const i18nReadName = useI18nReadName()

const svgContainer = ref<HTMLElement | null>(null)
const containerWidth = ref(900)
const containerHeight = ref(500)

interface SNode {
  id: string
  name: string
  text: string
  color: string
}

interface SLink {
  source: string
  target: string
  value: number
  name: string
  text: string
  color: string
}

function getDisplayName(id: string): string {
  try {
    const nameData = i18nReadName.material(id)
    const name = nameData.name()
    if (name && typeof name === 'string' && name !== id) return name
  } catch (e) {
    // fallback
  }
  return id
}

function drawSankey() {
  if (!svgContainer.value) return

  const data = store.sankeyData
  if (data.nodes.length === 0) return

  // 清除
  d3.select(svgContainer.value).selectAll('*').remove()

  const margin = {top: 20, right: 160, bottom: 20, left: 160}
  const width = containerWidth.value - margin.left - margin.right
  const height = Math.max(containerHeight.value, data.nodes.length * 40) - margin.top - margin.bottom

  const svg = d3.select(svgContainer.value)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

  // 构建节点索引映射
  const nodeIds = data.nodes.map(n => n.id)
  const nodeMap = new Map(data.nodes.map((n, i) => [n.id, i]))

  // 过滤有效链接
  const validLinks = data.links.filter(l =>
      nodeMap.has(l.source) && nodeMap.has(l.target) && l.source !== l.target
  )

  if (validLinks.length === 0) return

  // 创建 Sankey 布局
  const sankeyGenerator = sankey<SNode, SLink>()
      .nodeId((d: any) => d.id)
      .nodeWidth(20)
      .nodePadding(14)
      .extent([[0, 0], [width, height]])
      .nodeSort(null)

  const sankeyData = sankeyGenerator({
    nodes: data.nodes.map(n => ({...n})),
    links: validLinks.map(l => ({...l}))
  })

  const tooltip = d3.select(svgContainer.value)
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '10')

  // 绘制链接
  const links = svg.append('g')
      .selectAll('.sankey-link')
      .data(sankeyData.links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => d.color || '#555')
      .attr('stroke-width', (d: any) => Math.max(1, d.width || 1))
      .attr('fill', 'none')
      .attr('opacity', 0.35)
      .on('mouseover', function (event: any, d: any) {
        d3.select(this).attr('opacity', 0.7)
        tooltip
            .style('visibility', 'visible')
            .html(`${getDisplayName(d.name)}: ${d.text || d.value}`)
      })
      .on('mousemove', function (event: any) {
        const [x, y] = d3.pointer(event, svgContainer.value)
        tooltip
            .style('left', `${x + 15}px`)
            .style('top', `${y - 10}px`)
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.35)
        tooltip.style('visibility', 'hidden')
      })

  // 绘制节点
  const nodes = svg.append('g')
      .selectAll('.sankey-node')
      .data(sankeyData.nodes)
      .join('rect')
      .attr('class', 'sankey-node')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
      .attr('fill', (d: any) => d.color || '#888')
      .attr('rx', 3)
      .attr('opacity', 0.9)
      .on('mouseover', function (event: any, d: any) {
        d3.select(this).attr('opacity', 1)
        tooltip
            .style('visibility', 'visible')
            .html(`<b>${getDisplayName(d.name)}</b><br/>${d.text}`)
      })
      .on('mousemove', function (event: any) {
        const [x, y] = d3.pointer(event, svgContainer.value)
        tooltip
            .style('left', `${x + 15}px`)
            .style('top', `${y - 10}px`)
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.9)
        tooltip.style('visibility', 'hidden')
      })

  // 节点标签
  if (store.displaySettings.sankey.showName || store.displaySettings.sankey.showQuantity) {
    svg.append('g')
        .selectAll('.sankey-label')
        .data(sankeyData.nodes)
        .join('text')
        .attr('class', 'sankey-label')
        .attr('x', (d: any) => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
        .attr('y', (d: any) => (d.y0 + d.y1) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'end' : 'start')
        .attr('fill', '#ddd')
        .attr('font-size', '11px')
        .text((d: any) => {
          const parts: string[] = []
          if (store.displaySettings.sankey.showName) parts.push(getDisplayName(d.name))
          if (store.displaySettings.sankey.showQuantity) parts.push(d.text)
          return parts.join(' ')
        })
  }
}

// 监听数据变化重绘
watch(
    () => [store.sankeyData, store.displaySettings.sankey],
    () => {
      nextTick(drawSankey)
    },
    {deep: true}
)

// 容器尺寸监听
onMounted(() => {
  if (svgContainer.value) {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
        containerHeight.value = Math.max(400, entry.contentRect.height)
      }
      nextTick(drawSankey)
    })
    observer.observe(svgContainer.value)
  }
  nextTick(drawSankey)
})
</script>

<template>
  <div class="result-sankey-view">
    <!-- 桑基图设置 -->
    <v-row dense class="mb-2" align="center">
      <v-col cols="auto">
        <v-checkbox
            v-model="store.displaySettings.sankey.showName"
            :label="t('calculator.sankey.showName')"
            density="compact"
            hide-details
            class="d-inline-flex mr-4"
        />
      </v-col>
      <v-col cols="auto">
        <v-checkbox
            v-model="store.displaySettings.sankey.showQuantity"
            :label="t('calculator.sankey.showQuantity')"
            density="compact"
            hide-details
            class="d-inline-flex"
        />
      </v-col>
    </v-row>

    <!-- 桑基图容器 -->
    <v-card variant="text" class="sankey-container" v-if="store.sankeyData.nodes.length > 0">
      <div ref="svgContainer" class="sankey-svg-wrapper"/>
    </v-card>

    <!-- 空状态 -->
    <div v-else class="text-center py-10 opacity-40">
      <v-icon icon="mdi-chart-sankey" size="60" class="mb-3"/>
      <p class="text-body-1">添加目标以查看桑基图</p>
    </div>
  </div>
</template>

<style scoped lang="less">
.result-sankey-view {
  .sankey-container {
    overflow-x: auto;
    border-color: rgba(0, 188, 212, 0.15);
  }

  .sankey-svg-wrapper {
    position: relative;
    min-height: 400px;
    width: 100%;
  }
}
</style>
