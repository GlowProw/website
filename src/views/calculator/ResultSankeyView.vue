<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {onMounted, onBeforeUnmount, ref, watch, nextTick} from "vue";
import {useCalculatorStore} from "~/stores/calculatorStore";
import * as d3 from 'd3';
import {sankey, sankeyLinkHorizontal} from 'd3-sankey';
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t} = useI18n()
const store = useCalculatorStore()
const i18nReadName = useI18nReadName()

const svgContainer = ref<HTMLElement | null>(null)
const containerWidth = ref(900)
const currentZoomScale = ref(1)

// 保存 zoom 行为引用以供按钮控制
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

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

  // 清除旧内容
  d3.select(svgContainer.value).selectAll('*').remove()
  zoomBehavior = null
  svgSelection = null

  const margin = {top: 20, right: 160, bottom: 20, left: 160}
  const width = Math.max(400, containerWidth.value - margin.left - margin.right)
  const calculatedHeight = Math.max(300, Math.min(800, data.nodes.length * 40))
  const height = calculatedHeight - margin.top - margin.bottom

  // 外层 SVG
  const svgRoot = d3.select(svgContainer.value)
      .append('svg')
      .attr('width', '100%')
      .attr('height', calculatedHeight)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${calculatedHeight}`)
      .style('cursor', 'grab') as d3.Selection<SVGSVGElement, unknown, null, undefined>

  svgSelection = svgRoot

  // 可缩放/平移的 g 容器
  const zoomGroup = svgRoot.append('g')
      .attr('class', 'zoom-group')

  // 内容 g（带 margin）
  const svg = zoomGroup.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

  // 设置 D3 zoom
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform)
        currentZoomScale.value = Math.round(event.transform.k * 100)
      })

  svgRoot.call(zoomBehavior)
  // 禁用双击缩放
  svgRoot.on('dblclick.zoom', null)

  // 构建节点索引映射
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

  // Tooltip（挂在 svgContainer 上，不受 zoom 影响）
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
  svg.append('g')
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
  svg.append('g')
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

// 缩放控制按钮
function zoomIn() {
  if (zoomBehavior && svgSelection) {
    svgSelection.transition().duration(300).call(zoomBehavior.scaleBy, 1.3)
  }
}

function zoomOut() {
  if (zoomBehavior && svgSelection) {
    svgSelection.transition().duration(300).call(zoomBehavior.scaleBy, 0.7)
  }
}

function zoomReset() {
  if (zoomBehavior && svgSelection) {
    svgSelection.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity)
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

// 容器宽度监听
onMounted(() => {
  if (svgContainer.value) {
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (Math.abs(newWidth - containerWidth.value) > 5) {
          containerWidth.value = newWidth
          nextTick(drawSankey)
        }
      }
    })
    resizeObserver.observe(svgContainer.value)
  }
  nextTick(drawSankey)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="result-sankey-view">
    <!-- 容器 -->
    <div class="sankey-container" v-if="store.sankeyData.nodes.length > 0">
      <div ref="svgContainer" class="sankey-svg-wrapper"/>

      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <v-btn-group density="compact" variant="tonal" color="grey" direction="vertical">
          <v-btn icon="mdi-plus" size="small" @click="zoomIn" title="放大"/>
          <v-btn size="small" @click="zoomReset" :title="'重置 (' + currentZoomScale + '%)'">
            <span class="text-caption">{{ currentZoomScale }}%</span>
          </v-btn>
          <v-btn icon="mdi-minus" size="small" @click="zoomOut" title="缩小"/>
        </v-btn-group>
      </div>
    </div>

    <!-- 空状态 -->
    <v-card border v-else class="d-flex align-center justify-center py-10 opacity-40 h-screen">
      <div class="text-center">
        <v-icon icon="mdi-chart-sankey" size="160" class="mb-3"/>
        <p class="text-body-1">添加目标以查看桑基图</p>
      </div>
    </v-card>

    <!-- 设置 -->
    <v-row dense class="" align="center" v-if="store.sankeyData.nodes.length > 0">
      <v-spacer></v-spacer>
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
  </div>
</template>

<style scoped lang="less">
.result-sankey-view {
  .sankey-container {
    position: relative;
  }

  .sankey-svg-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;

    :deep(svg) {
      display: block;

      &:active {
        cursor: grabbing;
      }
    }
  }

  .zoom-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
  }
}
</style>
