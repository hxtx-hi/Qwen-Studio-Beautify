# Qwen Studio 美化脚本

> 为 [Qwen Studio](https://chat.qwen.ai/) 添加毛玻璃亚克力效果、自定义背景、主题色、字体的油猴脚本。

## ✨ 功能

- **亚克力毛玻璃效果** — 聊天气泡、侧边栏、输入框等组件添加半透明模糊背景
- **自定义背景** — 支持图片/视频作为页面背景，可调节透明度
- **HSV 主题色** — 自由切换主题色调
- **自定义字体** — 内置 20+ 中英文字体可选
- **隐藏页脚** — 自动隐藏页面底部声明
- **移动端适配** — 手机 UA 自动隐藏侧边栏，避免透明空气问题
- **暗色模式支持** — 所有效果在 dark mode 下均有适配

## 📦 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他油猴管理器
2. 点击 [安装脚本](https://raw.githubusercontent.com/hxtx-hi/Qwen-Studio-Beautify/main/qwen-studio-beautify.user.js)（或在 Greasy Fork 安装）
3. 打开 [chat.qwen.ai](https://chat.qwen.ai/) 即可生效

## 🔧 使用

页面右下角会出现设置按钮，点击即可打开面板：

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
