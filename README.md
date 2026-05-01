> [!CAUTION]
> 有关项目问题与意见请移步https://github.com/hamster1963/nezha-dash
> 交流

> [!NOTE]
> 此项目为 nezha-dash 的官方实现，作为哪吒监控的默认前端，功能上可能与 nezha-dash 有所不同。
> https://github.com/hamster1963/nezha-dash

## 替换哪吒 Dashboard 自定义前端主题

以下步骤适用于使用官方脚本安装的哪吒 Dashboard，Dashboard 目录通常为：

```bash
/opt/nezha/dashboard
```

其中：

```bash
/opt/nezha/dashboard/app   # Dashboard 主程序
/opt/nezha/dashboard/data  # 配置、数据库等数据
```

自定义用户前端需要放到：

```bash
/opt/nezha/dashboard/user-dist
```

### 1. 构建前端

在本项目目录执行：

```bash
pnpm install
pnpm build
```

构建完成后会生成：

```bash
dist/
```

### 2. 上传到服务器

如果在本地开发机完成构建，将 `dist` 上传到服务器：

```bash
rsync -av --delete dist/ root@你的服务器IP:/opt/nezha/dashboard/user-dist/
```

如果是在服务器上构建，可以直接复制：

```bash
mkdir -p /opt/nezha/dashboard/user-dist
rsync -av --delete dist/ /opt/nezha/dashboard/user-dist/
```

### 3. 确认 Dashboard 配置

检查配置文件：

```bash
grep user_template /opt/nezha/dashboard/data/config.yaml
```

应为：

```yaml
user_template: user-dist
```

如果不是，编辑配置文件：

```bash
nano /opt/nezha/dashboard/data/config.yaml
```

将 `user_template` 改为 `user-dist`。

### 4. 重启 Dashboard

```bash
systemctl restart nezha-dashboard
```

如果服务名不同，可以先查询：

```bash
systemctl list-units --type=service | grep -i nezha
```

重启后访问哪吒首页 `/` 即可看到自定义前端。后台管理页 `/dashboard` 使用的是管理后台前端，不受 `user-dist` 影响。

### 说明

哪吒 Dashboard 会优先读取运行目录下的 `user-dist`，找不到时才使用程序内置的默认前端。因此对于官方脚本安装的二进制部署，只需要把构建后的 `dist` 内容放到 `/opt/nezha/dashboard/user-dist`，不需要重新编译 Dashboard。
