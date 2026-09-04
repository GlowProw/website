export default class Number {
    /**
     * 处理罗马信息
     * int 转 罗马数字
     * @param num
     */
    intToRoman = (num: number) => {
        const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const sym = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

        let result = '';
        let i = 0;

        while (num > 0) {
            while (num >= val[i]) {
                num -= val[i];
                result += sym[i];
            }
            i++;
        }

        return result;
    }

    static formatCompact = formatCompactNumber;
    static formatNumber = formatNumber;
}

/**
 * 格式化数字为简短/紧凑表示，例如 7.3k, 1m, 2.5b
 * @param num 数字
 * @param digits 保留小数位数 (默认 1)
 */
export function formatCompactNumber(num?: number | null, digits: number = 1): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1_000_000_000) {
        return sign + (abs / 1_000_000_000).toFixed(digits).replace(/\.0$/, '') + 'B';
    }
    if (abs >= 1_000_000) {
        return sign + (abs / 1_000_000).toFixed(digits).replace(/\.0$/, '') + 'M';
    }
    if (abs >= 1_000) {
        return sign + (abs / 1_000).toFixed(digits).replace(/\.0$/, '') + 'K';
    }
    return sign + abs.toString();
}

/**
 * 格式化数字带千分位分隔符，例如 1,234,567
 * @param num 数字
 */
export function formatNumber(num?: number | null): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat().format(num);
}

