import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18n} from "vue-i18n";

import {Cosmetics, Items, MapLocations, Materials, Modifications, Npcs, Sets, Ships, TreasureMaps} from "glow-prow-data";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import {number} from "@/assets/sripts/index";
import {Commodities} from "glow-prow-data/src/entity/Commodities";

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
    sets = Sets

export function useI18nReadName() {
    const {asString, sanitizeString, te, tm, t} = useI18nUtils()
    const {rt} = useI18n();

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
                            if (te(key)) {
                                const content = tm(key);
                                if (Array.isArray(content)) {
                                    return content.map(c => rt(c, variable || {})).join(' ').trim();
                                } else {
                                    return '·\t' + t(key, variable || {}).trim();
                                }
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
                    befLocationName = asString(keysLocations, {backRawKey: true})

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
                `snb.sets.${id}`,
                `snb.sets.${id}.name`,
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
        getValue
    }
}
