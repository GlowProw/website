import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import { useRouter, useRoute } from "vue-router";

/**
 * 取消并安全回退到上一个路由，携带当前路由参数与 URL 查询参数。
 * 若没有上一个路由（如通过新标签页直接打开），则尝试关闭当前窗口，最后兜底跳转回首页。
 *
 * @param router 路由实例
 * @param route 当前路由对象
 */
export const cancelAndBack = (router: Router, route: RouteLocationNormalizedLoaded): void => {
  // 读取 vue-router 维护的历史记录上一级地址
  const backPath = window.history.state?.back;

  if (backPath && typeof backPath === "string") {
    const urlParts = backPath.split("?");
    const targetPath = urlParts[0];
    const backSearchParams = new URLSearchParams(urlParts[1] || "");
    const backQuery: Record<string, any> = {};
    backSearchParams.forEach((val, key) => {
      backQuery[key] = val;
    });

    const mergedQuery = {
      ...backQuery,
      ...route.query,
    };

    const resolved = router.resolve(targetPath);
    if (resolved && resolved.name) {
      router.push({
        name: resolved.name,
        params: {
          ...resolved.params,
          ...route.params,
        },
        query: mergedQuery,
      }).catch(() => {
        router.go(-1);
      });
      return;
    }

    router.push({
      path: targetPath,
      query: mergedQuery,
    }).catch(() => {
      router.go(-1);
    });
    return;
  }

  // 历史栈长度大于 1 时尝试回退
  if (window.history.length > 1) {
    router.go(-1);
    return;
  }

  // 没有上一个路由，当前路由处于根部（新建窗口打开），尝试关闭窗口
  try {
    window.close();
  } catch (error) {
    console.warn("window.close failed:", error);
  }

  // 兜底返回首页
  setTimeout(() => {
    if (!window.closed) {
      router.push("/");
    }
  }, 150);
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
