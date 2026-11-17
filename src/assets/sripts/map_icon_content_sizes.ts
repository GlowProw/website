/**
 * 地图标记图标实际不透明内容最长边尺寸预计算表 (基于 200px 基准参考尺寸)
 * 提前测算避免运行时通过 Canvas 逐张网络下载测量带来的初始图标大小不一以及数秒后的尺寸突变闪烁
 */
export const PRECOMPUTED_ICON_SIZES: Record<string, number> = {
  // 本地地图图标 (512px / 200px 等素材)
  abaka: 384,
  acacia: 464,
  activityCutthroatCargo: 480,
  activityCutthroatCargoParticipant: 376,
  archive: 200,
  bogIron: 368,
  bossFight: 480,
  bounty: 200,
  capitalSettlement: 496,
  cobalt: 384,
  coconut: 400,
  copper: 384,
  crocodile: 440,
  customMarker: 504,
  customMarkerX: 320,
  cutthroatCargo: 456,
  default: 200,
  den: 480,
  durian: 448,
  eventBaseWorld: 416,
  eventPlayerActivities: 416,
  eventShop: 488,
  floatingWreckages: 384,
  foundry: 480,
  greenheart: 432,
  guardTower: 328,
  helmEmpireNonPoi: 672,
  helmEmpirePoiGin: 416,
  helmEmpirePoiOpium: 424,
  helmEmpirePoiRum: 432,
  helmEmpirePoiSnuff: 400,
  helmEmpireRepair: 480,
  hemp: 416,
  hippopotamus: 464,
  iroko: 440,
  ironwood: 448,
  juniper: 400,
  jute: 384,
  linen: 400,
  lteS1: 488,
  lumberyard: 472,
  magnetite: 400,
  mainContract: 194,
  mapShipwreck: 496,
  megafort: 496,
  megalodon: 440,
  merchantShip: 488,
  militaryBase: 480,
  miscellaneous: 200,
  mopane: 416,
  ndizi: 336,
  nickel: 408,
  outpost: 456,
  pirateAffairsRivalHunt: 408,
  pureIron: 368,
  ramie: 424,
  roselle: 384,
  scoutingAxe: 288,
  scoutingFruits: 224,
  scoutingPickaxe: 216,
  scoutingShipwreck: 280,
  scoutingSickle: 224,
  screwpine: 368,
  searchArea: 496,
  settlement: 496,
  shareLocation: 200,
  shark: 400,
  shipwreck: 384,
  sideContract: 200,
  sisal: 352,
  smugglerPass: 512,
  statusEffectBuyout: 512,
  statusEffectHeist: 488,
  statusEffectHelmWager: 488,
  statusEffectPvpCarrier: 488,
  statusEffectPvpKoth: 488,
  statusEffectPvpPlayer: 472,
  statusEffectSurvival: 512,
  teak: 416,
  treasureMap: 200,
  undiscovered: 448,
  weaver: 512,
  worldEventMegalodon: 488,
  worldEventMerchantConvoy: 368,
  worldEventShipwreck: 488,
  worldEventWarship: 504,
  zinc: 416,

  // 敌人与首领图标 (200px 基准)
  abyssalEnvoy: 181,
  ahPak: 181,
  bertrandHubac: 181,
  chorusFleetConvoy: 181,
  clanOfFaraConvoy: 181,
  commanderZhang: 181,
  compagnieRoyaleConvoy: 181,
  confederationOfUngwanaConvoy: 181,
  convoy: 181,
  dianSinaga: 181,
  dirkAnkeren: 181,
  dmcConvoy: 181,
  domains: 181,
  dominionOfRempahConvoy: 181,
  eliteWarship: 181,
  galvinRoche: 181,
  heralosOfTheAbyss: 181,
  jokaKubwa: 181,
  jonasVanderkill: 181,
  kraken: 181,
  liTianNing: 181,
  megaLestari: 181,
  philippeLaPeste: 181,
  philppeLaPesteDeadlw: 181,
  reapItWeep: 181,
  reaperOfTheLost: 181,
  requiemOfTheLost: 181,
  risenZamaharibu: 169,
  rodeMaangodin: 181,
  royalWarConvoy: 181,
  sadowbeast: 181,
  seaMonster: 181,
  shadowLegionConvoy: 181,
  tangenaRabe: 181,
  theHubacTwins: 181,
  theOpwelling: 181,
  vikramRajan: 181,
  vikramRajanDeadlw: 181,
  warEvent: 181,
  warfleet: 181,
  zamaaribu: 181,
};

/**
 * 从图标地址中提取图标标识名称
 * 兼容本地打包路径、CDN路径、动态相对路径与各种构建命名格式
 *
 * @param iconSrc 图标链接
 */
export const extractIconKeyFromSrc = (iconSrc: string): string => {
  if (!iconSrc || iconSrc.startsWith('data:')) return '';

  try {
    const normalized = iconSrc.replace(/\\/g, '/');
    const cleanSrc = normalized.split('?')[0].split('#')[0];
    const filename = cleanSrc.substring(cleanSrc.lastIndexOf('/') + 1);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    // Vite 构建格式兼容：
    // 格式1: outpost.glow-prow-front.C7NRfjQq.webp -> 分隔点取首项 outpost
    // 格式2: outpost-C7NRfjQq.webp -> 分隔横杠取首项 outpost
    const baseKey = nameWithoutExt.split('.')[0].split('-')[0];
    return baseKey;
  } catch {
    return '';
  }
};

/**
 * 根据图标地址与可选的显式 Key 快速获取图标内容尺寸
 *
 * @param iconSrc 图标链接或 Base64 编码
 * @param explicitKey 显式传入的分类或图标标识名称（如 'outpost'），传入时优先查表避免 URL 解析失效
 */
export const getPrecomputedIconContentSize = (iconSrc: string, explicitKey?: string): number | null => {
  // 显式传入 key 优先匹配
  if (explicitKey && PRECOMPUTED_ICON_SIZES[explicitKey]) {
    return PRECOMPUTED_ICON_SIZES[explicitKey];
  }

  if (!iconSrc) return null;

  const key = extractIconKeyFromSrc(iconSrc);
  if (key && PRECOMPUTED_ICON_SIZES[key]) {
    return PRECOMPUTED_ICON_SIZES[key];
  }

  // 依据路径特征推断最合理的初始基准尺寸，避免极端缩放偏离
  if (iconSrc.includes('enemies')) {
    return 181;
  }

  // 地图标记大部分素材为 512px，不透明内容平均在 450px 左右
  // 当未能提取出具体 key 时（如 Base64 内联），采用 450px 兜底，杜绝以 200px 计算造成的 2.25 倍暴增
  return 450;
};

