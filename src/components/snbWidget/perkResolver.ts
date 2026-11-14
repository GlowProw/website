/**
 * 18 种效果指示图标集合
 */
export const VALID_PERK_ICONS: ReadonlySet<string> = new Set([
  'armorAndResistance',
  'burning',
  'crewAttack',
  'electric',
  'explosive',
  'flooding',
  'movement',
  'piercing',
  'projectileRange',
  'projectileSpeed',
  'reload',
  'repair',
  'selfHealing',
  'severeDamage',
  'siege',
  'taunt',
  'tearing',
  'toxic',
]);

/**
 * 去除词条标识末尾的等级数值后缀
 *
 * @param id 原始词条标识
 * @returns 去除末尾数字后的基础词条标识
 */
export function toBaseId(id: string): string {
  return id.replace(/\d+$/, '');
}

/**
 * 解析单个词条对应的所有效果指示图标
 * 站点的效果指示规则
 *
 * @param perkId 词条标识
 * @returns 匹配的指示图标标识数组
 */
export function resolvePerkKeys(perkId: string): string[] {
  if (!perkId) {
    return [];
  }

  const icons: string[] = [];
  const id = perkId;

  // 基础元素与伤害类型包含判定
  if (id.includes('burning')) icons.push('burning');
  if (id.includes('flooding')) icons.push('flooding');
  if (id.includes('electric')) icons.push('electric');
  if (id.includes('piercing')) icons.push('piercing');
  if (['blast'].includes(id) || id.includes('explosive') || id.includes('combustion')) icons.push('explosive');
  if (id.includes('toxic')) icons.push('toxic');
  if (['siege', 'demolition'].includes(id)) icons.push('siege');
  if (['argusTouch', 'oceansSnare'].includes(id) || id.includes('tearing')) icons.push('tearing');
  if (['spiritMending', 'phantomMending', 'ghostlyMending', 'mysticMend', 'hauntingMend'].includes(id)) icons.push('selfHealing');
  if (['repair', 'repair1', 'repair2', 'repair3', 'repairBomb', 'repairBlast', 'caduceus', 'amalgamate'].includes(id)) icons.push('repair');
  if (['raider', 'marauder'].includes(id)) icons.push('crewAttack');
  if (['provoking'].includes(id)) icons.push('taunt');
  if (['sunder'].includes(id)) icons.push('projectileSpeed');
  if (['riptide', 'seasFury', 'torrent', 'restoration'].includes(id)) icons.push('severeDamage');
  if (['illuminate'].includes(id)) icons.push('movement');
  if (['illuminate', 'burningArtillery'].includes(id)) icons.push('armorAndResistance');
  if (['sealing', 'unsinkable', 'tideOfRestoration'].includes(id)) icons.push('flooding');
  if (['dampened', 'emberWard', 'stockedInferno'].includes(id)) icons.push('burning');
  if (['insulation', 'lightningStream'].includes(id)) icons.push('electric');
  if (['shelter', 'volatileVestment', 'floodstrike'].includes(id)) icons.push('explosive');
  if (['impregnable', 'reinforced', 'brackishBite'].includes(id)) icons.push('piercing');
  if (['venemousVengeance', 'immunity'].includes(id)) icons.push('toxic');
  if (['revile'].includes(id)) icons.push('taunt');
  if (['rally'].includes(id)) icons.push('crewAttack');
  if (['phantasmicThrust', 'resurgence', 'tideOfRestoration'].includes(id)) icons.push('selfHealing');
  if (['entrenched'].includes(id)) icons.push('siege');
  if (['windcaller'].includes(id)) icons.push('movement');
  if (['livingMetal', 'brackishBite'].includes(id)) icons.push('armorAndResistance');
  if (['ammoPrimingBench', 'markOfTheWolf', 'structureDamage15', 'bombardMenuiserie1', 'fatanaStation1', 'kinckelsLaboratory1'].includes(id)) icons.push('siege');
  if (['drownedOrgan', 'physiciansLedger'].includes(id)) icons.push('selfHealing');
  if (['megaphone', 'gunnersQuadrant', 'dummySpringloader1', 'buoyLocker1', 'spitefulSpikesStation', 'cannonballCarvingStation', 'teulingsGuidance', 'wyrmsBreathChurner', 'organHarvestingStation', 'fuseFusingStation', 'ramrodWorkshop', 'acceleratedGunrailSmithy', 'brouwersPowderhouse1', 'shellPackingStation', 'plaguebringersWard', 'gearsWorkshop', 'smokedCanisters', 'royalSterilizationTent', 'rampantCarriageHold', 'sheetingWinchConsole', 'leydenVaultArray', 'blubberWorks', 'drowningCabinet'].includes(id)) icons.push('reload');
  if (['ropeLocker', 'lestariTrophy', 'acceleratedGunrailSmithy', 'bracedGunwales', 'secretCache1', 'balancedMast1', 'lightenedMast1', 'emergencySails', 'sheetingWinchConsole', 'counterthrustLocker'].includes(id)) icons.push('movement');
  if (['cannonballCarvingStation', 'bloodyRed', 'threatGeneration05', 'cursedBanner', 'decoyDeck', 'atelierDeCuivrage', 'sandbagPaintingStation', 'invertedFlagRack'].includes(id)) icons.push('taunt');
  if (['chainedLinks', 'kinckelsLaboratory1', 'beamSupports', 'compagnieSpiritsLocker', 'dynamicBallastControl', 'atelierDeCuivrage', 'rampantCarriageHold', 'drownedOrgan'].includes(id)) icons.push('armorAndResistance');
  if (['devilsConcoction', 'expandingCorkscrewStation', 'copperFasteningStation', 'highVelocityKegs', 'hubacTuningRack', 'smokedCanisters', 'siphonFurnace', 'gimbalRingStores'].includes(id) || id.includes('MaximumRange')) icons.push('projectileRange');
  if (['tuningStation1', 'trunnionFurnace', 'hubacTuningRack', 'ammoPrimingBench', 'siphonFurnace', 'gimbalRingStores', 'causticSpallStation', 'physiciansLedger'].includes(id) || id.includes('ProjectileSpeed')) icons.push('projectileSpeed');
  if (['signalGong', 'scrapperStation', 'painPiper', 'lestariTrophy', 'boatswainsToll1', 'strangeElixir', 'crewAttackDamage1', 'crewAttackChargeSpeed1', 'firstMatesLedger'].includes(id)) icons.push('crewAttack');
  if (['wyrmsBreathChurner', 'markOfTheWolf', 'breechlockFurnace', 'infernalArtificersBench'].includes(id)) icons.push('explosive');
  if (['chargeStores', 'cannonballChargingStation', 'copperFasteningStation', 'amberCoatingStation', 'leydenVaultArray', 'stElmosChains'].includes(id)) icons.push('electric');
  if (['munitionsMixer', 'raisedQuarterdeck1', 'densityFurnace', 'debrisLocker', 'expandingCorkscrewStation', 'rifledBarrelWorkshop', 'scupperStation1', 'dummySpringloader1', 'causticSpallStation', 'drowningCabinet', 'floodwardenStation', 'stElmosChains'].includes(id)) icons.push('flooding');
  if (['munitionsMixer', 'compagnieScreens', 'leatherFashioningStation1', 'ablazeDamage1', 'stickyFuelStation1', 'volatileFuel1', 'quickIgnitingPowder', 'devilsConcoction', 'ablazeDuration1', 'ablazeChargingSpeed1', 'chargeStores', 'infernalArtificersBench', 'hellshotSmithy'].includes(id)) icons.push('burning');
  if (['tornSailsDuration1', 'langrageBarrels', 'debrisLocker', 'emergencySails', 'dummySpringloader1', 'lemariMakanan1', 'hellshotSmithy'].includes(id)) icons.push('tearing');
  if (['plaguebringersWard', 'stinkpotStation', 'siphonFurnace', 'curareCrushingBench', 'apothecaryToolBench'].includes(id)) icons.push('toxic');
  if (['cannonballChargingStation', 'rifledBarrelWorkshop', 'highVelocityKegs', 'dynamicBallastControl', 'cannonballCarvingStation', 'royalRammingWorks'].includes(id)) icons.push('piercing');
  if (['repairSevereDmgOfHullOutOfCombat1', 'scrapperStation', 'firstMatesLedger', 'firstAidStation', 'bombardMenuiserie1', 'joineryWorkshop1', 'ammoPrimingBench', 'royalSterilizationTent'].includes(id)) icons.push('repair');
  if (['firstMatesLedger'].includes(id)) icons.push('severeDamage');

  if (icons.length > 0) {
    return Array.from(new Set(icons));
  }

  // 若传入标识已是合法的 18 种图标名称之一，直接返回
  if (VALID_PERK_ICONS.has(id)) {
    return [id];
  }

  const base = toBaseId(id);
  if (VALID_PERK_ICONS.has(base)) {
    return [base];
  }

  return [];
}

/**
 * 解析单个词条对应的首要指示图标
 *
 * @param perkId 词条标识
 * @returns 对应指示图标的名称，无图标时返回 null
 */
export function resolvePerkKey(perkId: string): string | null {
  const keys = resolvePerkKeys(perkId);
  return keys.length > 0 ? keys[0] : null;
}
