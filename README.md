# Qwen Studio 美化脚本

<p align="center">
<a href="https://hxtx-hi.github.io/Qwen-Studio-Beautify/">
<img src="https://img.shields.io/badge/⚡_前往官网_一键安装-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="前往官网一键安装" />
</a>
</p>
<p align="center">
<a href="https://hxtx-hi.github.io/Qwen-Studio-Beautify/">
<img src="https://img.shields.io/badge/🌐_hxtx--hi.github.io/Qwen--Studio--Beautify-0a0a0f?style=flat-square&logo=github&logoColor=white" alt="官网地址" />
</a>
</p>

---

> 为 [Qwen Studio](https://chat.qwen.ai/) 添加毛玻璃亚克力效果、自定义背景、主题色、字体的油猴脚本。

## ✨ 功能

- **亚克力毛玻璃效果** — 聊天气泡、侧边栏、输入框等组件添加半透明模糊背景
- **自定义背景** — 支持图片/视频作为页面背景，可调节透明度
- **HSV 主题色** — 自由切换主题色调
- **自定义字体** — 内置 20+ 中英文字体可选
- **隐藏页脚** — 自动隐藏页面底部声明
- **移动端适配** — 手机 UA 自动隐藏侧边栏
- **暗色模式支持** — 所有效果在 dark mode 下均有适配

## 📦 安装

### 电脑端（Tampermonkey）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [安装脚本](https://raw.githubusercontent.com/hxtx-hi/Qwen-Studio-Beautify/main/qwen-studio-beautify.user.js)
3. 打开 [chat.qwen.ai](https://chat.qwen.ai/) 即可生效

### 手机端（Via 浏览器）

1. 在 Via 浏览器中打开 [官网](https://hxtx-hi.github.io/Qwen-Studio-Beautify/)
2. 点击页面上的「**⚡ 立即安装**」按钮
3. Via 会自动识别并弹出安装提示，点击**确定**即可

### Chrome / Edge 扩展（实验性）

> ⚠️ 扩展版本暂未完成完全测试，可能存在 Bug，推荐优先使用油猴脚本版本。

1. 从 [GitHub Release](https://github.com/hxtx-hi/Qwen-Studio-Beautify/releases/tag/v6.9.3-ext) 或 [Gitee Release](https://gitee.com/hxtx-hi/Qwen-Studio-Beautify/releases/tag/v6.9.3-ext) 下载 `qwen-studio-beautify-extension.zip`
2. 解压到本地文件夹
3. `chrome://extensions/` 或 `edge://extensions/` → 打开「开发者模式」→「加载已解压的扩展程序」→ 选择 `extension` 文件夹
4. 打开 [chat.qwen.ai](https://chat.qwen.ai/) 即可生效

## 🔧 使用

安装后打开 Qwen Studio，右下角会出现一个**可拖动的悬浮球 `[+]`**，点击打开设置面板：

- 切换背景类型（图片/视频/无）
- 调节背景透明度
- 开关亚克力效果
- 选择主题色
- 选择字体

## 📱 移动端说明

脚本通过浏览器 UA 判断设备类型：
- **手机 UA**（Android Phone / iPhone / iPod 等）：自动隐藏侧边栏
- **平板 / 桌面 UA**：正常显示所有效果，包括亚克力毛玻璃

## 📋 版本

- **当前版本**: v6.9.3
- **适配站点**: chat.qwen.ai
- **许可证**: MIT

## ⚠️ 注意

- 脚本修改了页面样式，Qwen Studio 更新后可能需要调整
- 自定义背景图片/视频存储在浏览器 IndexedDB 中，清除浏览器数据会丢失

## 🔗 链接

- 🌐 [官网](https://hxtx-hi.github.io/Qwen-Studio-Beautify/)
- 📦 [GitHub](https://github.com/hxtx-hi/Qwen-Studio-Beautify)
- 📦 [Gitee](https://gitee.com/hxtx-hi/Qwen-Studio-Beautify)
