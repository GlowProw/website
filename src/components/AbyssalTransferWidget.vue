<script setup lang="ts">
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import ItemIconWidget from "./snbWidget/itemIconWidget.vue";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import MaterialIconWidget from "./snbWidget/materialIconWidget.vue";

// 阶卡槽品质（列维度 Columns）
const columns = [
  {
    id: "uncommon",
    name: "普通",
    tier: "T1",
    level: 1,
    color: "#2ecc71",
    rhombusProps: {
      border: true,
      slotActivate: true,
      activateColor: "#2ecc71",
      inactiveColor: "rgb(46 204 113 / 35%)",
      size: 22
    }
  },
  {
    id: "rare",
    name: "稀有",
    tier: "T2",
    level: 2,
    color: "#38bdf8",
    rhombusProps: {
      border: true,
      slotActivate: true,
      activateColor: "#38bdf8",
      inactiveColor: "rgb(56 189 248 / 35%)",
      size: 22
    }
  },
  {
    id: "epic",
    name: "史诗",
    tier: "T3",
    level: 3,
    color: "#c084fc",
    rhombusProps: {
      border: true,
      slotActivate: true,
      activateColor: "#c084fc",
      inactiveColor: "rgb(192 132 252 / 35%)",
      size: 22
    }
  },
  {
    id: "legendary",
    name: "大师",
    tier: "T4",
    level: 4,
    color: "#f59e0b",
    rhombusProps: {
      border: true,
      borderActivate: true,
      slotActivate: true,
      slotHighlightActivate: true,
      glow: true,
      activateColor: "#f59e0b",
      size: 22
    }
  }
];

//  阶稀有度差异（行维度 Rows）
const rows = [
  {
    id: "sameItem",
    title: "同物品",
    example: "白炮 → 白炮",
    badgeColor: "success",
    essence: { base: 0, mastery: 0 },
    // 4 个卡槽品质对应的助熔剂消耗 (T1, T2, T3, T4)
    fluxList: [
      { base: 20, mastery: 20 },
      { base: 40, mastery: 40 },
      { base: 60, mastery: 60 },
      { base: 80, mastery: 80 }
    ]
  },
  {
    id: "sameRarity",
    title: "同稀有度",
    example: "紫色 → 紫色",
    badge: "同阶跨物",
    badgeColor: "info",
    essence: { base: 250, mastery: 500 },
    fluxList: [
      { base: 40, mastery: 60 },
      { base: 60, mastery: 80 },
      { base: 80, mastery: 100 },
      { base: 100, mastery: 120 }
    ]
  },
  {
    id: "diff1",
    title: "相差 1 个稀有度",
    example: "紫色 → 蓝色",
    badge: "相差 1 阶",
    badgeColor: "primary",
    essence: { base: 500, mastery: 1000 },
    fluxList: [
      { base: 60, mastery: 100 },
      { base: 80, mastery: 120 },
      { base: 100, mastery: 140 },
      { base: 120, mastery: 160 }
    ]
  },
  {
    id: "diff2",
    title: "相差 2 个稀有度",
    example: "紫色 → 绿色",
    badge: "相差 2 阶",
    badgeColor: "warning",
    essence: { base: 750, mastery: 1500 },
    fluxList: [
      { base: 80, mastery: 140 },
      { base: 100, mastery: 160 },
      { base: 120, mastery: 180 },
      { base: 140, mastery: 200 }
    ]
  },
  {
    id: "diff3",
    title: "相差 3 个稀有度",
    example: "紫色 → 灰色",
    badge: "相差 3 阶 (极限)",
    badgeColor: "error",
    essence: { base: 1000, mastery: 2000 },
    fluxList: [
      { base: 100, mastery: 180 },
      { base: 120, mastery: 200 },
      { base: 140, mastery: 220 },
      { base: 160, mastery: 240 }
    ]
  }
];
</script>

<template>
  <v-card
      width="1500px"
      variant="text"
      border
      class="py-12 px-10 mx-auto abyssal-transfer-widget d-flex flex-column gap-10">

    <!-- 顶部标题 -->
    <div class="text-center mb-13">
      <h2 class="text-h4 font-weight-bold mb-3 tracking-wide text-white">
        深渊词条转移对照矩阵
      </h2>
      <p class="opacity-60 mx-auto">
        横向为卡槽品质等级（列），纵向为武器稀有度阶差（行），行列交叉单元格即为转移最终所需消耗
      </p>
    </div>

    <!-- 核心：行与列交叉对照表 (Cross Matrix Table) - 只读一览 -->
    <div class="cross-matrix-card overflow-hidden">
      <div class="matrix-table-wrapper">
        <table class="cross-matrix-table">
          <!-- 表头：列定义 (卡槽品质等级) -->
          <thead>
          <tr>
            <!-- 左上角交叉坐标轴标头 & 图例指示 -->
            <th class="axis-corner-cell">
            </th>

            <!-- 4 个品质卡槽列 -->
            <th
                v-for="col in columns"
                :key="col.id"
                class="col-header-cell"
                :class="`col-${col.id}`">
              <div class="d-flex flex-column align-center justify-center py-2">
                <span class="font-weight-bold text-h6" :style="{color: col.color}">
                  {{ col.name }}
                </span>
              </div>
            </th>

            <!-- 右侧深渊精华列（按行同阶固定） -->
            <th class="essence-header-cell text-center">
              <div class="d-flex ga-2 align-center justify-center py-2">
                <ItemSlotBase size="40px">
                  <MaterialIconWidget :id="'abyssalEssence'"></MaterialIconWidget>
                </ItemSlotBase>
                <span class="text-subtitle-2">深渊精华消耗</span>
              </div>
            </th>
          </tr>
          </thead>

          <!-- 表体：行定义 (稀有度差异) 与 交叉单元格 -->
          <tbody>
          <tr
              v-for="(row, rIdx) in rows"
              :key="row.id"
              :class="{ 'row-alt': rIdx % 2 === 1 }">

            <!-- 行首标题列 -->
            <th class="row-header-cell">
              <div class="d-flex align-center justify-space-between ga-2">
                <div>
                  <div class="font-weight-bold text-white text-h5 u">{{ row.title }}</div>
                  <div class="opacity-60 mt-1">示例: {{ row.example }}</div>
                </div>
              </div>
            </th>

            <!-- 4 个交叉单元格 (Row x Col Intersection) - 纯只读展示 -->
            <td
                v-for="(col, cIdx) in columns"
                :key="row.id + '-' + col.id"
                class="cross-cell"
                :class="`col-${col.id}`">
              <div class="cell-content-all">
                <v-row no-gutters class="cost-line-flux d-flex align-center justify-space-between my-0">
                  <v-col cols="4"></v-col>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <RhombusWidget border border-activate slot-activate :size="20"/>
                  </v-col>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <RhombusWidget border border-activate slot-activate adept-activate :size="20"/>
                  </v-col>
                </v-row>

                <v-row no-gutters class="cost-line-flux d-flex align-center justify-space-between">
                  <v-col cols="4">
                    <ItemSlotBase size="40px" class="ml-n1">
                      <MaterialIconWidget :id="'ascensionFlux'"></MaterialIconWidget>
                    </ItemSlotBase>
                  </v-col>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <span>{{ row.fluxList[cIdx].base }}</span>
                  </v-col>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <span class="text-amber-lighten-2">{{ row.fluxList[cIdx].mastery }}</span>
                  </v-col>
                </v-row>

                <v-row no-gutters class="cost-line-flux d-flex align-center justify-space-between">
                  <v-col cols="4">
                    <ItemSlotBase size="40px" class="ml-n1">
                      <MaterialIconWidget :id="'abyssalEssence'"></MaterialIconWidget>
                    </ItemSlotBase>
                  </v-col>
                  <template v-if="row.essence.base === 0">
                    <v-col cols="8" class="d-flex align-center ga-1">
                      <span class="text-caption-2 text-center w-100">免费</span>
                    </v-col>
                  </template>
                  <template v-else>
                    <v-col class="d-flex align-center justify-center ga-1">
                      <span>{{ row.essence.base }}</span>
                    </v-col>
                    <v-col class="d-flex align-center justify-center ga-1">
                      <span class="text-amber-lighten-2">{{ row.essence.mastery }}</span>
                    </v-col>
                  </template>
                </v-row>
              </div>
            </td>

            <!-- 该行深渊精华总消耗 -->
            <td class="essence-col-cell text-center py-3">
              <v-row no-gutters class="cost-line-flux d-flex align-center justify-space-between my-0" v-if="row.essence.base !== 0">
                <v-col class="d-flex align-center justify-center ga-1">
                  <RhombusWidget border border-activate slot-activate :size="20"/>
                </v-col>
                <v-col class="d-flex align-center justify-center ga-1">
                  <RhombusWidget border border-activate slot-activate adept-activate :size="20"/>
                </v-col>
              </v-row>

              <v-row no-gutters class="cost-line-flux d-flex align-center justify-space-between my-0 mt-2">
                <template v-if="row.essence.base === 0" class="d-inline-flex align-center ga-1">
                  <v-col class="d-flex align-center justify-center ga-1">
                    <span>免费</span>
                  </v-col>
                </template>
                <template v-else>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <span>{{ row.essence.base }}</span>
                  </v-col>
                  <v-col class="d-flex align-center justify-center ga-1">
                    <span class="text-amber-lighten-2">{{ row.essence.mastery }}</span>
                  </v-col>
                </template>
              </v-row>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

  </v-card>
</template>

<style scoped lang="less">
.abyssal-transfer-widget {
  background: radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
}

.max-w-850 {
  max-width: 850px;
}

// 矩阵卡片与表格
.cross-matrix-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.matrix-table-wrapper {
  overflow-x: auto;
}

.cross-matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th, td {
    padding: 14px 16px;
  }
}

// 坐标原点
.axis-corner-cell {
  width: 150px;
  vertical-align: middle;
}

// 列头
.col-header-cell {
  width: 175px;
}

.essence-header-cell {
  width: 135px;
}

// 行头
.row-header-cell {
}

.row-alt {
}

// 交叉单元格 (Cross Cell) - 静态只读
.cross-cell {
  position: relative;
  vertical-align: middle;
}

.essence-col-cell {
  background-color: rgba(192, 132, 252, 0.04);
}

// 各列专属背景色
.col-uncommon {
  background-color: rgba(46, 204, 113, 0.08);

  &.col-header-cell {
    background-color: rgba(46, 204, 113, 0.08);
  }
}

.col-rare {
    background-color: rgba(56, 189, 248, 0.08);

  &.col-header-cell {
    background-color: rgba(56, 189, 248, 0.08);
  }
}

.col-epic {
  background-color: rgba(192, 132, 252, 0.08);

  &.col-header-cell {
    background-color: rgba(192, 132, 252, 0.08);
  }
}

.col-legendary {
  background-color: rgba(245, 158, 11, 0.08);

  &.col-header-cell {
    background-color: rgba(245, 158, 11, 0.08);
  }
}

.essence-header-cell {
  background-color: #000;
}
</style>
