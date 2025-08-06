# 介绍

这是`glow prow`后端，以node(>=22.17.0) + express + ts + mysql(8.0.26)实现

## 配置

在首次运行前，你需要配装数据库和配置文件，在backend目录下找到`config.presentation.ts`,复制一份并重新命名为`config.ts`,
对`secret`生成密钥匙，如果开发环境可以无视，配置数据库`mysql`前，你需要安装mysql，并注意`glow-prow.presentation.sql`内注释所需版本，使用`glow-prow.presentation.sql`导入后再配置

大概像这样:

```ts
const db = {
  "mysql": {
    "host": 'localhost',
    "port": 3306,
    "user": 'glow-prow',
    "password": 'test%2025',
    "database": 'glow-prow-db'
  }
}
```

其余不变

## 运行

本目录执行`npm run start`, 详细可用见`package.json`包信息

执行后看见,则成功

```text
[GlowProw] [1/1/2025, 00:00:00] [INFO]  服务器已启动在 127.0.0.1:3000
```

---

### 常见问题

**Q：长时间Fetching translations**

检查与raw.githubusercontent.com能否访问，如果实在不太行，可以克隆`glow-prow-data-language`到本地，并将config.ts下的i18n地址修改为你的本地path。
不应跳过i18n的初始化，否则glow-prow后端读取值无法找到直接返回i18n的key
