import type {PrimaryNavItem} from "@/assets/types/Ui";

/**
 * 账户与空间共用的一级导航配置
 * 新增或调整一级菜单只需要改这里，两个页面会自动同步
 */
export const primaryNavItems: PrimaryNavItem[] = [
  {
    value: 'MeAccount',
    name: 'account.title',
    route: 'AccountInformation'
  },
  {
    value: 'MeDataCenter',
    name: 'account.dataCenter.title',
    route: 'AccountDataCenter'
  },
  {
    value: 'MeMessageCenter',
    name: 'account.messages.messageCenterTitle',
    route: 'AccountMessages'
  },
  {
    value: 'MeSecurity',
    name: 'account.securityCenter.title',
    route: 'AccountSecurity'
  },
  {
    value: 'MeBot',
    name: 'account.bot.title',
    route: 'AccountBotGuide'
  },
  {
    value: 'MeSpace',
    name: 'space.title',
    route: 'SpaceAssemblys'
  }
];
