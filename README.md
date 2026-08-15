# Qwen Studio Beautify

> 为 [Qwen Studio](https://chat.qwen.ai/) 添加毛玻璃亚克力效果、自定义背景、主题色、字体的油猴脚本。

**当前版本：v6.9.10**

---

## 功能特性

- **亚克力毛玻璃** — 聊天气泡、侧边栏、输入框、弹窗等组件添加半透明模糊背景
- **自定义背景** — 支持本地图片或在线视频作为页面背景，可调节透明度
- **HSV 主题色** — 通过色相/饱和度/明度三轴色盘自由调节全局主题色调
- **自定义字体** — 内置 20+ 中英文字体（霞鹜文楷、思源黑体、更纱黑体等）
- **移动端适配** — 手机 UA 自动隐藏侧边栏，Via 浏览器完美支持
- **暗色模式** — 所有效果在暗色模式下均有独立适配

---

## 安装教程

本脚本通过 **Tampermonkey（油猴）** 运行。请根据你使用的浏览器选择对应的安装方式。

### Edge 浏览器

1. 打开 Edge，访问 [Edge 扩展商店 — Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)，点击「获取」安装扩展
2. 安装完成后，确认浏览器右上角出现 Tampermonkey 图标且已启用
3. 点击 [立即安装脚本](https://raw.githubusercontent.com/hxtx-hi/Qwen-Studio-Beautify/main/qwen-studio-beautify.user.js)
4. Tampermonkey 会自动弹出安装确认页面，点击「安装」
5. 打开 [chat.qwen.ai](https://chat.qwen.ai/)，页面右下角出现 `[+]` 悬浮球即为安装成功

### Chrome 浏览器

> Chrome 推荐从 Tampermonkey 官网下载安装，不依赖应用商店。

1. 访问 [Tampermonkey 官网](https://www.tampermonkey.net/)，点击页面中的「Download」
2. 在下载页面找到 Chrome 区域，下载 `.crx` 安装包
   - 备选：如果官网下载缓慢，可前往 [GitHub Releases](https://github.com/Tampermonkey/tampermonkey/releases) 下载最新版 `.crx` 文件
3. 在 Chrome 地址栏输入 `chrome://extensions/` 并回车，打开扩展管理页
4. 打开页面右上角的「开发者模式」开关
5. 将下载好的 `.crx` 文件直接拖拽到 Chrome 扩展管理页面中
6. 弹出确认对话框，点击「添加扩展程序」完成安装
7. 点击 [立即安装脚本](https://raw.githubusercontent.com/hxtx-hi/Qwen-Studio-Beautify/main/qwen-studio-beautify.user.js)
8. Tampermonkey 会自动弹出安装确认页面，点击「安装」
9. 打开 [chat.qwen.ai](https://chat.qwen.ai/)，页面右下角出现 `[+]` 悬浮球即为安装成功

### 手机端 — Via 浏览器（安卓 / iOS）

Via 浏览器原生支持油猴脚本，无需额外安装扩展。

1. 在 Via 浏览器中点击 [立即安装脚本](https://raw.githubusercontent.com/hxtx-hi/Qwen-Studio-Beautify/main/qwen-studio-beautify.user.js)
2. Via 会自动识别为油猴脚本，弹出安装提示
3. 点击「确定」，脚本即刻生效
4. 打开 [chat.qwen.ai](https://chat.qwen.ai/)，页面右下角出现 `[+]` 悬浮球即为安装成功

> 如果没有自动弹出提示，可手动导入：Via 菜单 → 设置 → 脚本 → 添加脚本 → 将脚本内容粘贴进去 → 保存

---

## 使用说明

安装成功后，打开 [chat.qwen.ai](https://chat.qwen.ai/)，页面右下角会出现一个**可拖动的悬浮球 `[+`**。点击它即可打开设置面板。

| 功能 | 说明 |
|------|------|
| 🖼️ 背景 | 点击「选择图片」上传本地图片，或粘贴视频 URL 使用视频背景，支持「无背景」模式 |
| 👁️ 透明度 | 拖动滑块调节背景透明度（0% ~ 100%），推荐 30% ~ 60% |
| 💎 亚克力 | 开关毛玻璃效果，开启后组件显示半透明模糊背景 |
| 🎨 主题色 | 通过 HSV 色盘（H/S/V 三轴）实时调整全局主题色调 |
| 🔤 字体 | 从下拉菜单选择 20+ 预设字体，选中即生效 |
| 🌙 暗色模式 | 跟随 Qwen Studio 自带的暗色模式，亚克力效果自动切换为暗色适配版本 |

**悬浮球操作：** 点击打开/关闭设置面板；长按可拖动到屏幕任意位置，松手后自动固定。所有设置自动保存到本地，刷新页面后依然生效。

---

## 常见问题

<details>
<summary><strong>安装后没有看到悬浮球？</strong></summary>

请确认：① Tampermonkey 扩展已启用（浏览器右上角图标应为亮色）；② 脚本已在 Tampermonkey 管理面板中显示为「已启用」状态；③ 当前访问的网址是 `chat.qwen.ai`。如果仍不显示，尝试硬刷新页面（Ctrl+Shift+R）。
</details>

<details>
<summary><strong>Chrome 拖入 .crx 文件提示「无法安装」？</strong></summary>

这是 Chrome 的安全策略限制。解决方法：① 确保已开启「开发者模式」；② 尝试将 `.crx` 文件后缀改为 `.zip` 并解压，然后在扩展管理页点击「加载已解压的扩展程序」选择解压后的文件夹。
</details>

<details>
<summary><strong>亚克力效果卡顿或不显示？</strong></summary>

毛玻璃效果（backdrop-filter）依赖 GPU 加速。如果卡顿：① 关闭其他占用 GPU 的标签页；② 在浏览器设置中确认「硬件加速」已开启；③ 如果仍卡顿，可在面板中关闭亚克力效果，仅保留透明背景。
</details>

<details>
<summary><strong>脚本更新后如何升级？</strong></summary>

Tampermonkey 默认会自动检查脚本更新。也可手动更新：打开 Tampermonkey 管理面板 → 找到本脚本 → 点击编辑旁的更新图标。或直接重新点击安装链接覆盖安装。
</details>

<details>
<summary><strong>如何卸载？</strong></summary>

打开 Tampermonkey 管理面板，找到「Qwen Studio Beautify」，点击删除图标即可。
</details>

---

## 更新日志

### v6.9.10

- 修复右侧大白底问题（`desktop-layout-content-inner` 选择器）
- 添加侧边栏子选择器亚克力效果
- 添加 wms-popup 弹窗亚克力效果
- 修复切换对话时加载页白底问题（`chat-detail-skeleton`）
- 移除扩展版本，仅保留油猴脚本版本
- 官网和 README 添加详细安装教程

### v6.9.5

- 修复侧边栏白底问题
- 修复弹窗白底问题

### v6.9.3

- 初始版本

---

## 相关链接

- **官网：** https://hxtx-hi.github.io/Qwen-Studio-Beautify/
- **GitHub：** https://github.com/hxtx-hi/Qwen-Studio-Beautify
- **Gitee：** https://gitee.com/hxtx-hi/Qwen-Studio-Beautify
- **作者主页：** https://hxtx-hi.github.io/

## License

MIT
