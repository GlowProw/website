<script setup lang="ts">
// 伤害类型图标 (Damage Types)
import imgFire from "@/assets/images/snb/damageTypes/fire.png";
import imgExplosive from "@/assets/images/snb/damageTypes/explosive.png";
import imgFlooding from "@/assets/images/snb/damageTypes/flooding.png";
import imgPiercing from "@/assets/images/snb/damageTypes/piercing.png";
import imgElectric from "@/assets/images/snb/damageTypes/electric.png";
import imgToxic from "@/assets/images/snb/damageTypes/toxic.png";

// 状态效果图标 (Status Effects & Season Modifiers)
import imgPicture1 from "@/assets/images/snb/statusEffects/Picture1.png";
import imgPicture2 from "@/assets/images/snb/statusEffects/Picture2.png";
import imgPicture3 from "@/assets/images/snb/statusEffects/Picture3.png";
import imgPicture4 from "@/assets/images/snb/statusEffects/Picture4.png";
import imgPicture5 from "@/assets/images/snb/statusEffects/Picture5.png";
import imgPicture6 from "@/assets/images/snb/statusEffects/Picture6.png";
import imgPicture7 from "@/assets/images/snb/statusEffects/Picture7.png";
import imgPicture8 from "@/assets/images/snb/statusEffects/Picture8.png";
import imgPicture9 from "@/assets/images/snb/statusEffects/Picture9.png";
import imgPicture10 from "@/assets/images/snb/statusEffects/Picture10.png";
import imgPicture11 from "@/assets/images/snb/statusEffects/Picture11.png";
import imgPicture12 from "@/assets/images/snb/statusEffects/Picture12.png";
import imgPicture13 from "@/assets/images/snb/statusEffects/Picture13.png";
import imgPicture14 from "@/assets/images/snb/statusEffects/Picture14.png";
import imgPicture15 from "@/assets/images/snb/statusEffects/Picture15.png";
import imgPicture16 from "@/assets/images/snb/statusEffects/Picture16.png";
import imgPicture17 from "@/assets/images/snb/statusEffects/Picture17.png";
import imgPicture18 from "@/assets/images/snb/statusEffects/Picture18.png";

const damageTypes = [
  {
    id: "fire",
    name: "火焰型",
    icon: imgFire,
    desc: "燃烧伤害，可造成高额持续伤害与引燃效果。"
  },
  {
    id: "explosive",
    name: "爆炸型",
    icon: imgExplosive,
    desc: "范围爆破伤害，可造成震荡与范围溅射效果。"
  },
  {
    id: "flooding",
    name: "进水型",
    icon: imgFlooding,
    desc: "船体进水伤害，造成严重持续伤害并削减航速。"
  },
  {
    id: "piercing",
    name: "穿透型",
    icon: imgPiercing,
    desc: "破甲穿透伤害，对高防御装甲造成即时重创与削减。"
  },
  {
    id: "electric",
    name: "电击型",
    icon: imgElectric,
    desc: "雷电电流伤害，释放链式电弧与连锁放电效果。"
  },
  {
    id: "toxic",
    name: "剧毒型",
    icon: imgToxic,
    desc: "腐蚀剧毒伤害，持续消耗船员体力并部分无视防御。"
  }
];

const statusEffects = [
  {
    id: "tornSails",
    name: "船帆撕裂",
    icon: imgPicture1,
    desc: "任意武器对船帆造成的伤害均可导致目标累积“船帆撕裂”状态效果。受影响的目标速度降低 75％。\n海怪不会受到“船帆撕裂”的影响。"
  },
  {
    id: "burning",
    name: "燃烧",
    icon: imgPicture2,
    desc: "燃烧伤害可导致目标累积“燃烧”状态效果。受影响的目标将持续受到大量伤害。\n海怪可以进入燃烧状态。"
  },
  {
    id: "flooding",
    name: "进水",
    icon: imgPicture3,
    desc: "进水伤害可导致目标累积“进水”状态效果。受影响的目标将持续受到中等伤害（其中 50％ 为严重伤害），且速度降低 25％。\n海怪会受到“进水”状态效果的影响，不过速度不会降低。"
  },
  {
    id: "thunderstorm",
    name: "雷暴",
    icon: imgPicture4,
    desc: "电击伤害可导致目标累积“雷暴”状态效果。受影响的目标将定时释放大量电流，对自己和附近目标造成伤害。受影响目标周围每增加一个目标，造成的伤害都会增加。\n海怪会受到“雷暴”状态效果的影响。"
  },
  {
    id: "taunt",
    name: "嘲讽",
    icon: imgPicture5,
    desc: "拥有挑衅能力的武器可导致目标累积“嘲讽”状态效果。受影响的目标会以你为攻击目标（仅限 PVE），且造成的伤害降低。\n海怪能被嘲讽。"
  },
  {
    id: "pierced",
    name: "击穿",
    icon: imgPicture6,
    desc: "穿透型伤害可导致目标累积“击穿”状态效果。受影响的目标会立即受到大量伤害。同时使目标的装甲降低 300。\n海怪能被击穿。"
  },
  {
    id: "concussion",
    name: "弹震",
    icon: imgPicture7,
    desc: "爆炸伤害可导致目标累积“弹震”状态效果，受其影响的目标在短时间无法发射武器。这一效果之后还会引发爆炸，对受影响目标及其附近的敌人造成大量伤害。\n海怪虽然会受到“弹震”状态效果的影响，但仍会继续攻击目标。"
  },
  {
    id: "poisoned",
    name: "中毒",
    icon: imgPicture8,
    desc: "剧毒伤害可导致目标累积“中毒”状态效果。剧毒伤害会消耗目标的部分体力。中毒状态效果完全累积后，受到影响的目标会在效果生效期间持续受到伤害，且防御时消耗的船员体力会增加 60％。\n此外，处于中毒状态时，受到的 50％ 伤害会无视防御。海怪会中毒。"
  },
  {
    id: "healingCurse",
    name: "禁疗诅咒",
    icon: imgPicture9,
    desc: "对自身的治疗效果降低 50％，并使盟友无法为你提供治疗。"
  },
  {
    id: "exhaustion",
    name: "衰竭",
    icon: imgPicture10,
    desc: "目标无法恢复体力，且防御时会额外消耗体力。"
  },
  {
    id: "frostbite",
    name: "冻伤",
    icon: imgPicture11,
    desc: "目标将持续受到伤害，航行速度和装填速度分别降低 60％ 和 10％。\n进水时，会将所有持续进水伤害转化为瞬时伤害。"
  },
  {
    id: "abyssalShame",
    name: "深渊耻辱",
    icon: imgPicture12,
    desc: "深渊耻辱状态效果计量条会在每次命中时填充，直到施加该状态效果。一旦施加，该状态效果会使目标的所有维修量降低 50％，直到效果被移除，或是持续时间结束。使用任何恢复用品或前往窝点/据点停泊，可以手动移除此效果。"
  },
  {
    id: "weakness",
    name: "破绽",
    icon: imgPicture13,
    desc: "对船只造成伤害可导致目标累积“破绽”状态效果。对受影响的目标可以发动船员进攻和船员终结。\n海怪不会受到“破绽”状态效果的影响。"
  }
];

const seasonModifiers = [
  {
    id: "ragingBull",
    name: "狂暴公牛",
    icon: imgPicture14,
    desc: "进入狂暴悍兽状态，伤害提升 20 / 40 %。\n如果在 10 秒内受到 10 次攻击，则狂暴悍兽状态会失效 20 秒。"
  },
  {
    id: "armorShredder",
    name: "破甲减防",
    icon: imgPicture15,
    desc: "使 150 米范围内附近敌对船只的装甲降低 150 / 200。\n基于降低的装甲值获得等量装甲加成，最高可达 600。"
  },
  {
    id: "achillesHeel",
    name: "阿喀琉斯之踵",
    icon: imgPicture16,
    desc: "获得 35 / 50 ％伤害抗性。\n弱点受到攻击后，伤害抗性会失效 10 秒。摧毁全部弱点后，伤害抗性会永久失效。"
  },
  {
    id: "avenger",
    name: "复仇者",
    icon: imgPicture17,
    desc: "在 300 米范围内，每有一名盟友被击杀，可获得一层 4 / 5 ％伤害提升（持续 15 秒），最高可达 32 / 40 %。\n如果被击沉的是非精英船只，则每次获得的伤害提升翻倍。"
  },
  {
    id: "tightFormation",
    name: "密集队形",
    icon: imgPicture18,
    desc: "附近每有一个盟友，获得 10 / 12 ％伤害抗性，最多可达 5 层。"
  }
];
</script>

<template>
  <v-card width="1080px" variant="text" border 
    class="py-12 px-12 mx-auto mb-10 combat-effect-guide d-flex flex-column gap-16">
    <!-- 1. 伤害类型 -->
    <div>
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">伤害类型</h2>
        <p class="opacity-70 max-w-800 mx-auto text-body-1">
          每一种武器都会对装甲造成主要伤害。通过以下不同伤害类型的组合可以造成额外伤害：火焰型、爆炸型、进水型、穿透型、电击型、剧毒型。相应抗性可降低这些伤害。查看手稿获取更多信息。
        </p>
      </div>
      <v-row class="d-flex align-start my-4">
        <v-col
          v-for="item in damageTypes"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          class="text-center py-4"
        >
          <v-card class="icon-wrapper d-inline-flex align-center justify-center mb-3">
            <v-img :src="item.icon" width="55" height="55" class="icon-img" contain />
          </v-card>
          <div>
            <p class="text-h6 font-weight-bold mb-1">{{ item.name }}</p>
            <div class="px-2 text-left">
              <p
                v-for="(line, lineIdx) in item.desc.split('\n')"
                :key="lineIdx"
                class="opacity-60 text-desc mb-0"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- 2. 状态效果 -->
    <div class="my-16">
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">状态效果</h2>
        <p class="opacity-70 max-w-800 mx-auto text-body-1">
          状态效果是能够改变战局的强大效果。有多种武器和能力可以累积这些状态效果。效果完全累积后，实体就会受到影响，并在该状态效果生效期间始终受其效果影响。大多数状态效果可通过恢复用品立即移除，也可以等待时间过去自然失效。海怪会受到状态效果的影响。
        </p>
      </div>
      <v-row class="d-flex align-start my-4">
        <v-col
          v-for="item in statusEffects"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          class="text-center py-4"
        >
          <div class="status-card-icon d-inline-flex align-center justify-center mb-3">
            <v-img :src="item.icon" width="70" height="70" class="card-img" contain />
          </div>
          <div>
            <p class="text-h6 font-weight-bold mb-1">{{ item.name }}</p>
            <div class="px-2 text-left">
              <p
                v-for="(line, lineIdx) in item.desc.split('\n')"
                :key="lineIdx"
                class="opacity-60 text-desc section-intro mb-0"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- 3. 赛季附加效果 -->
    <div>
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">赛季附加效果</h2>
        <p class="opacity-70 max-w-800 mx-auto text-body-1">
          从世界 3 开始，敌方船只将有几率获得赛季附加效果。赛季附加效果会赋予敌人强力技能，其威力会随着世界位阶的提升而增强。当心这些危险的敌人，并针对此类威胁制定战斗策略。
        </p>
      </div>
      <v-row class="d-flex align-start my-4">
        <v-col
          v-for="item in seasonModifiers"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          class="text-center py-4"
        >
          <div class="status-card-icon d-inline-flex align-center justify-center mb-3">
            <v-img :src="item.icon" width="70" height="70" class="card-img" contain />
          </div>
          <div>
            <p class="text-h6 font-weight-bold mb-1">{{ item.name }}</p>
            <div class="px-2 text-left">
              <p
                v-for="(line, lineIdx) in item.desc.split('\n')"
                :key="lineIdx"
                class="opacity-60 text-desc section-intro mb-0"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<style scoped>
.combat-effect-guide {
  width: 100%;
}

.max-w-800 {
  max-width: 800px;
}

.section-intro {
  text-indent: 1em;
  text-align: left;
  line-height: 1.7;
}

.text-desc {
  line-height: 1.6;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  transition: all 0.3s ease;
}

.icon-wrapper:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.status-card-icon {
  width: 80px;
  height: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.status-card-icon:hover {
  transform: scale(1.05);
}
</style>
