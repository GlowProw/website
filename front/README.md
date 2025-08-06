# 介绍

这是`glow prow`前端，以node(>=22.17.0) + vue(>=3.0.0) + vite + ts实现

## 配置

通常前端服务不太用配置，如果你需要修改请求地址，可以在`src/assets/sripts/config.ts`配置，你可以看到`requestDevelopmentName`和`requestProductionName`对应测试使用环境和生产环境使用环境，环境清单在下面`child`可见

它们长这样:

```json
{
  "child": {
    "development": {
      "protocol": "http",
      "wsProtocol": "ws",
      "host": "127.0.0.1",
      "port": "3000",
      "wsPort": "3001",
      "pathname": "/api/",
      "wsPathname": ""
    },
    "production": {
      "protocol": "https",
      "wsProtocol": "wss",
      "host": "glow-prow-api.host.net",
      "port": "",
      "wsPort": "",
      "pathname": "/api/",
      "wsPathname": "/ws"
    }
  }
}
```

|            | 功能     | 描述                       |
|------------|--------|--------------------------|
| protocol   | 协议     |                          |
| wsProtocol | ws协议   |                          |
| host       | 域      |                          |
| wsHost     | ws域    |                          |
| port       | 端口     |                          |
| wsPort     | ws端口   |                          |
| pathname   | 后续地址   |                          |
| wsPathname | ws后续地址 | 在生产环境下会使用nginx将3001指向/ws |


## 运行

在本目录执行`npm run serve`,如果你想查看正式结果，可以使用`npm run build-only && preview:production`,它会先构建，并启动本地预览服务，此时使用的是`requestProductionName`

## 部署

如果要部署，则只需要执行`npm run build-only`只管打包，或是`npm run build:production`/`npm run build:no-check:production`，打包不检查/打包检查
