import {useI18nUtils} from "@/assets/sripts/i18n_util";

import {Items, MapLocations, Materials, Modifications, Npcs, Sets, Ships, TreasureMap, TreasureMaps} from "glow-prow-data";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import {number} from "@/assets/sripts/index";
import {Commodities} from "glow-prow-data/src/entity/Commodities";

const items = Items,
    materials = Materials,
    commodities = Commodities,
    ships = Ships,
    npcs = Npcs,
    modifications = Modifications,
    mapLocations = MapLocations,
    treasureMaps = TreasureMaps,
    ultimates = Ultimates,
    sets = Sets

export function useI18nReadName() {
    const {asString, sanitizeString} = useI18nUtils()

    const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, key) => acc?.[key], obj)
    }

    const item = (id: string | number) => {
        let keys = [
                `snb.items.${id}.name`,
                `snb.items.${sanitizeString(id as string).cleaned}.name`,
            ],
            idTier = sanitizeString(id as string).removedNumbers[0];

        return {
            keys,
            name: (lang?: string) => {
                if (items[id]) {
                    const translatedName = asString(keys, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(idTier || items[id].tier ) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return id;
            }
        };
    }

    const modification = (id: string) => {
        let keys = [
            `snb.modifications.${id}.name`,
            `snb.modifications.${sanitizeString(id).cleaned}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (modifications[id]) {
                    const translatedName = asString(keys, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(commodities[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return id;
            }
        };
    }

    const cosmetic = (id: string) => {
        let keys = [
            `snb.cosmetics.${id}.name`,
            `snb.cosmetics.${sanitizeString(id).cleaned}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (commodities[id]) {
                    const translatedName = asString(keys, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(commodities[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return id;
            }
        };
    }

    const commoditie = (id: string) => {
        let keys = [
            `snb.commodities.${id}.name`,
            `snb.commodities.${sanitizeString(id).cleaned}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (commodities[id]) {
                    const translatedName = asString(keys, {
                        backRawKey: true,
                        lang
                    })
                    const tier = number.intToRoman(commodities[id].tier) || '';
                    return `${translatedName} ${tier}`.trim()
                }
                return id;
            }
        };
    }

    const material = (id: string) => {
        const keys = [
            `snb.materials.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (materials[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const ship = (id: string) => {
        const keys = [
            `snb.ships.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (ships[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const npc = (id: string) => {
        const keys = [
            `snb.npcs.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (npcs[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const mapLocation = (id: string) => {
        const keys = [
            `snb.mapLocations.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (mapLocations[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const treasureMap = (id: string | number) => {
        const keys = [
            `snb.treasureMaps.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (treasureMaps[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const ultimate = (id: string | number) => {
        const keys = [
            `snb.ultimates.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (ultimates[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
            }
        }
    }

    const set = (id: string | number) => {
        const keys = [
            `snb.sets.${id}`,
            `snb.sets.${id}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (sets[id])
                    return asString(keys, {
                        backRawKey: true,
                        lang
                    })
                return id
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
