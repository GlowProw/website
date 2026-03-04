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
}
