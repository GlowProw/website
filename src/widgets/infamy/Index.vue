<script setup lang="ts">
// 恶名基础等级阶段 (Journey to Kingpin, I ~ X)
const baseRanks = [
  {
    id: "outcast",
    level: "I",
    name: "弃民",
    enName: "Outcast",
    requiredInfamy: 0,
    icon: "/images/emote/snb-Infamy/outcast.webp",
    desc: "初始恶名起点。漂流至圣安妮，开启你在印度洋的无畏航程。"
  },
  {
    id: "scoundrel",
    level: "II",
    name: "流氓",
    enName: "Scoundrel",
    requiredInfamy: 725,
    icon: "/images/emote/snb-Infamy/scoundrel.webp",
    desc: "初步涉足公海劫掠，解锁小型单桅帆船与基础海盗装配。"
  },
  {
    id: "rover",
    level: "III",
    name: "游荡者",
    enName: "Rover",
    requiredInfamy: 2205,
    icon: "/images/emote/snb-Infamy/rover.webp",
    desc: "熟悉沿海航线，解锁初级中型战船制造与基础火炮蓝图。"
  },
  {
    id: "freebooter",
    level: "IV",
    name: "自由劫掠者",
    enName: "Freebooter",
    requiredInfamy: 4055,
    icon: "/images/emote/snb-Infamy/freebooter.webp",
    desc: "开启区域走私网络与工坊工匠，解锁高阶海战材料提炼。"
  },
  {
    id: "buccaneer",
    level: "V",
    name: "海盗狂徒",
    enName: "Buccaneer",
    requiredInfamy: 6555,
    icon: "/images/emote/snb-Infamy/buccaneer.webp",
    desc: "驰骋远洋水域，解锁坚固战舰装甲、远程长炮与迫击炮。"
  },
  {
    id: "brigand",
    level: "VI",
    name: "绿林强盗",
    enName: "Brigand",
    requiredInfamy: 9930,
    icon: "/images/emote/snb-Infamy/brigand.webp",
    desc: "掌控深海劫掠，解锁重型双桅帆船与高级据点走私特权。"
  },
  {
    id: "marauder",
    level: "VII",
    name: "掠夺者",
    enName: "Marauder",
    requiredInfamy: 15305,
    icon: "/images/emote/snb-Infamy/marauder.webp",
    desc: "获准参与高危要塞掠夺、商队劫掠与传奇藏宝图寻宝。"
  },
  {
    id: "corsair",
    level: "VIII",
    name: "私掠海盗",
    enName: "Corsair",
    requiredInfamy: 21305,
    icon: "/images/emote/snb-Infamy/corsair.webp",
    desc: "令各方势力敬畏的私掠强者，解锁顶级特种武器与船体涂装。"
  },
  {
    id: "cutthroat",
    level: "IX",
    name: "割喉者",
    enName: "Cutthroat",
    requiredInfamy: 27905,
    icon: "/images/emote/snb-Infamy/cutthroat.webp",
    desc: "恶名巅峰前夕，解锁高阶船甲、重炮配件与全套大师蓝图。"
  },
  {
    id: "kingpin",
    level: "X",
    name: "魁首",
    enName: "Kingpin",
    requiredInfamy: 39030,
    icon: "/images/emote/snb-Infamy/kingpin.webp",
    desc: "终极恶名阶层！开启走私帝国舵手网络（The Helm）与巅峰里程碑进阶。"
  }
];

// 魁首巅峰里程碑 (Kingpin Milestones & Beyond)
const kingpinTiers = [
  {
    id: "copper",
    title: "青铜魁首勋章",
    enTitle: "Kingpin Copper",
    levelRange: "100 ~ 500 级",
    desc: "达成魁首后的首个里程碑梯队，见证海盗帝国奠基与远洋扩张。",
    items: [
      {
        level: 100,
        name: "青铜魁首 100 级",
        enName: "Kingpin Copper 100",
        requiredInfamy: 1326780,
        icon: "/images/emote/snb-Infamy/kingpin copper-100.webp",
        desc: "迈入魁首首个百级大关，开启青铜巅峰海盗勋章。"
      },
      {
        level: 200,
        name: "青铜魁首 200 级",
        enName: "Kingpin Copper 200",
        requiredInfamy: 2826780,
        icon: "/images/emote/snb-Infamy/kingpin copper-200.webp",
        desc: "持续扩张走私网络与势力范围，恶名积累达到新高度。"
      },
      {
        level: 300,
        name: "青铜魁首 300 级",
        enName: "Kingpin Copper 300",
        requiredInfamy: 4326780,
        icon: "/images/emote/snb-Infamy/kingpin copper-300.webp",
        desc: "稳固公海霸权，见证青铜中阶海盗帝国的崛起。"
      },
      {
        level: 400,
        name: "青铜魁首 400 级",
        enName: "Kingpin Copper 400",
        requiredInfamy: 5826780,
        icon: "/images/emote/snb-Infamy/kingpin copper-400.webp",
        desc: "纵横远洋诸岛，掠夺与贸易影响力遍及各处海域。"
      },
      {
        level: 500,
        name: "青铜魁首 500 级",
        enName: "Kingpin Copper 500",
        requiredInfamy: 7326780,
        icon: "/images/emote/snb-Infamy/kingpin copper-500.webp",
        desc: "达成青铜勋章最高极境，即将跃升至白银位阶。"
      }
    ]
  },
  {
    id: "silver",
    title: "白银魁首勋章",
    enTitle: "Kingpin Silver",
    levelRange: "600 ~ 1000 级",
    desc: "纵横印度洋的风暴主宰，掌握庞大走私据点与巨额白银收入。",
    items: [
      {
        level: 600,
        name: "白银魁首 600 级",
        enName: "Kingpin Silver 600",
        requiredInfamy: 8826780,
        icon: "/images/emote/snb-Infamy/kingpin silver-600.webp",
        desc: "晋升白银位阶！象征支配印度洋核心航线的强大号召力。"
      },
      {
        level: 700,
        name: "白银魁首 700 级",
        enName: "Kingpin Silver 700",
        requiredInfamy: 10326780,
        icon: "/images/emote/snb-Infamy/kingpin silver-700.webp",
        desc: "庞大舰队在公海所向披靡，获得深海各方阵营敬畏。"
      },
      {
        level: 800,
        name: "白银魁首 800 级",
        enName: "Kingpin Silver 800",
        requiredInfamy: 11826780,
        icon: "/images/emote/snb-Infamy/kingpin silver-800.webp",
        desc: "坐拥巨额白银财富与走私据点，统御多处走私贸易链。"
      },
      {
        level: 900,
        name: "白银魁首 900 级",
        enName: "Kingpin Silver 900",
        requiredInfamy: 13326780,
        icon: "/images/emote/snb-Infamy/kingpin silver-900.webp",
        desc: "白银巅峰之境，威名传遍整个印度洋及外洋群岛。"
      },
      {
        level: 1000,
        name: "白银魁首 1000 级",
        enName: "Kingpin Silver 1000",
        requiredInfamy: 14826780,
        icon: "/images/emote/snb-Infamy/kingpin silver-1000.webp",
        desc: "达成千级巅峰里程碑！解锁白银极境，迈向黄金时代。"
      }
    ]
  },
  {
    id: "gold",
    title: "黄金魁首勋章",
    enTitle: "Kingpin Gold",
    levelRange: "1100 ~ 1500 级",
    desc: "印度洋至尊霸主，象征无与伦比的威望与最高荣耀巅峰。",
    items: [
      {
        level: 1100,
        name: "黄金魁首 1100 级",
        enName: "Kingpin Gold 1100",
        requiredInfamy: 16326780,
        icon: "/images/emote/snb-Infamy/kingpin gold-1100.webp",
        desc: "荣登黄金至尊位阶！公海之上无可争议的传奇霸主。"
      },
      {
        level: 1200,
        name: "黄金魁首 1200 级",
        enName: "Kingpin Gold 1200",
        requiredInfamy: 17826780,
        icon: "/images/emote/snb-Infamy/kingpin gold-1200.webp",
        desc: "荣耀与财富的巅峰体现，象征无人匹敌的极高声望。"
      },
      {
        level: 1300,
        name: "黄金魁首 1300 级",
        enName: "Kingpin Gold 1300",
        requiredInfamy: 19326780,
        icon: "/images/emote/snb-Infamy/kingpin gold-1300.webp",
        desc: "令所有海上舰队与要塞闻风丧胆的黄金高阶海盗巨擘。"
      },
      {
        level: 1400,
        name: "黄金魁首 1400 级",
        enName: "Kingpin Gold 1400",
        requiredInfamy: 20826780,
        icon: "/images/emote/snb-Infamy/kingpin gold-1400.webp",
        desc: "巅峰恶名近在咫尺，傲视整个大洋航道的绝对统治力。"
      },
      {
        level: 1500,
        name: "黄金魁首 1500 级",
        enName: "Kingpin Gold 1500",
        requiredInfamy: 22326780,
        icon: "/images/emote/snb-Infamy/kingpin gold-1500.webp",
        desc: "达成当前版本 1500 级终极极境！荣获黄金极境勋章。"
      }
    ]
  }
];

const formatNumber = (val: number) => val.toLocaleString("en-US");
</script>

<template>
  <v-card
    width="1080px"
    variant="text"
    border
    class="py-12 px-12 mx-auto mb-10 infamy-guide d-flex flex-column gap-16"
  >
    <!-- 1. 恶名晋升之旅 (Journey to Kingpin) -->
    <div>
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">恶名系统与晋升之旅</h2>
        <p class="opacity-70 max-w-800 mx-auto text-body-1">
          恶名 是船长航海资历与声望实力的象征。提升恶名不仅能解锁各型船只图纸、强力武器与强化配方，更能解锁高阶装备的使用限制。从初出茅庐的“弃民 ”开始，历经十阶磨炼，最终登顶成为威震公海的“魁首”。
        </p>
      </div>

      <v-row class="d-flex align-stretch my-4">
        <v-col
          v-for="item in baseRanks"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          lg="2-4"
          class="d-flex"
        >
          <v-card
            variant="outlined"
            class="rank-card px-4 py-8 d-flex flex-column align-center text-center w-100"
          >
    
            <div class="rank-icon-wrapper mb-3">
              <v-img
                :src="item.icon"
                width="84"
                height="84"
                class="rank-img"
                contain
              />
            </div>

            <h3 class="text-subtitle-1 font-weight-bold mb-2">{{ item.name }}</h3>

            <div class="d-flex ga-2">
              <v-chip
              size="x-small"
              color="amber-accent-3"
              variant="tonal"
              class="mb-3 font-weight-medium"
            >
              恶名: {{ formatNumber(item.requiredInfamy) }}
            </v-chip>
            <v-chip 
                    size="x-small"
              color="amber-accent-3"
              variant="tonal"
              class="mb-3 font-weight-medium">
              位阶 {{ item.level }}
            </v-chip>
            </div>
            <p class="opacity-70 text-left text-desc mb-0">
              {{ item.desc }}
            </p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 2. 魁首巅峰里程碑 (Kingpin and Beyond) -->
    <div class="mt-4">
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">魁首巅峰里程碑</h2>
        <p class="opacity-70 max-w-800 mx-auto text-body-1">
          达到“魁首”后，恶名征程将迈入巅峰阶段。每提升 100 级魁首等级均可获得对应阶段的专属恶名勋章。目前共分为青铜、白银、黄金三大位阶梯队（每 500 级为一个阶段），共计 15 枚专属勋章图标。
        </p>
      </div>

      <!-- 遍历三大位阶梯队，统一采用 rank-card 卡片样式 -->
      <div v-for="tier in kingpinTiers" :key="tier.id" class="mb-10">
        <div class="text-center mb-6">
          <h3 class="text-h5 font-weight-bold mb-1">
            {{ tier.title }}
            <p class="text-subtitle-2 opacity-50 ml-2 font-weight-normal">{{ tier.levelRange }}</p>
          </h3>
          <!-- <p class="opacity-60 max-w-800 mx-auto text-body-2 mb-0">
            {{ tier.desc }}
          </p> -->
        </div>

        <v-row class="d-flex align-stretch my-4">
          <v-col
            v-for="item in tier.items"
            :key="item.level"
            cols="12"
            sm="6"
            md="4"
            lg="2-4"
            class="d-flex"
          >
            <v-card
              variant="outlined"
              class="rank-card px-4 py-8 d-flex flex-column align-center text-center w-100"
            >
              <div class="rank-icon-wrapper mb-3">
                <v-img
                  :src="item.icon"
                  width="84"
                  height="84"
                  class="rank-img"
                  contain
                />
              </div>

              <h3 class="text-subtitle-1 font-weight-bold mb-2">{{ item.name }}</h3>

              <v-chip
                size="x-small"
                color="amber-accent-3"
                variant="tonal"
                class="mb-3 font-weight-medium"
              >
                恶名: {{ formatNumber(item.requiredInfamy) }}
              </v-chip>

              <p class="opacity-70 text-left text-desc mb-0">
                {{ item.desc }}
              </p>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.infamy-guide {
  width: 100%;
}

.max-w-800 {
  max-width: 800px;
}

.text-desc {
  line-height: 1.6;
}

.gap-16 {
  gap: 48px;
}

/* 统一恶名与魁首卡片样式 */
.rank-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.rank-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 193, 7, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.level-badge {
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.rank-icon-wrapper {
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
}

.rank-card:hover .rank-icon-wrapper {
  transform: scale(1.08);
}
</style>
