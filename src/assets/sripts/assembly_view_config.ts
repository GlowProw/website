/**
 * 配装显示模块
 */
export default class AssemblyViewConfig {
    // 仅设置
    get onlySet(): string[] {
        return ['assembly', 'wheel', 'warehouse']
    }

    // 仅阅读
    get onlyRead(): string[] {
        return ['assembly', 'wheel', 'warehouse']
    }
}
