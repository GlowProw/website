import { useI18nUtils } from "@/assets/sripts/i18n_util";
import { useI18n } from "vue-i18n";

import { Cosmetics, EmpireSkills, Item, Items, MapLocations, Masterys, Materials, Modifications, Npcs, Sets, Ship, Ships, TreasureMaps } from "glow-prow-data";
import { Ultimates } from "glow-prow-data/src/entity/Ultimates";
import { number } from "@/assets/sripts/index";
import { Commodities } from "glow-prow-data/src/entity/Commodities";

const items = Items,
    materials = Materials,
    commodities = Commodities,
    cosmetics = Cosmetics,
    ships = Ships,
    npcs = Npcs,
    modifications = Modifications,
    mapLocations = MapLocations,
    treasureMaps = TreasureMaps,
    ultimates = Ultimates,
    sets = Sets,
    empireSkills = EmpireSkills,
    masterys = Masterys

/**
 * i18n 名称与描述数据读取 Hook
 */
export function useI18nReadName() {
    const { asString, asArray, sanitizeString, te, tm, t } = useI18nUtils()
    const { rt } = useI18n();

    const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, key) => acc?.[key], obj)
    }

    const item = (id: string | number) => {
        let keysName = [
            `snb.items.${id}.name`,
            `snb.items.${sanitizeString(id as string).cleaned}.name`,
        ],
            keysDescription = [
                `snb.items.${id}.description`,
                `snb.items.${id}.description.general`,
                `snb.items.${sanitizeString(id as string).cleaned}.description.general`
            ],
            idTier = sanitizeString(id as string).removedNumbers[0];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (items[id]) {
                    const translatedName = asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(idTier || items[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return String(id);
            },
            description: (lang?: string): string => {
                if (items[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        };
    }

    const modification = (id: string) => {
        let keysName = [
            `snb.modifications.${id}.name`,
            `snb.modifications.${sanitizeString(id).cleaned}.name`,
        ],
            keysDescription = [
                `snb.modifications.${id}.description`,
                `snb.modifications.${sanitizeString(id).cleaned}.description`,
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (modifications[id]) {
                    const translatedName = asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(modifications[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return String(id);
            },
            /**
             * 取得模组详情，如果传如type则返回特定变种描述，如果没有则返回所有变种描述
             * @param lang
             * @param type
             */
            description: (lang?: string, type?: string): string => {
                if (modifications[id]) {
                    const data = modifications[id];
                    let variants = data.variants || [];

                    if (type) {
                        variants = variants.filter((e: any) => e.itemType.indexOf(type) >= 0);
                    }

                    if (variants.length === 0) {
                        variants = [null];
                    }

                    return variants.map((v: any) => {
                        let variable: any = null;
                        if (v && v.range) {
                            variable = {
                                __: v.range.map((num: number, index: number) => {
                                    if (num < 1) {
                                        return [Math.floor(num * 100 * 10) / 10, Math.ceil(num * 100 * 10) / 10][index];
                                    } else {
                                        return num;
                                    }
                                })
                            }
                        }

                        for (const key of keysDescription) {
                            const content = tm(key, lang);
                            if (content) {
                                if (Array.isArray(content)) {
                                    return content.map((_, idx) => {
                                        const text = t(`${key}.${idx}`, variable || {}, lang);
                                        return '·\t' + text.trim();
                                    }).join('\n');
                                } else if (typeof content === 'string') {
                                    return '·\t' + t(key, variable || {}, lang).trim();
                                }
                            } else if (te(key, lang)) {
                                return '·\t' + t(key, variable || {}, lang).trim();
                            }
                        }

                        return asString(keysDescription, {
                            backRawKey: true,
                            lang
                        }).trim();
                    }).join('\n');
                }
                return String(id);
            }
        };
    }

    const cosmetic = (id: string) => {
        let keysName = [
            `snb.cosmetics.${id}.name`,
            `snb.cosmetics.${sanitizeString(id).cleaned}.name`,
        ],
            keysDescription = [
                `snb.cosmetics.${id}.description.general`
            ],
            data = cosmetics[id];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (data) {
                    const translatedName = asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(data.tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return id;
            },
            description: (lang?: string): string => {
                if (data) {
                    const translatedName = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedName}`.trim()
                }
                return String(id);
            }
        };
    }

    const commoditie = (id: string) => {
        let keysName = [
            `snb.commodities.${id}.name`,
            `snb.commodities.${sanitizeString(id).cleaned}.name`,
        ],
            keysDescription = [
                `snb.commodities.${id}.description`,
                `snb.commodities.${id}.description.general`,
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (commodities[id]) {
                    const translatedName = asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(commodities[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return String(id);
            },
            description: (lang?: string): string => {
                if (commodities[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        };
    }

    const material = (id: string) => {
        const keysName = [
            `snb.materials.${id}.name`,
        ],
            keysDescription = [
                `snb.materials.${id}.description`
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (materials[id])
                    return asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (materials[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: false,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const ship = (id: string) => {
        const keysName = [
            `snb.ships.${id}.name`,
        ],
            keysDescription = [
                `snb.ships.${id}.description.general`
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (ships[id])
                    return asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (ships[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const npc = (id: string) => {
        const keysName = [
            `snb.npcs.${id}.name`,
        ],
            keysDescription = [
                `snb.npcs.${id}.description`,
            ];

        return {
            keysName,
            keysDescription,
            name: (location: any, lang?: string): string => {
                if (npcs[id])
                    return asString(keysName, {
                        backRawKey: true,
                        variable: {
                            location
                        },
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (npcs[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: false,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const mapLocation = (id: string) => {
        const keysName = [
            `snb.mapLocations.${id}.name`,
        ],
            keysDescription = [
                `snb.mapLocations.${id}.description`,
            ];

        return {
            keys: keysName,
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (mapLocations[id])
                    return asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (mapLocations[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const treasureMap = (id: string | number) => {
        const keysName = [
            `snb.treasureMaps.${id}.name`,
        ],
            keysDescription = [
                `snb.treasureMaps.${id}.description`,
            ];
        return {
            keysName,
            keysDescription,
            name: (category: any, lang?: string): string => {
                let befId = (id || '').toString()
                    .replace(/-(recent|old|veryOld|legendary)(?=-|$)/g, '')
                    .replace(/\d+/g, '')
                    .replaceAll('-', ''),
                    keysLocations = [
                        `snb.mapLocations.${befId}.name`,
                        `snb.territories.${befId}.name`,
                        `snb.locations.${befId}`,
                    ],
                    befLocationName = asString(keysLocations, { backRawKey: true })

                if (treasureMaps[id]) {
                    return `${t(`codex.treasureMap.names.${category}`, {
                        location: befLocationName
                    })} (${t(`codex.treasureMap.categorys.${category}`)})`
                }
                return String(id)
            },
            description: (lang?: string): string => {
                if (treasureMaps[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const ultimate = (id: string | number) => {
        const keysName = [
            `snb.ultimates.${id}.name`,
        ],
            keysDescription = [
                `snb.ultimates.${id}.description`,
            ];

        return {
            keys: keysName,
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (ultimates[id])
                    return asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (ultimates[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const set = (id: string | number) => {
        const keysName = [
            `snb.sets.${id}`
        ],
            keysDescription = [
                `snb.sets.${id}.description.general`,
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                if (sets[id])
                    return asString(keysName, {
                        backRawKey: true,
                        lang
                    })
                return String(id)
            },
            description: (lang?: string): string => {
                if (sets[id]) {
                    const translatedDesc = asString(keysDescription, {
                        backRawKey: true,
                        lang
                    })
                    return `${translatedDesc}`.trim()
                }
                return String(id);
            }
        }
    }

    const perk = (id: string | number) => {
        const keysName = [
            `snb.perks.${id}.name`,
            `snb.perks.${sanitizeString(<string>id).cleaned}.name`,
        ]

        return {
            keysName,
            name: (lang?: string): string => {
                let name = asString(keysName, {
                    backRawKey: false,
                    lang
                })
                if (name)
                    name += `${number.intToRoman(<any>sanitizeString(<string>id).removedNumbers[0])}`
                return name
            },
            /**
             * data 泛用类型，不是指perk的
             * @param data
             * @param lang
             */
            description: (data: Item | Ship, lang?: string): any[] => {
                let result = []

                for (const perkKey of data.perks) {
                    const perksName = sanitizeString(perkKey)
                    let keys: any[] = []

                    switch (data?.type) {
                        case "shipUpgrade":
                            keys = [
                                `snb.perks.${perksName.cleaned}.description.${(data as any)?.tier}`,
                                `snb.perks.${perksName.cleaned}.description.general`,
                            ]

                            result.push({ id: perkKey, value: asArray(keys) })
                            break;
                        default:
                            keys = [
                                `snb.perks.${perkKey}.description.general`,
                                `snb.perks.${perksName.cleaned}.description.general`,
                                `snb.perks.${perksName.cleaned}.description.${perksName.removedNumbers[0]}`
                            ]

                            result.push({ id: perkKey, value: asArray(keys) })
                            break;
                    }
                }

                return result;
            }
        }
    }

    const empireSkill = (id: string) => {
        let keysName = [
            `snb.empireSkills.${id}.name`,
            `snb.empireSkills.${sanitizeString(id).cleaned}.name`,
        ],
            keysDescription = [
                `snb.empireSkills.${id}.effects.general`,
                `snb.empireSkills.${id}.effects.1`,
            ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                const translatedName = asString(keysName, {
                    backRawKey: true,
                    lang
                })
                return (translatedName || id || '').trim();
            },
            description: (lang?: string, stage?: number): string => {
                const skill = empireSkills[id];
                if (!skill) return '';
                const factionName = t(`snb.factions.${skill.type}.name`);
                const interpolateParams = { ...(skill.attr || {}), faction: factionName };
                if (stage) {
                    return t(`snb.empireSkills.${id}.effects.${stage}`, interpolateParams) || '';
                }
                if (skill.stage && skill.stage > 1) {
                    const descList: string[] = [];
                    for (let s = 1; s <= skill.stage; s++) {
                        const eff = t(`snb.empireSkills.${id}.effects.${s}`, interpolateParams);
                        if (eff && !eff.startsWith('snb.empireSkills')) {
                            descList.push(`${number.intToRoman(s)}: ${eff}`);
                        }
                    }
                    if (descList.length > 0) return descList.join('\n');
                }
                return t(`snb.empireSkills.${id}.effects.general`, interpolateParams) || t(`snb.empireSkills.${id}.effects.1`, interpolateParams) || '';
            }
        };
    }

    const mastery = (id: string | number) => {
        const rawKey = String(id || '');
        let skillKey = rawKey;
        let matchedNode: any = null;

        // 若传入的是节点 key（如 B-3-2-DE2）或 id，尝试在专精树中寻找对应技能标识
        const allTrees = Object.values(masterys);
        for (const tree of allTrees) {
            if (tree && (tree as any).nodes) {
                const node = (tree as any).nodes[rawKey] || (Object.values((tree as any).nodes) as any[]).find((n: any) => n.key === rawKey || n.id === rawKey);
                if (node) {
                    matchedNode = node;
                    skillKey = (node as any).id || (node as any).skill || rawKey;
                    break;
                }
            }
        }

        const keysName = [
            `snb.masterys.${skillKey}.name`,
            // `snb.masterys.${rawKey}.name`,
        ];
        const keysDescription = [
            `snb.masterys.${skillKey}.description`,
            // `snb.masterys.${rawKey}.description`,
        ];

        return {
            keysName,
            keysDescription,
            name: (lang?: string): string => {
                const translated = asString(keysName, {
                    backRawKey: false,
                    lang
                });
                return translated || skillKey || rawKey;
            },
            description: (lang?: string): string => {
                const translated = asString(keysDescription, {
                    backRawKey: false,
                    lang
                });
                if (translated) {
                    return translated;
                }
                if (matchedNode && matchedNode.effects && matchedNode.effects.length > 0) {
                    const lines: string[] = [];
                    for (const eff of matchedNode.effects) {
                        let effDesc = asString([`snb.masterys.${eff.id}.description`], {
                            backRawKey: false,
                            lang
                        });
                        if (effDesc) {
                            for (const [k, v] of Object.entries(eff)) {
                                if (k !== 'id') {
                                    effDesc = effDesc.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
                                }
                            }
                            lines.push(effDesc);
                        }
                    }
                    if (lines.length > 0) {
                        return lines.join('\n');
                    }
                }
                return '';
            }
        };
    };

    return {
        ship,
        npc,
        set,
        material,
        item,
        cosmetic,
        modification,
        commoditie,
        ultimate,
        mapLocation,
        treasureMap,
        perk,
        empireSkill,
        mastery,
        getValue
    }
}

