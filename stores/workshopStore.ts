import {defineStore} from 'pinia';
import {ref} from 'vue';
import {AssemblyWorkshopData} from '@/assets/types';

export const useWorkshopStore = defineStore('workshop', () => {
    const workshopData = ref<AssemblyWorkshopData>(
        // 初始结构与原始默认值匹配
        {
            shipModel: false,
            frigateUpgradeModel: false,
            displayModel: false,
            weaponModel: false,
            secondaryWeaponModel: false,
            ultimateModel: false,
            armorModel: false,
            weaponSearchValue: '',
            frigateUpgradeInsertIndex: 0,
            weaponInsertIndex: 0,
            secondaryWeaponInsertIndex: 0,
            secondaryWeaponSelect: 0,
            armorSelect: 0,
            ultimateSelect: 0,
            displayInsertIndex: 0,
            shipWorkshopSelect: null,
            shipSelect: null,
            shipFrigateUpgradeSelect: null,
            shipDisplaySelect: null,
            shipFrigateUpgradeList: [],
            data: {
                shipSlot: null,
                ultimateSlot: null,
                shipUpgradeSlot: null,
                weaponDirections: [],
                weaponModifications: [],
                weaponSlots: [],
                armorSlot: null,
                armorModification: [],
                secondaryWeaponSlots: [],
                secondaryWeaponModifications: [],
                displaySlots: [],
                weaponModification: [],
                __version: ''
            }
        }
    );

    // 状态保存
    if (import.meta.hot) {
        import.meta.hot.accept((newModule) => {
            // 若存在则恢复原状
            if (import.meta.hot?.data?.workshopData) {
                workshopData.value = import.meta.hot.data.workshopData;
            }
        });
        import.meta.hot.dispose((data) => {
            data.workshopData = workshopData.value;
        });
    }

    return {workshopData};
});
