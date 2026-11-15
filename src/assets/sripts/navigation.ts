import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import { useRouter, useRoute } from "vue-router";

/**
 * 取消并安全回退到上一个路由：
 * 1. 优先检查是否存在上一个历史路由：
 *    - 若存在有效的上一级历史路由（window.history.state?.back 且 history.length > 1），优先回退到上一页；
 * 2. 若没有上一个路由（如通过外链、新标签页直接打开或页面刷新后无站内前序路由），具体根据当前路由内容进行退回：
 *    - 若属于配装编辑（带有 uid），优先退回该配装详情页（AssemblyDetail）；
 *    - 若属于配装相关模块，退回配装浏览页（AssemblyBrowse）；
 *    - 退到首页是最后手段。
 *
 * @param router 路由实例
 * @param route 当前路由对象
 */
export const cancelAndBack = (router: Router, route: RouteLocationNormalizedLoaded): void => {
  // 读取 vue-router 维护的历史记录上一级地址
  const backPath = window.history.state?.back;

  // 1. 如果有有效的上一个站内路由历史，且不是当前页面自身，优先安全回退
  if (backPath && typeof backPath === 'string' && window.history.length > 1) {
    const cleanBackPath = backPath.split('?')[0];
    const currentCleanPath = route.path.split('?')[0];
    if (cleanBackPath !== currentCleanPath) {
      router.back();
      return;
    }
  }

  // 2. 无上一个路由，或上一条历史仅为当前页自身时，具体看当前路由内容
  const lang = (route.params?.lang as string) || 'zh-CN';
  const uid = (route.params?.uid as string) || (route.params?.uuid as string);

  // 若当前为配装编辑页且带有配装标识，优先回退到该配装的详情页
  if (uid && (route.name === 'AssemblyEdit' || route.name === 'EditAssembly' || route.path.includes('/assembly/workshop/'))) {
    router.push({
      name: 'AssemblyDetail',
      params: { lang, uuid: uid }
    }).catch(() => {
      router.push({
        name: 'AssemblyBrowse',
        params: { lang }
      }).catch(() => {
        router.push(`/${lang}`);
      });
    });
    return;
  }

  // 若处于配装其他页面
  if (route.path.includes('/assembly')) {
    router.push({
      name: 'AssemblyBrowse',
      params: { lang }
    }).catch(() => {
      router.push(`/${lang}`);
    });
    return;
  }

  // 若当前历史栈确实大于 1，尝试直接回退
  if (window.history.length > 1) {
    router.go(-1);
    return;
  }

  // 3. 最后手段：退回首页
  router.push(`/${lang}`).catch(() => {
    router.push('/');
  });
};

/**
 * 快捷 Composable hook，用于在 Vue 组件中快速绑定取消返回操作
 */
export const useNavigationBack = () => {
  const router = useRouter();
  const route = useRoute();

  const onCancel = () => cancelAndBack(router, route);

  return {
    cancelAndBack: onCancel,
  };
};
