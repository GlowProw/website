// i18nReadName.ts
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {Items, Ships} from "glow-prow-data";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import {number} from "@/assets/sripts/index";
import {Commodities} from "glow-prow-data/src/entity/Commodities";

const items = Items,
    commodities = Commodities,
    ships = Ships,
    ultimates = Ultimates

export function useI18nReadName() {
    const {asString, sanitizeString} = useI18nUtils();

    const getValue = (obj, path) => {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    const item = (id: string) => {
        let keys = [
            `snb.items.${id}.name`,
            `snb.items.${sanitizeString(id).cleaned}.name`,
        ];

        return {
            keys,
            name: (lang?: string) => {
                if (items[id]) {
                    const translatedName = asString(keys, {
                        backRawKey: true,
                        lang
                    });
                    const tier = number.intToRoman(items[id].tier) || '';
                    return `${translatedName} ${tier}`.trim();
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
                    });
                    const tier = number.intToRoman(commodities[id].tier) || '';
                    return `${translatedName} ${tier}`.trim();
                }
                return id;
            }
        };
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

    const treasureMap = (id) => {
        const keys = [
            `snb.treasureMaps.${id}.name`,
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

    const ultimate = {
        name: (id: string) => {
            if (ultimates[id])
                return asString([
                    `snb.ultimates.${id}.name`,
                ], {
                    backRawKey: true
                })
            return id
        }
    }

    return {
        ship,
        item,
        commoditie,
        ultimate,
        treasureMap,
        getValue
    }
}
