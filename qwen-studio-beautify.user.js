// ==UserScript==
// @name         Qwen Studio Beautify
// @namespace    https://chat.qwen.ai/
// @version      6.9.3
// @description  Acrylic effect, custom background (image/video), HSV theme color, custom font, hide footer
// @author       You
// @match        https://chat.qwen.ai/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    /* Detect phone UA — hide sidebar on phones only; tablets/desktops/ChromeOS keep acrylic */
    (function () {
        var ua = navigator.userAgent || '';
        var isPhone = /Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(ua);
        if (isPhone) document.documentElement.classList.add('qb-phone-ua');
    })();

    var STYLE_ID = 'qwen-beautify-style';
    var THEME_STYLE_ID = 'qwen-beautify-theme';
    var DB_NAME = 'qwen_beautify';
    var DB_VERSION = 1;
    var STORE_NAME = 'backgrounds';

    function openDB() {
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = function (e) { resolve(e.target.result); };
            req.onerror = function (e) { reject(e.target.error); };
        });
    }

    function idbPut(key, value) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(value, key);
                tx.oncomplete = function () { db.close(); resolve(); };
                tx.onerror = function () { db.close(); reject(tx.error); };
            });
        }).catch(function (e) { console.warn('IDB put failed:', e); });
    }

    function idbGet(key) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, 'readonly');
                var req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = function () { db.close(); resolve(req.result || null); };
                req.onerror = function () { db.close(); reject(req.error); };
            });
        }).catch(function (e) { console.warn('IDB get failed:', e); return null; });
    }

    function idbDelete(key) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(key);
                tx.oncomplete = function () { db.close(); resolve(); };
                tx.onerror = function () { db.close(); reject(tx.error); };
            });
        }).catch(function (e) { console.warn('IDB delete failed:', e); });
    }

    function gmGet(key, def) {
        try { return GM_getValue(key, def); }
        catch (e) { try { var v = localStorage.getItem(key); return v === null ? def : v; } catch (e2) { return def; } }
    }
    function gmSet(key, val) {
        try { GM_setValue(key, val); }
        catch (e) { try { localStorage.setItem(key, typeof val === 'string' ? val : String(val)); } catch (e2) {} }
    }

    function getStoredBgType() { return gmGet('qwen_bg_type', ''); }
    function setStoredBgType(t) { gmSet('qwen_bg_type', t); }
    function getStoredOpacity() { var v = gmGet('qwen_bg_opacity', 1); return typeof v === 'string' ? parseFloat(v || '1') : v; }
    function storeOpacity(v) { gmSet('qwen_bg_opacity', v); }
    function getStoredPos() { return gmGet('qwen_panel_pos', ''); }
    function storePos(p) { gmSet('qwen_panel_pos', p); }
    function getStoredThemeColor() { return gmGet('qwen_theme_color', ''); }
    function storeThemeColor(c) { gmSet('qwen_theme_color', c); }
    function getStoredFont() { return gmGet('qwen_font', ''); }
    function storeFont(f) { gmSet('qwen_font', f); }
    function getStoredAcrylic() { return gmGet('qwen_acrylic', '1') === '1'; }
    function storeAcrylic(v) { gmSet('qwen_acrylic', v ? '1' : '0'); }

    /* Class-based selectors prefixed with html for higher specificity than Qwen's own CSS */
    var ACRYLIC_CSS_SELECTORS = [
        'html .chat-response-message-right',
        'html .chat-response-message-right-touch',
        'html .chat-user-message',
        'html .message-input-container',
        'html .sidebar-wrapper',
        'html .sidebar-wrapper .sidebar',
        'html .sidebar-hide-side',
        'html .sidebar-workspace .workspace-link',
        'html .session-list-wrapper',
        'html .session-list-wrapper-small',
        'html.mobile .sidebar-wrapper .sidebar',
        'html.mobile .sidebar-wrapper-mask .mask',
        'html .header-mobile',
        'html .header-desktop',
        'html .ant-dropdown-menu',
        'html [class*="model-selector-popup"]',
        'html .ant-select-dropdown',
        'html .mode-select-dropdown',
        'html .qwen-dropdown-menu',
        'html .qwen-chat-thinking-and-sources',
        'html .splitter-container-right-panel',
        'html .deep-research-panel',
        'html .deep-research-container',
        'html .deep-research-content',
        'html .deep-research-top',
        'html .deep-research-list-container',
        '#qwen-beautify-toggle',
        '#qwen-beautify-menu',
        '#qb-theme-modal',
        '#qb-font-modal'
    ];

    /* Selectors for inline-style enforcement (no html prefix — used with querySelectorAll) */
    var ACRYLIC_INLINE_SELECTORS = [
        '.chat-response-message-right', '.chat-response-message-right-touch',
        '.chat-user-message', '.message-input-container',
        '.sidebar-wrapper', '.sidebar-wrapper .sidebar',
        '.sidebar-hide-side', '.sidebar-workspace .workspace-link',
        '.session-list-wrapper', '.session-list-wrapper-small',
        '.header-mobile', '.header-desktop',
        '.ant-dropdown-menu', '[class*="model-selector-popup"]',
        '.ant-select-dropdown', '.mode-select-dropdown',
        '.qwen-dropdown-menu', '.qwen-chat-thinking-and-sources',
        '.splitter-container-right-panel',
        '.deep-research-panel', '.deep-research-container', '.deep-research-content',
        '.deep-research-top', '.deep-research-list-container',
        '#qwen-beautify-toggle', '#qwen-beautify-menu',
        '#qb-theme-modal', '#qb-font-modal'
    ];

    var _acrylicOff = false;

    function enforceAcrylicOff() {
        if (!_acrylicOff) return;
        ACRYLIC_INLINE_SELECTORS.forEach(function (sel) {
            try {
                document.querySelectorAll(sel).forEach(function (el) {
                    el.style.setProperty('backdrop-filter', 'none', 'important');
                    el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
                });
            } catch (e) {}
        });
    }

    function clearAcrylicInlineStyles() {
        ACRYLIC_INLINE_SELECTORS.forEach(function (sel) {
            try {
                document.querySelectorAll(sel).forEach(function (el) {
                    el.style.removeProperty('backdrop-filter');
                    el.style.removeProperty('-webkit-backdrop-filter');
                });
            } catch (e) {}
        });
    }

    function applyAcrylic(enabled) {
        _acrylicOff = !enabled;
        var existing = document.getElementById('qwen-beautify-acrylic-off');
        if (enabled) {
            if (existing) existing.remove();
            clearAcrylicInlineStyles();
            return;
        }
        if (!existing) {
            existing = document.createElement('style');
            existing.id = 'qwen-beautify-acrylic-off';
        }
        var selStr = ACRYLIC_CSS_SELECTORS.join(',\n        ');
        existing.textContent = '\
        ' + selStr + ' {\n\
            backdrop-filter: none !important;\n\
            -webkit-backdrop-filter: none !important;\n\
        }';
        /* Append to end of head to ensure it comes after any dynamically injected styles */
        document.head.appendChild(existing);
        enforceAcrylicOff();
    }

    function applyFont(fontFamily) {
        var existing = document.getElementById('qwen-beautify-font');
        if (!fontFamily) {
            if (existing) existing.remove();
            return;
        }
        if (!existing) {
            existing = document.createElement('style');
            existing.id = 'qwen-beautify-font';
            document.head.appendChild(existing);
        }
        existing.textContent = '* { font-family: ' + fontFamily + ' !important; }';
    }

    var FONTS = [
        { name: '\u7cfb\u7edf\u9ed8\u8ba4 (Default)', value: '' },
        { name: '\u5fae\u8f6f\u96c5\u9ed1 (Microsoft YaHei)', value: '"Microsoft YaHei", "微软雅黑", sans-serif' },
        { name: '\u82f9\u65b9 (PingFang SC)', value: '"PingFang SC", sans-serif' },
        { name: '\u5b8b\u4f53 (SimSun)', value: '"SimSun", "宋体", serif' },
        { name: '\u9ed1\u4f53 (SimHei)', value: '"SimHei", "黑体", sans-serif' },
        { name: '\u6977\u4f53 (KaiTi)', value: '"KaiTi", "楷体", serif' },
        { name: '\u4eff\u5b8b (FangSong)', value: '"FangSong", "仿宋", serif' },
        { name: '\u534e\u6587\u6977\u4f53 (STKaiti)', value: '"STKaiti", "华文楷体", serif' },
        { name: '\u534e\u6587\u5b8b\u4f53 (STSong)', value: '"STSong", "华文宋体", serif' },
        { name: '\u534e\u6587\u9ed1\u4f53 (STHeiti)', value: '"STHeiti", "华文黑体", sans-serif' },
        { name: '\u534e\u6587\u4eff\u5b8b (STFangsong)', value: '"STFangsong", "华文仿宋", serif' },
        { name: '\u534e\u6587\u7ec6\u9ed1 (STXihei)', value: '"STXihei", "华文细黑", sans-serif' },
        { name: '\u534e\u6587\u884c\u6977 (STXingkai)', value: '"STXingkai", "华文行楷", cursive' },
        { name: '\u534e\u6587\u65b0\u9b4f (STXinwei)', value: '"STXinwei", "华文新魏", serif' },
        { name: '\u534e\u6587\u96b6\u4e66 (STLiti)', value: '"STLiti", "华文隶书", serif' },
        { name: '\u534e\u6587\u5f69\u4e91 (STCaiyun)', value: '"STCaiyun", "华文彩云", serif' },
        { name: '\u534e\u6587\u7469\u73c0 (STHupo)', value: '"STHupo", "华文琥珀", sans-serif' },
        { name: '\u5e7c\u5706 (YouYuan)', value: '"YouYuan", "幼圆", sans-serif' },
        { name: '\u96b6\u4e66 (LiSu)', value: '"LiSu", "隶书", serif' },
        { name: '\u65b9\u6b63\u59da\u4f53 (FZYaoTi)', value: '"FZYaoTi", "方正姚体", sans-serif' },
        { name: '\u65b9\u6b63\u8212\u4f53 (FZShuTi)', value: '"FZShuTi", "方正舒体", serif' },
        { name: '\u601d\u6e90\u9ed1\u4f53 (Noto Sans CJK SC)', value: '"Noto Sans CJK SC", "Source Han Sans SC", sans-serif' },
        { name: '\u601d\u6e90\u5b8b\u4f53 (Noto Serif CJK SC)', value: '"Noto Serif CJK SC", "Source Han Serif SC", serif' }
    ];

    function dataUrlToBlob(dataUrl) {
        var arr = dataUrl.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8 = new Uint8Array(n);
        for (var i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
        return new Blob([u8], { type: mime });
    }

    function migrateOldBg() {
        var oldBg = gmGet('qwen_custom_bg', '');
        if (oldBg && typeof oldBg === 'string' && oldBg.indexOf('data:') === 0) {
            try {
                var blob = dataUrlToBlob(oldBg);
                idbPut('image', blob).then(function () {
                    setStoredBgType('image');
                    gmSet('qwen_custom_bg', '');
                });
            } catch (e) { console.warn('Migration failed:', e); }
        }
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = '\
        .chat-footer, .chat-container-statement { display: none !important; }\
        \
        .chat-response-message-right,\
        .chat-response-message-right-touch {\
            background: rgba(255,255,255,0.55) !important;\
            backdrop-filter: blur(16px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(16px) saturate(180%) !important;\
            border-radius: 16px !important;\
            border: 1px solid rgba(255,255,255,0.4) !important;\
            padding: 16px 20px !important;\
            box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;\
            box-sizing: border-box !important;\
        }\
        \
        .response-message-content,\
        .container-response-message-content,\
        .chat-response-message-right .response-message-content,\
        .chat-response-message-right-touch .response-message-content,\
        .qwen-message-content-text,\
        .custom-qwen-markdown,\
        .qwen-markdown,\
        .chat-response-message-right > div,\
        .chat-response-message-right-touch > div {\
            background: transparent !important;\
            border: none !important;\
            box-shadow: none !important;\
        }\
        \
        /* Code blocks: make transparent so acrylic parent shows through */\
        html .chat-response-message-right pre,\
        html .chat-response-message-right-touch pre,\
        html .chat-response-message-right code,\
        html .chat-response-message-right-touch code,\
        html .qwen-markdown pre,\
        html .qwen-markdown code,\
        html .custom-qwen-markdown pre,\
        html .custom-qwen-markdown code,\
        html .response-message-content pre,\
        html .response-message-content code {\
            background: transparent !important;\
        }\
        /* Qwen markdown code block components — use real class names from qwen-chat-fe source */\
        html .qwen-markdown-code,\
        html .qwen-markdown-code-layout,\
        html .qwen-markdown-code-body,\
        html .qwen-markdown-code-body-streaming,\
        html .qwen-markdown-code-body-virtual,\
        html .qwen-markdown-code-editor-viewport,\
        html .qwen-markdown-code-header-wrapper,\
        html .qwen-markdown-code-header-wrapper-sticky,\
        html .qwen-markdown-code-header,\
        html .qwen-markdown-code-header-actions,\
        html .qwen-markdown-code-horizontal-scroll-intent,\
        html .qwen-markdown-code-horizontal-scroll-proxy,\
        html .qwen-markdown-code-horizontal-scroll-proxy-content,\
        html .qwen-markdown-code-horizontal-visual-scroll {\
            background: transparent !important;\
            border: none !important;\
            box-shadow: none !important;\
        }\
        /* Monaco editor inside code blocks — override white background */\
        html .qwen-markdown-code-body .monaco-editor,\
        html .qwen-markdown-code-body-streaming .monaco-editor,\
        html .qwen-markdown-code-body-virtual .monaco-editor,\
        html .qwen-markdown-code .monaco-editor,\
        html .qwen-markdown-code-body .monaco-editor-background,\
        html .qwen-markdown-code-body-streaming .monaco-editor-background,\
        html .qwen-markdown-code-body-virtual .monaco-editor-background,\
        html .qwen-markdown-code .monaco-editor-background,\
        html .qwen-markdown-code-body .overflow-guard,\
        html .qwen-markdown-code-body-streaming .overflow-guard,\
        html .qwen-markdown-code-body-virtual .overflow-guard,\
        html .qwen-markdown-code .overflow-guard,\
        html .qwen-markdown-code-body .view-lines,\
        html .qwen-markdown-code-body-streaming .view-lines,\
        html .qwen-markdown-code-body-virtual .view-lines,\
        html .qwen-markdown-code .view-lines,\
        html .qwen-markdown-code-body .view-line,\
        html .qwen-markdown-code-body-streaming .view-line,\
        html .qwen-markdown-code-body-virtual .view-line,\
        html .qwen-markdown-code .view-line,\
        html .qwen-markdown-code-body .margin,\
        html .qwen-markdown-code-body-streaming .margin,\
        html .qwen-markdown-code-body-virtual .margin,\
        html .qwen-markdown-code .margin {\
            background: transparent !important;\
        }\
        /* Catch-all: all descendants of code body must be transparent */\
        html .qwen-markdown-code-body *,\
        html .qwen-markdown-code-body-streaming *,\
        html .qwen-markdown-code-body-virtual * {\
            background-color: transparent !important;\
        }\
        /* Code block border for visual distinction */\
        html .qwen-markdown-code {\
            border: 1px solid rgba(80,80,90,0.25) !important;\
            border-radius: 8px !important;\
            overflow: hidden !important;\
        }\
        html.dark .qwen-markdown-code {\
            border-color: rgba(255,255,255,0.12) !important;\
        }\
        /* Inline code gets a subtle tint */\
        html .chat-response-message-right code,\
        html .chat-response-message-right-touch code {\
            background: rgba(100,130,240,0.08) !important;\
            padding: 1px 5px !important; border-radius: 4px !important;\
        }\
        html.dark .chat-response-message-right code,\
        html.dark .chat-response-message-right-touch code {\
            background: rgba(100,130,240,0.12) !important;\
        }\
        /* Code inside pre blocks stays transparent (not inline tint) */\
        html .chat-response-message-right pre code,\
        html .chat-response-message-right-touch pre code,\
        html .qwen-markdown-code-body code,\
        html .qwen-markdown-code-body-streaming code,\
        html .qwen-markdown-code-body-virtual code {\
            background: transparent !important; padding: 0 !important; border-radius: 0 !important;\
        }\
        \
        .chat-user-message {\
            background: rgba(255,255,255,0.45) !important;\
            backdrop-filter: blur(20px) saturate(200%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(200%) !important;\
            border-radius: 20px !important;\
            border: 1px solid rgba(255,255,255,0.5) !important;\
            box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;\
        }\
        \
        .message-input-container {\
            background: rgba(255,255,255,0.5) !important;\
            backdrop-filter: blur(24px) saturate(200%) !important;\
            -webkit-backdrop-filter: blur(24px) saturate(200%) !important;\
            border: 1px solid rgba(255,255,255,0.4) !important;\
            box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;\
        }\
        \
        html { background-color: transparent !important; }\
        body, #root, .app { background: transparent !important; }\
        \
        .desktop-layout,\
        .desktop-layout-content,\
        .desktop-layout-content-temporary,\
        .chat-page-container,\
        .layout-main,\
        .layout-main-none-width,\
        .home-page-layout-main,\
        .home-page-layout-main-temporary,\
        .page-loading,\
        .page-loading-absolute,\
        .page-loading-center,\
        .page-loading-fixed,\
        .chat-content,\
        .chat-container,\
        .chat-messages-container,\
        .splitter-container,\
        .splitter-container-left-panel,\
        .splitter-container-right-panel,\
        .panel-group,\
        .desktop-container,\
        .project-layout,\
        .native-layout,\
        .h5-layout,\
        .main-layout,\
        .main-content,\
        .mobile-container,\
        .header-mobile,\
        .chat-header,\
        html.mobile .qwen-textarea-container,\
        .qwen-textarea,\
        .auth-layout,\
        .qwenchat-auth-pc-top {\
            background: transparent !important;\
        }\
        \
        .sidebar-wrapper,\
        .sidebar-wrapper .sidebar,\
        .sidebar-hide-side,\
        .sidebar-workspace .workspace-link,\
        .session-list-wrapper,\
        .session-list-wrapper-small {\
            background: rgba(255,255,255,0.15) !important;\
            backdrop-filter: blur(16px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(16px) saturate(180%) !important;\
        }\
        html.mobile .sidebar-wrapper .sidebar {\
            background: rgba(255,255,255,0.7) !important;\
            backdrop-filter: blur(20px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;\
        }\
        html.mobile.dark .sidebar-wrapper .sidebar {\
            background: rgba(30,30,35,0.7) !important;\
        }\
        html.mobile .sidebar-wrapper-mask .mask {\
            backdrop-filter: blur(4px) !important;\
            -webkit-backdrop-filter: blur(4px) !important;\
        }\
        /* Mobile UA fix: hide sidebar on phone UAs only */\
        html.qb-phone-ua .sidebar-wrapper {\
            display: none !important;\
        }\
        html.qb-phone-ua .splitter-container-left-panel {\
            display: none !important;\
            width: 0 !important;\
            min-width: 0 !important;\
            max-width: 0 !important;\
            overflow: hidden !important;\
        }\
        \
        html.dark .chat-response-message-right,\
        html.dark .chat-response-message-right-touch {\
            background: rgba(40,40,45,0.55) !important;\
            border-color: rgba(255,255,255,0.12) !important;\
        }\
        html.dark .chat-user-message {\
            background: rgba(50,50,55,0.5) !important;\
            border-color: rgba(255,255,255,0.1) !important;\
        }\
        html.dark .message-input-container {\
            background: rgba(45,45,50,0.55) !important;\
            border-color: rgba(255,255,255,0.1) !important;\
        }\
        html.dark .sidebar-wrapper,\
        html.dark .sidebar-wrapper .sidebar,\
        html.dark .sidebar-hide-side,\
        html.dark .session-list-wrapper,\
        html.dark .session-list-wrapper-small {\
            background: rgba(30,30,35,0.2) !important;\
        }\
        \
        .header-mobile, .header-desktop {\
            background: rgba(255,255,255,0.3) !important;\
            backdrop-filter: blur(20px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;\
        }\
        html.dark .header-mobile, html.dark .header-desktop {\
            background: rgba(30,30,35,0.4) !important;\
        }\
        \
        .ant-dropdown-menu,\
        [class*="model-selector-popup"],\
        .ant-select-dropdown,\
        .mode-select-dropdown,\
        .qwen-dropdown-menu,\
        .ant-select-item-option-active {\
            background: rgba(255, 255, 255, 0.75) !important;\
            backdrop-filter: blur(20px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;\
            border: 1px solid rgba(255, 255, 255, 0.4) !important;\
        }\
        html.dark .ant-dropdown-menu,\
        html.dark [class*="model-selector-popup"],\
        html.dark .ant-select-dropdown,\
        html.dark .mode-select-dropdown,\
        html.dark .qwen-dropdown-menu {\
            background: rgba(30, 30, 35, 0.75) !important;\
            border-color: rgba(255, 255, 255, 0.12) !important;\
        }\
        .ant-dropdown-menu-item:hover,\
        .ant-dropdown-menu-item-active,\
        .ant-select-item-option-active:not(.ant-select-item-option-selected) {\
            background: rgba(100, 130, 240, 0.12) !important;\
        }\
        html.dark .ant-dropdown-menu-item:hover,\
        html.dark .ant-dropdown-menu-item-active {\
            background: rgba(100, 130, 240, 0.15) !important;\
        }\
        .qwen-chat-thinking-and-sources {\
            background: rgba(255, 255, 255, 0.6) !important;\
            backdrop-filter: blur(20px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;\
            border: 1px solid rgba(255, 255, 255, 0.3) !important;\
        }\
        html.dark .qwen-chat-thinking-and-sources {\
            background: rgba(30, 30, 35, 0.6) !important;\
            border-color: rgba(255, 255, 255, 0.1) !important;\
        }\
        .qwen-chat-thinking-and-sources-header,\
        .qwen-chat-thinking-and-sources-content,\
        .qwen-chat-thinking-and-sources .qwen-chat-thinking-status-card-border {\
            background: transparent !important;\
        }\
        \
        /* Deep Research side panel - acrylic effect */\
        html .splitter-container-right-panel {\
            background: transparent !important;\
        }\
        html .deep-research-panel,\
        html .deep-research-container {\
            background: rgba(255, 255, 255, 0.55) !important;\
            backdrop-filter: blur(20px) saturate(180%) !important;\
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;\
        }\
        html.dark .deep-research-panel,\
        html.dark .deep-research-container {\
            background: rgba(40, 40, 45, 0.55) !important;\
        }\
        html .deep-research-content,\
        html .deep-research-top,\
        html .deep-research-list-container,\
        html .deep-research-list-top,\
        html .deep-research-list-top-left,\
        html .deep-research-list-top-right,\
        html .deep-research-times {\
            background: transparent !important;\
        }\
        \
        @media (min-width: 769px) {\
            #qwen-beautify-panel {\
                position: fixed; bottom: 80px; right: 24px; z-index: 2147483647;\
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;\
            }\
            #qwen-beautify-toggle {\
                width: 46px; height: 46px; border-radius: 50%;\
                background: rgba(255,255,255,0.6);\
                backdrop-filter: blur(20px) saturate(180%);\
                -webkit-backdrop-filter: blur(20px) saturate(180%);\
                border: 1px solid rgba(255,255,255,0.5);\
                box-shadow: 0 4px 16px rgba(0,0,0,0.12);\
                cursor: grab; display: flex; align-items: center; justify-content: center;\
                font-size: 22px; user-select: none; transition: box-shadow 0.2s ease;\
            }\
            #qwen-beautify-toggle:active { cursor: grabbing; }\
            #qwen-beautify-toggle:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.18); }\
            #qwen-beautify-menu {\
                position: absolute; bottom: 56px; right: 0; min-width: 260px; max-width: 280px;\
                max-height: calc(100vh - 200px); overflow-y: auto;\
                background: rgba(255,255,255,0.75);\
                backdrop-filter: blur(30px) saturate(200%);\
                -webkit-backdrop-filter: blur(30px) saturate(200%);\
                border: 1px solid rgba(255,255,255,0.5);\
                border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);\
                padding: 14px; display: none; flex-direction: column; gap: 6px;\
            }\
        }\
        \
        @media (max-width: 768px) {\
            .chat-response-message-right,\
            .chat-response-message-right-touch {\
                padding: 12px 14px !important; border-radius: 14px !important; margin-bottom: 8px !important;\
            }\
            .chat-user-message { border-radius: 16px !important; padding: 10px 14px !important; }\
            .message-input-container { border-radius: 22px !important; }\
            #qwen-beautify-panel {\
                position: fixed !important; bottom: 100px !important; right: 20px !important;\
                z-index: 2147483647 !important;\
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;\
            }\
            #qwen-beautify-toggle {\
                width: 52px; height: 52px; border-radius: 50%;\
                background: rgba(255,255,255,0.65);\
                backdrop-filter: blur(20px) saturate(180%);\
                -webkit-backdrop-filter: blur(20px) saturate(180%);\
                border: 1px solid rgba(255,255,255,0.5);\
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);\
                cursor: grab; display: flex; align-items: center; justify-content: center;\
                font-size: 26px; user-select: none;\
                -webkit-tap-highlight-color: transparent; touch-action: manipulation;\
                transition: box-shadow 0.15s ease;\
            }\
            #qwen-beautify-toggle:active { cursor: grabbing; transform: scale(0.92); }\
            #qwen-beautify-menu {\
                position: absolute; bottom: 62px; right: 0;\
                width: calc(100vw - 28px); max-width: 320px;\
                max-height: calc(100vh - 200px); overflow-y: auto;\
                background: rgba(255,255,255,0.8);\
                backdrop-filter: blur(30px) saturate(200%);\
                -webkit-backdrop-filter: blur(30px) saturate(200%);\
                border: 1px solid rgba(255,255,255,0.5);\
                border-radius: 18px; box-shadow: 0 8px 36px rgba(0,0,0,0.2);\
                padding: 16px; display: none; flex-direction: column; gap: 8px;\
            }\
            .qb-btn { padding: 14px 16px !important; font-size: 15px !important; border-radius: 12px !important; min-height: 48px; }\
        }\
        \
        #qwen-beautify-menu.show { display: flex; }\
        #qwen-beautify-panel {\
            visibility: visible !important; opacity: 1 !important;\
            pointer-events: auto !important; display: block !important;\
            transform: none !important; -webkit-transform: none !important;\
        }\
        #qwen-beautify-toggle {\
            visibility: visible !important; opacity: 1 !important;\
            display: flex !important;\
        }\
        html.mobile #qwen-beautify-panel,\
        html.mobile #qwen-beautify-toggle {\
            position: fixed !important;\
            z-index: 2147483647 !important;\
            transform: none !important; -webkit-transform: none !important;\
        }\
        html.mobile #qwen-beautify-panel {\
            bottom: 100px !important; right: 20px !important;\
        }\
        html.mobile #qwen-beautify-toggle {\
            width: 52px !important; height: 52px !important; font-size: 26px !important;\
        }\
        html.mobile #qwen-beautify-menu {\
            width: calc(100vw - 28px) !important; max-width: 320px !important;\
        }\
        .qb-menu-title {\
            font-size: 13px; font-weight: 600; color: #333;\
            margin-bottom: 4px; padding-bottom: 8px;\
            border-bottom: 1px solid rgba(0,0,0,0.08);\
        }\
        html.dark .qb-menu-title { color: #eee; }\
        html.dark #qwen-beautify-menu { background: rgba(30,30,35,0.85); border-color: rgba(255,255,255,0.12); }\
        html.dark #qwen-beautify-toggle { background: rgba(40,40,45,0.65); border-color: rgba(255,255,255,0.15); }\
        html.dark .qb-btn { background: rgba(50,50,55,0.5); color: #ddd; border-color: rgba(255,255,255,0.1); }\
        .qb-btn {\
            padding: 9px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1);\
            background: rgba(255,255,255,0.5); color: #333; font-size: 13px;\
            cursor: pointer; transition: all 0.2s ease; text-align: left;\
            display: flex; align-items: center; gap: 8px;\
            -webkit-tap-highlight-color: transparent;\
        }\
        .qb-btn:hover { background: rgba(100,130,240,0.15); border-color: rgba(100,130,240,0.3); }\
        .qb-btn:active { transform: scale(0.97); }\
        .qb-btn.danger:hover { background: rgba(240,100,100,0.12); border-color: rgba(240,100,100,0.3); }\
        .qb-slider-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #555; }\
        html.dark .qb-slider-row { color: #aaa; }\
        .qb-slider-row input[type="range"] { flex: 1; accent-color: #6b8af5; }\
        .qb-hidden-file { display: none; }\
        .qb-section-label {\
            font-size: 10px; font-weight: 700; color: #999;\
            text-transform: uppercase; letter-spacing: 0.5px;\
            margin-top: 10px; margin-bottom: 2px; padding-top: 8px;\
            border-top: 1px solid rgba(0,0,0,0.06);\
        }\
        html.dark .qb-section-label { color: #777; border-top-color: rgba(255,255,255,0.08); }\
        #qb-theme-wheel-container { margin: 6px 0; }\
        #qb-theme-wheel-container canvas { -webkit-tap-highlight-color: transparent; }\
        .qb-color-info { display: flex; align-items: center; gap: 8px; margin-top: 6px; }\
        .qb-color-preview {\
            width: 28px; height: 28px; border-radius: 6px;\
            border: 1px solid rgba(0,0,0,0.2); flex-shrink: 0;\
        }\
        html.dark .qb-color-preview { border-color: rgba(255,255,255,0.2); }\
        .qb-color-hex {\
            flex: 1; padding: 4px 8px; border-radius: 6px;\
            border: 1px solid rgba(0,0,0,0.15); font-size: 12px;\
            font-family: monospace; background: rgba(255,255,255,0.5);\
            color: #333; width: 80px;\
        }\
        html.dark .qb-color-hex {\
            background: rgba(50,50,55,0.5); color: #ddd; border-color: rgba(255,255,255,0.1);\
        }\
        .qb-bg-status { font-size: 11px; color: #888; margin-top: 2px; }\
        html.dark .qb-bg-status { color: #777; }\
        \
        #qb-theme-modal-backdrop {\
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\
            background: rgba(0, 0, 0, 0.3); z-index: 100000;\
            display: flex; align-items: center; justify-content: center;\
        }\
        #qb-theme-modal {\
            background: rgba(255, 255, 255, 0.85);\
            backdrop-filter: blur(30px) saturate(200%);\
            -webkit-backdrop-filter: blur(30px) saturate(200%);\
            border: 1px solid rgba(255, 255, 255, 0.5);\
            border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);\
            padding: 24px; max-width: 360px; width: calc(100vw - 40px);\
        }\
        html.dark #qb-theme-modal {\
            background: rgba(30, 30, 35, 0.85);\
            border-color: rgba(255, 255, 255, 0.12);\
        }\
        .qb-modal-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #333; }\
        html.dark .qb-modal-title { color: #eee; }\
        .qb-modal-actions { display: flex; gap: 8px; margin-top: 16px; }\
        \
        #qb-font-modal-backdrop {\
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\
            background: rgba(0, 0, 0, 0.3); z-index: 100000;\
            display: flex; align-items: center; justify-content: center;\
        }\
        #qb-font-modal {\
            background: rgba(255, 255, 255, 0.85);\
            backdrop-filter: blur(30px) saturate(200%);\
            -webkit-backdrop-filter: blur(30px) saturate(200%);\
            border: 1px solid rgba(255, 255, 255, 0.5);\
            border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);\
            padding: 24px; max-width: 400px; width: calc(100vw - 40px);\
            max-height: 70vh; overflow-y: auto;\
        }\
        html.dark #qb-font-modal {\
            background: rgba(30, 30, 35, 0.85);\
            border-color: rgba(255, 255, 255, 0.12);\
        }\
        .qb-font-item {\
            padding: 12px 16px; border-radius: 10px; cursor: pointer;\
            border: 1px solid rgba(0, 0, 0, 0.08); margin-bottom: 6px;\
            background: rgba(255, 255, 255, 0.4); transition: all 0.2s;\
            font-size: 15px; color: #333;\
        }\
        .qb-font-item:hover { background: rgba(100, 130, 240, 0.15); }\
        .qb-font-item.active { border-color: #6b8af5; background: rgba(100, 130, 240, 0.12); }\
        html.dark .qb-font-item { background: rgba(50, 50, 55, 0.4); border-color: rgba(255, 255, 255, 0.08); color: #ddd; }\
        ';
        document.head.appendChild(style);
    }

    var _currentBgUrl = null;

    function revokeBgUrl() {
        if (_currentBgUrl) {
            try { URL.revokeObjectURL(_currentBgUrl); } catch (e) {}
            _currentBgUrl = null;
        }
    }

    function applyImageBackground(url, opacity) {
        removeVideoBackground();
        revokeBgUrl();
        _currentBgUrl = url;
        var bgLayer = document.getElementById('qwen-custom-bg-layer');
        if (!bgLayer) {
            bgLayer = document.createElement('div');
            bgLayer.id = 'qwen-custom-bg-layer';
            bgLayer.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;pointer-events:none!important;z-index:-2!important;';
            document.documentElement.appendChild(bgLayer);
        }
        bgLayer.dataset.url = url;
        bgLayer.style.setProperty('background-image', 'url("' + url + '")', 'important');
        bgLayer.style.setProperty('background-size', 'cover', 'important');
        bgLayer.style.setProperty('background-position', 'center', 'important');
        bgLayer.style.setProperty('background-repeat', 'no-repeat', 'important');
        document.documentElement.style.setProperty('background-color', 'transparent', 'important');
        ensureOpacityOverlay(opacity);
    }

    function applyVideoBackground(url, opacity) {
        removeImageBackground();
        revokeBgUrl();
        _currentBgUrl = url;
        var videoLayer = document.getElementById('qwen-custom-bg-video');
        if (!videoLayer) {
            videoLayer = document.createElement('video');
            videoLayer.id = 'qwen-custom-bg-video';
            videoLayer.setAttribute('autoplay', '');
            videoLayer.setAttribute('loop', '');
            videoLayer.setAttribute('muted', '');
            videoLayer.setAttribute('playsinline', '');
            videoLayer.disablePictureInPicture = true;
            videoLayer.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;object-fit:cover!important;pointer-events:none!important;z-index:-2!important;';
            document.documentElement.appendChild(videoLayer);
        }
        videoLayer.dataset.url = url;
        videoLayer.src = url;
        videoLayer.volume = 0;
        videoLayer.play().catch(function () {});
        document.documentElement.style.setProperty('background-color', 'transparent', 'important');
        ensureOpacityOverlay(opacity);
    }

    function removeImageBackground() {
        var bgLayer = document.getElementById('qwen-custom-bg-layer');
        if (bgLayer) {
            bgLayer.remove();
        }
    }

    function removeVideoBackground() {
        var v = document.getElementById('qwen-custom-bg-video');
        if (v) {
            v.pause();
            v.src = '';
            v.remove();
        }
    }

    function clearBackground() {
        revokeBgUrl();
        removeImageBackground();
        removeVideoBackground();
        removeOpacityOverlay();
    }

    function ensureOpacityOverlay(opacity) {
        var overlay = document.getElementById('qwen-bg-opacity-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'qwen-bg-opacity-overlay';
            overlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;pointer-events:none!important;z-index:-1!important;';
            document.documentElement.appendChild(overlay);
        }
        var maskAlpha = 1 - opacity;
        var isDark = document.documentElement.classList.contains('dark');
        var color = isDark ? 'rgba(20,20,25,' + maskAlpha + ')' : 'rgba(255,255,255,' + maskAlpha + ')';
        overlay.style.setProperty('background', color, 'important');
    }

    function removeOpacityOverlay() {
        var overlay = document.getElementById('qwen-bg-opacity-overlay');
        if (overlay) overlay.remove();
    }

    function hsvToRgb(h, s, v) {
        var r, g, b;
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function (x) {
            var h = x.toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('').toUpperCase();
    }

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;
        var d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) { h = 0; } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, v];
    }

    function hexToHsv(hex) {
        var c = hexToRgb(hex);
        return rgbToHsv(c[0], c[1], c[2]);
    }

    function applyThemeColor(hex) {
        if (!hex) { clearThemeColor(); return; }
        var hsv = hexToHsv(hex);
        var h = hsv[0], s = hsv[1], v = hsv[2];

        var base = hsvToRgb(h, s, v);
        var brandHover = hsvToRgb(h, s, Math.max(0, v - 0.1));
        var brandClicked = hsvToRgb(h, s, Math.max(0, v - 0.2));
        var quaternary = hsvToRgb(h, s * 0.15, 0.96);
        var quinary = hsvToRgb(h, s * 0.25, 0.92);
        var senary = hsvToRgb(h, s * 0.4, 0.85);
        var septenary = hsvToRgb(h, s * 0.5, 0.8);

        var antHover = hsvToRgb(h, Math.min(1, s * 0.9), Math.min(1, v + 0.08));
        var antActive = hsvToRgb(h, Math.min(1, s * 1.1), Math.max(0, v - 0.08));
        var antLighter = hsvToRgb(h, s * 0.08, 0.98);

        var darkCharPrimary = hsvToRgb(h, Math.min(1, s * 0.7), Math.min(1, v + 0.15));
        var darkQuinary = hsvToRgb(h, s, Math.max(0, v - 0.35));

        var baseHex = rgbToHex(base[0], base[1], base[2]);
        var brandHoverHex = rgbToHex(brandHover[0], brandHover[1], brandHover[2]);
        var brandClickedHex = rgbToHex(brandClicked[0], brandClicked[1], brandClicked[2]);
        var quaternaryHex = rgbToHex(quaternary[0], quaternary[1], quaternary[2]);
        var quinaryHex = rgbToHex(quinary[0], quinary[1], quinary[2]);
        var senaryHex = rgbToHex(senary[0], senary[1], senary[2]);
        var septenaryHex = rgbToHex(septenary[0], septenary[1], septenary[2]);
        var antHoverHex = rgbToHex(antHover[0], antHover[1], antHover[2]);
        var antActiveHex = rgbToHex(antActive[0], antActive[1], antActive[2]);
        var antLighterHex = rgbToHex(antLighter[0], antLighter[1], antLighter[2]);
        var darkCharPrimaryHex = rgbToHex(darkCharPrimary[0], darkCharPrimary[1], darkCharPrimary[2]);
        var darkQuinaryHex = rgbToHex(darkQuinary[0], darkQuinary[1], darkQuinary[2]);

        var baseRgbStr = base[0] + ',' + base[1] + ',' + base[2];
        var baseRgba08 = 'rgba(' + baseRgbStr + ',0.8)';
        var baseRgba017 = 'rgba(' + baseRgbStr + ',0.17)';
        var baseRgba07 = 'rgba(' + baseRgbStr + ',0.7)';
        var baseRgba05 = 'rgba(' + baseRgbStr + ',0.5)';
        var outlineRgb = 'rgba(' + baseRgbStr + ',0.2)';
        var quaternaryRgb = 'rgb(' + quaternary[0] + ',' + quaternary[1] + ',' + quaternary[2] + ')';
        var antLighterRgb = 'rgb(' + antLighter[0] + ',' + antLighter[1] + ',' + antLighter[2] + ')';
        var senaryRgb = 'rgb(' + senary[0] + ',' + senary[1] + ',' + senary[2] + ')';

        var css = '\
        :root {\
            --ant-primary-color: ' + baseHex + ' !important;\
            --ant-primary-color-hover: ' + antHoverHex + ' !important;\
            --ant-primary-color-active: ' + antActiveHex + ' !important;\
            --ant-primary-color-outline: ' + outlineRgb + ' !important;\
            --ant-primary-5: ' + antHoverHex + ' !important;\
            --ant-primary-6: ' + baseHex + ' !important;\
            --ant-primary-7: ' + antActiveHex + ' !important;\
            --ant-color-primary: ' + baseHex + ' !important;\
            --ant-color-primary-hover: ' + antHoverHex + ' !important;\
            --ant-color-primary-active: ' + antActiveHex + ' !important;\
            --ant-color-primary-bg: ' + quaternaryRgb + ' !important;\
            --ant-color-primary-bg-hover: ' + antLighterRgb + ' !important;\
            --ant-color-primary-border: ' + senaryRgb + ' !important;\
            --ant-color-primary-border-hover: ' + baseHex + ' !important;\
            --ant-color-primary-text: ' + baseHex + ' !important;\
            --ant-color-primary-text-hover: ' + antHoverHex + ' !important;\
            --ant-color-primary-text-active: ' + antActiveHex + ' !important;\
        }\
        html.light {\
            --btn-brandprimary-fill: ' + baseHex + ' !important;\
            --btn-brandprimary-fill-hover: ' + brandHoverHex + ' !important;\
            --btn-brandprimary-fill-clicked: ' + brandClickedHex + ' !important;\
            --btn-brandprimary-fill-disabled: rgba(169,170,184,.3) !important;\
            --btn-brandprimary-text: #f7f8fc !important;\
            --btn-brandprimary-text-hover: #f7f8fc !important;\
            --btn-brandprimary-text-clicked: #f7f8fc !important;\
            --btn-brandprimary-text-disabled: rgba(169,170,184,.6) !important;\
            --character-brandprimary-text: ' + baseHex + ' !important;\
            --character-brandsecondary-text: ' + brandHoverHex + ' !important;\
            --character-brandtertiary-text: ' + brandClickedHex + ' !important;\
            --container-brandprimary-fill: ' + baseHex + ' !important;\
            --container-brandsecondary-fill: ' + brandHoverHex + ' !important;\
            --container-brandtertiary-fill: ' + brandClickedHex + ' !important;\
            --container-brandquaternary-fill: ' + quaternaryHex + ' !important;\
            --container-brandquinary-fill: ' + quinaryHex + ' !important;\
            --container-brandsenary-fill: ' + senaryHex + ' !important;\
            --container-brandseptenary-fill: ' + septenaryHex + ' !important;\
            --line-brandprimary-border: ' + baseHex + ' !important;\
            --line-brandsecondary-border: ' + septenaryHex + ' !important;\
        }\
        html.dark {\
            --btn-brandprimary-fill: ' + baseRgba08 + ' !important;\
            --btn-brandprimary-fill-hover: ' + brandHoverHex + ' !important;\
            --btn-brandprimary-fill-clicked: ' + brandClickedHex + ' !important;\
            --btn-brandprimary-fill-disabled: rgba(169,170,184,.3) !important;\
            --btn-brandprimary-text: #f7f8fc !important;\
            --btn-brandprimary-text-hover: #f7f8fc !important;\
            --btn-brandprimary-text-clicked: #f7f8fc !important;\
            --btn-brandprimary-text-disabled: rgba(169,170,184,.6) !important;\
            --character-brandprimary-text: ' + darkCharPrimaryHex + ' !important;\
            --character-brandsecondary-text: ' + brandHoverHex + ' !important;\
            --character-brandtertiary-text: ' + brandClickedHex + ' !important;\
            --container-brandprimary-fill: ' + baseRgba08 + ' !important;\
            --container-brandsecondary-fill: ' + brandHoverHex + ' !important;\
            --container-brandtertiary-fill: ' + brandClickedHex + ' !important;\
            --container-brandquaternary-fill: ' + baseRgba017 + ' !important;\
            --container-brandquinary-fill: ' + darkQuinaryHex + ' !important;\
            --container-brandsenary-fill: ' + senaryHex + ' !important;\
            --container-brandseptenary-fill: ' + baseRgba07 + ' !important;\
            --line-brandprimary-border: ' + baseHex + ' !important;\
            --line-brandsecondary-border: ' + baseRgba05 + ' !important;\
        }\
        .qwen-chat-btn.brandprimary,\
        .qwen-chat-btn[class*="brandprimary"] {\
            background: ' + baseHex + ' !important;\
            border-color: ' + baseHex + ' !important;\
            color: #fff !important;\
        }\
        .qwen-chat-btn.brandprimary:hover,\
        .qwen-chat-btn[class*="brandprimary"]:hover {\
            background: ' + brandHoverHex + ' !important;\
            border-color: ' + brandHoverHex + ' !important;\
        }\
        .qwen-chat-btn.brandprimary:active,\
        .qwen-chat-btn[class*="brandprimary"]:active {\
            background: ' + brandClickedHex + ' !important;\
            border-color: ' + brandClickedHex + ' !important;\
        }\
        .ant-btn-primary {\
            background: ' + baseHex + ' !important;\
            border-color: ' + baseHex + ' !important;\
        }\
        .ant-btn-primary:hover { background: ' + antHoverHex + ' !important; border-color: ' + antHoverHex + ' !important; }\
        .ant-btn-primary:active { background: ' + antActiveHex + ' !important; border-color: ' + antActiveHex + ' !important; }\
        .ant-btn-link, .ant-btn-text:hover { color: ' + baseHex + ' !important; }\
        .send-button:not(.disabled) {\
            background: ' + baseHex + ' !important;\
            border-color: ' + baseHex + ' !important;\
        }\
        .send-button:not(.disabled):hover { background: ' + antHoverHex + ' !important; }\
        .ant-checkbox-checked .ant-checkbox-inner {\
            background: ' + baseHex + ' !important;\
            border-color: ' + baseHex + ' !important;\
        }\
        .ant-radio-checked .ant-radio-inner { border-color: ' + baseHex + ' !important; }\
        .ant-radio-checked .ant-radio-inner::after { background: ' + baseHex + ' !important; }\
        .ant-switch-checked { background: ' + baseHex + ' !important; }\
        .ant-pagination-item-active { border-color: ' + baseHex + ' !important; }\
        .ant-pagination-item-active a { color: ' + baseHex + ' !important; }\
        .ant-tabs-ink-bar { background: ' + baseHex + ' !important; }\
        .ant-tabs-tab-active .ant-tabs-tab-btn { color: ' + baseHex + ' !important; }\
        .ant-select-focused .ant-select-selector {\
            border-color: ' + baseHex + ' !important;\
            box-shadow: 0 0 0 2px ' + outlineRgb + ' !important;\
        }\
        .ant-input:focus, .ant-input-affix-wrapper-focused {\
            border-color: ' + baseHex + ' !important;\
            box-shadow: 0 0 0 2px ' + outlineRgb + ' !important;\
        }\
        .ant-progress-bg { background: ' + baseHex + ' !important; }\
        .ant-slider-track { background: ' + baseHex + ' !important; }\
        .ant-slider-handle::after { border-color: ' + baseHex + ' !important; }\
        .qwen-select-thinking-label-text,\
        .mode-select-open-mode-select,\
        [class*="thinking"] .qwen-select-thinking-label-text {\
            color: ' + baseHex + ' !important;\
        }\
        .guidance-pc-get-started-btn,\
        .guidance-pc-shuffle-btn {\
            background: ' + baseHex + ' !important;\
        }\
        .scroll-down-button {\
            background: ' + baseHex + ' !important;\
        }\
        ';

        var style = document.getElementById(THEME_STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = THEME_STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = css;
    }

    function clearThemeColor() {
        var style = document.getElementById(THEME_STYLE_ID);
        if (style) style.remove();
    }

    function drawSVSquare(canvas, hue) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        var hueRgb = hsvToRgb(hue, 1, 1);
        var hueColor = 'rgb(' + hueRgb[0] + ',' + hueRgb[1] + ',' + hueRgb[2] + ')';
        var hGrad = ctx.createLinearGradient(0, 0, w, 0);
        hGrad.addColorStop(0, '#ffffff');
        hGrad.addColorStop(1, hueColor);
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, 0, w, h);
        var vGrad = ctx.createLinearGradient(0, 0, 0, h);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, w, h);
    }

    function drawHueSlider(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var grad = ctx.createLinearGradient(0, 0, w, 0);
        for (var i = 0; i <= 6; i++) {
            var rgb = hsvToRgb(i / 6, 1, 1);
            grad.addColorStop(i / 6, 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    function drawSVIndicator(canvas, s, v) {
        var ctx = canvas.getContext('2d');
        var x = s * canvas.width;
        var y = (1 - v) * canvas.height;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawHueIndicator(canvas, hue) {
        var ctx = canvas.getContext('2d');
        var x = hue * canvas.width;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    function createColorWheel(container, initialColor, onColorChange) {
        var h = 0.645, s = 1.0, v = 1.0;
        if (initialColor) {
            var hsv = hexToHsv(initialColor);
            h = hsv[0]; s = hsv[1]; v = hsv[2];
        }

        var svCanvas = document.createElement('canvas');
        svCanvas.width = 200; svCanvas.height = 200;
        svCanvas.style.cssText = 'width:200px;height:200px;border-radius:8px;cursor:crosshair;display:block;';

        var hueCanvas = document.createElement('canvas');
        hueCanvas.width = 200; hueCanvas.height = 14;
        hueCanvas.style.cssText = 'width:200px;height:14px;border-radius:7px;cursor:crosshair;display:block;margin-top:6px;';

        var infoRow = document.createElement('div');
        infoRow.className = 'qb-color-info';

        var preview = document.createElement('div');
        preview.className = 'qb-color-preview';

        var hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'qb-color-hex';

        infoRow.appendChild(preview);
        infoRow.appendChild(hexInput);

        container.appendChild(svCanvas);
        container.appendChild(hueCanvas);
        container.appendChild(infoRow);

        var storeTimer = null;

        function update() {
            drawSVSquare(svCanvas, h);
            drawSVIndicator(svCanvas, s, v);
            drawHueSlider(hueCanvas);
            drawHueIndicator(hueCanvas, h);
            var rgb = hsvToRgb(h, s, v);
            var hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
            preview.style.background = hex;
            hexInput.value = hex;
            onColorChange(hex);
            if (storeTimer) clearTimeout(storeTimer);
            storeTimer = setTimeout(function () { storeThemeColor(hex); }, 500);
        }

        var svDragging = false;
        function svUpdate(e) {
            var rect = svCanvas.getBoundingClientRect();
            var cx = e.touches ? e.touches[0].clientX : e.clientX;
            var cy = e.touches ? e.touches[0].clientY : e.clientY;
            var x = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
            var y = Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
            s = x; v = 1 - y;
            update();
        }
        svCanvas.addEventListener('mousedown', function (e) { svDragging = true; svUpdate(e); e.preventDefault(); });
        document.addEventListener('mousemove', function (e) { if (svDragging) svUpdate(e); });
        document.addEventListener('mouseup', function () { svDragging = false; });
        svCanvas.addEventListener('touchstart', function (e) { svDragging = true; svUpdate(e); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', function (e) { if (svDragging) { svUpdate(e); e.preventDefault(); } }, { passive: false });
        document.addEventListener('touchend', function () { svDragging = false; });

        var hueDragging = false;
        function hueUpdate(e) {
            var rect = hueCanvas.getBoundingClientRect();
            var cx = e.touches ? e.touches[0].clientX : e.clientX;
            var x = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
            h = x;
            update();
        }
        hueCanvas.addEventListener('mousedown', function (e) { hueDragging = true; hueUpdate(e); e.preventDefault(); });
        document.addEventListener('mousemove', function (e) { if (hueDragging) hueUpdate(e); });
        document.addEventListener('mouseup', function () { hueDragging = false; });
        hueCanvas.addEventListener('touchstart', function (e) { hueDragging = true; hueUpdate(e); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', function (e) { if (hueDragging) { hueUpdate(e); e.preventDefault(); } }, { passive: false });
        document.addEventListener('touchend', function () { hueDragging = false; });

        hexInput.addEventListener('change', function () {
            var val = hexInput.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
                var hsv2 = hexToHsv(val);
                h = hsv2[0]; s = hsv2[1]; v = hsv2[2];
                update();
            }
        });

        update();
        return { update: update };
    }

    function showThemeModal() {
        var existing = document.getElementById('qb-theme-modal-backdrop');
        if (existing) existing.remove();

        var backdrop = document.createElement('div');
        backdrop.id = 'qb-theme-modal-backdrop';

        var modal = document.createElement('div');
        modal.id = 'qb-theme-modal';
        modal.innerHTML =
            '<div class="qb-modal-title">\u4e3b\u9898\u8272\u8bbe\u7f6e</div>' +
            '<div id="qb-theme-wheel-container"></div>' +
            '<div class="qb-modal-actions">' +
            '<button class="qb-btn" id="qb-theme-reset">\u6062\u590d\u9ed8\u8ba4</button>' +
            '<button class="qb-btn" id="qb-theme-close">\u5173\u95ed</button>' +
            '</div>';
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        function close() {
            if (backdrop.parentNode) backdrop.remove();
        }

        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });

        var wheelContainer = document.getElementById('qb-theme-wheel-container');
        var initialColor = getStoredThemeColor();
        createColorWheel(wheelContainer, initialColor, function (hex) {
            applyThemeColor(hex);
        });

        document.getElementById('qb-theme-close').addEventListener('click', close);
        document.getElementById('qb-theme-reset').addEventListener('click', function () {
            storeThemeColor('');
            clearThemeColor();
            wheelContainer.innerHTML = '';
            createColorWheel(wheelContainer, '', function (hex) {
                applyThemeColor(hex);
            });
        });

        return close;
    }

    function showFontModal() {
        var existing = document.getElementById('qb-font-modal-backdrop');
        if (existing) existing.remove();

        var backdrop = document.createElement('div');
        backdrop.id = 'qb-font-modal-backdrop';

        var modal = document.createElement('div');
        modal.id = 'qb-font-modal';
        modal.innerHTML =
            '<div class="qb-modal-title">\u5b57\u4f53\u8bbe\u7f6e</div>' +
            '<div id="qb-font-list"></div>';
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        function close() {
            if (backdrop.parentNode) backdrop.remove();
        }

        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
        });

        var list = document.getElementById('qb-font-list');
        var current = getStoredFont();

        FONTS.forEach(function (font) {
            var item = document.createElement('div');
            item.className = 'qb-font-item';
            item.textContent = font.name;
            if (font.value) {
                item.style.fontFamily = font.value;
            }
            if ((font.value || '') === (current || '')) {
                item.classList.add('active');
            }
            item.addEventListener('click', function () {
                storeFont(font.value);
                applyFont(font.value);
                var items = list.querySelectorAll('.qb-font-item');
                for (var i = 0; i < items.length; i++) {
                    items[i].classList.remove('active');
                }
                item.classList.add('active');
            });
            list.appendChild(item);
        });

        return close;
    }

    var _docListeners = [];

    function addDocListener(type, handler, opts) {
        document.addEventListener(type, handler, opts || false);
        _docListeners.push({ type: type, handler: handler, opts: opts });
    }

    function clearDocListeners() {
        _docListeners.forEach(function (l) {
            document.removeEventListener(l.type, l.handler, l.opts || false);
        });
        _docListeners = [];
    }

    function setPanelPos(panel, x, y) {
        panel.style.setProperty('left', x + 'px', 'important');
        panel.style.setProperty('top', y + 'px', 'important');
        panel.style.setProperty('right', 'auto', 'important');
        panel.style.setProperty('bottom', 'auto', 'important');
    }

    function makeDraggable(toggle, panel) {
        var isDragging = false;
        var startX, startY, origX, origY, hasMoved = false;
        var currentX = 0, currentY = 0;

        var savedPos = getStoredPos();
        if (savedPos) {
            var parts = savedPos.split(',');
            if (parts.length === 2) {
                setPanelPos(panel, parseFloat(parts[0]), parseFloat(parts[1]));
                currentX = parseFloat(parts[0]);
                currentY = parseFloat(parts[1]);
            }
        } else {
            /* Calculate default position based on CSS right/bottom values */
            var panelW = panel.offsetWidth || 52;
            var panelH = panel.offsetHeight || 52;
            var isMobile = window.innerWidth <= 768;
            var defaultRight = isMobile ? 20 : 24;
            var defaultBottom = isMobile ? 100 : 80;
            currentX = window.innerWidth - defaultRight - panelW;
            currentY = window.innerHeight - defaultBottom - panelH;
            setPanelPos(panel, currentX, currentY);
        }

        function onDown(e) {
            isDragging = true;
            hasMoved = false;
            var touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            var rect = panel.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            e.stopPropagation();
        }

        function onMove(e) {
            if (!isDragging) return;
            var touch = e.touches ? e.touches[0] : e;
            var dx = touch.clientX - startX;
            var dy = touch.clientY - startY;
            var threshold = e.touches ? 8 : 3;
            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) hasMoved = true;
            var newX = Math.max(0, Math.min(origX + dx, window.innerWidth - panel.offsetWidth));
            var newY = Math.max(0, Math.min(origY + dy, window.innerHeight - panel.offsetHeight));
            setPanelPos(panel, newX, newY);
            currentX = newX;
            currentY = newY;
            if (e.touches) e.preventDefault();
        }

        function onUp() {
            if (!isDragging) return;
            isDragging = false;
            if (hasMoved) {
                storePos(currentX + ',' + currentY);
            }
        }

        function adjustMenuPosition() {
            var menu = document.getElementById('qwen-beautify-menu');
            if (!menu) return;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var onLeft = currentX < vw / 2;
            var onTop = currentY < vh / 2;

            if (onLeft) {
                menu.style.left = '0';
                menu.style.right = 'auto';
            } else {
                menu.style.left = 'auto';
                menu.style.right = '0';
            }

            if (onTop) {
                menu.style.top = '62px';
                menu.style.bottom = 'auto';
            } else {
                menu.style.top = 'auto';
                menu.style.bottom = '62px';
            }
        }

        toggle.addEventListener('mousedown', onDown);
        addDocListener('mousemove', onMove);
        addDocListener('mouseup', onUp);
        toggle.addEventListener('touchstart', onDown, { passive: false });
        addDocListener('touchmove', onMove, { passive: false });
        addDocListener('touchend', onUp);

        return {
            hasMoved: function () { return hasMoved; },
            adjustMenu: adjustMenuPosition
        };
    }

    function createPanel() {
        if (document.getElementById('qwen-beautify-panel')) return;
        clearDocListeners();

        var panel = document.createElement('div');
        panel.id = 'qwen-beautify-panel';
        panel.innerHTML = '\
            <div id="qwen-beautify-toggle" title="\u8bbe\u7f6e">[+]</div>\
            <div id="qwen-beautify-menu">\
                <div class="qb-menu-title">Qwen Studio \u7f8e\u5316\u8bbe\u7f6e</div>\
                <div class="qb-section-label">\u80cc\u666f\u8bbe\u7f6e</div>\
                <div class="qb-bg-status" id="qb-bg-status">\u5f53\u524d: \u65e0\u80cc\u666f</div>\
                <button class="qb-btn" id="qb-upload-img">\u4e0a\u4f20\u56fe\u7247\u80cc\u666f</button>\
                <input type="file" class="qb-hidden-file" id="qb-img-input" accept="image/*">\
                <button class="qb-btn" id="qb-upload-video">\u4e0a\u4f20\u89c6\u9891\u52a8\u6001\u80cc\u666f</button>\
                <input type="file" class="qb-hidden-file" id="qb-video-input" accept="video/*">\
                <div class="qb-slider-row">\
                    <span>\u900f\u660e\u5ea6</span>\
                    <input type="range" id="qb-opacity-slider" min="0.2" max="1" step="0.05" value="1">\
                    <span id="qb-opacity-val">100%</span>\
                </div>\
                <button class="qb-btn danger" id="qb-clear-bg">\u6e05\u9664\u80cc\u666f</button>\
                <div class="qb-section-label">\u4e3b\u9898\u4e0e\u5b57\u4f53</div>\
                <button class="qb-btn" id="qb-open-theme">\u4fee\u6539\u4e3b\u9898\u8272</button>\
                <button class="qb-btn" id="qb-open-font">\u4fee\u6539\u5b57\u4f53</button>\
                <div class="qb-section-label">\u5176\u4ed6</div>\
                <button class="qb-btn" id="qb-toggle-acrylic">\
                    <span id="qb-acrylic-text">\u4e9a\u514b\u529b\u6548\u679c: \u5f00\u542f</span>\
                </button>\
                <button class="qb-btn" id="qb-toggle-disclaimer">\
                    <span id="qb-disclaimer-text">\u5e95\u90e8\u58f0\u660e\u5df2\u9690\u85cf</span>\
                </button>\
                <button class="qb-btn" id="qb-reset-pos">\u91cd\u7f6e\u60ac\u6d6e\u7403\u4f4d\u7f6e</button>\
                <button class="qb-btn danger" id="qb-init-script">\u521d\u59cb\u5316\u811a\u672c\uff08\u6e05\u9664\u6240\u6709\u6570\u636e\uff09</button>\
            </div>\
        ';
        (document.documentElement || document.body).appendChild(panel);

        var toggle = document.getElementById('qwen-beautify-toggle');
        var menu = document.getElementById('qwen-beautify-menu');
        var bgStatus = document.getElementById('qb-bg-status');

        function updateBgStatus() {
            var type = getStoredBgType();
            if (type === 'image') bgStatus.textContent = '\u5f53\u524d: \u56fe\u7247\u80cc\u666f';
            else if (type === 'video') bgStatus.textContent = '\u5f53\u524d: \u89c6\u9891\u80cc\u666f';
            else bgStatus.textContent = '\u5f53\u524d: \u65e0\u80cc\u666f';
        }
        updateBgStatus();

        var dragInfo = makeDraggable(toggle, panel);

        toggle.addEventListener('click', function (e) {
            if (dragInfo.hasMoved()) { e.stopPropagation(); return; }
            e.stopPropagation();
            dragInfo.adjustMenu();
            menu.classList.toggle('show');
        });
        addDocListener('click', function (e) {
            if (!panel.contains(e.target)) menu.classList.remove('show');
        });
        addDocListener('touchstart', function (e) {
            if (!panel.contains(e.target)) menu.classList.remove('show');
        }, { passive: true });

        var imgInput = document.getElementById('qb-img-input');
        var imgBtn = document.getElementById('qb-upload-img');
        imgBtn.addEventListener('click', function () { imgInput.click(); });
        imgInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var blob = file.slice(0, file.size, file.type);
            idbPut('image', blob).then(function () {
                idbDelete('video').then(function () {
                    setStoredBgType('image');
                    var url = URL.createObjectURL(blob);
                    applyImageBackground(url, getStoredOpacity());
                    updateBgStatus();
                    menu.classList.remove('show');
                });
            });
            e.target.value = '';
        });

        var videoInput = document.getElementById('qb-video-input');
        var videoBtn = document.getElementById('qb-upload-video');
        videoBtn.addEventListener('click', function () { videoInput.click(); });
        videoInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var blob = file.slice(0, file.size, file.type);
            idbPut('video', blob).then(function () {
                idbDelete('image').then(function () {
                    setStoredBgType('video');
                    var url = URL.createObjectURL(blob);
                    applyVideoBackground(url, getStoredOpacity());
                    updateBgStatus();
                    menu.classList.remove('show');
                });
            });
            e.target.value = '';
        });

        var slider = document.getElementById('qb-opacity-slider');
        var opacityVal = document.getElementById('qb-opacity-val');
        slider.value = getStoredOpacity();
        opacityVal.textContent = Math.round(getStoredOpacity() * 100) + '%';
        slider.addEventListener('input', function (e) {
            var val = parseFloat(e.target.value);
            storeOpacity(val);
            opacityVal.textContent = Math.round(val * 100) + '%';
            ensureOpacityOverlay(val);
        });

        document.getElementById('qb-clear-bg').addEventListener('click', function () {
            idbDelete('image');
            idbDelete('video');
            setStoredBgType('');
            clearBackground();
            updateBgStatus();
            menu.classList.remove('show');
        });

        document.getElementById('qb-open-theme').addEventListener('click', function () {
            menu.classList.remove('show');
            showThemeModal();
        });

        document.getElementById('qb-open-font').addEventListener('click', function () {
            menu.classList.remove('show');
            showFontModal();
        });

        var acrylicEnabled = getStoredAcrylic();
        var acrylicBtn = document.getElementById('qb-toggle-acrylic');
        var acrylicText = document.getElementById('qb-acrylic-text');
        function updateAcrylicText() {
            acrylicText.textContent = acrylicEnabled ? '\u4e9a\u514b\u529b\u6548\u679c: \u5f00\u542f' : '\u4e9a\u514b\u529b\u6548\u679c: \u5df2\u5173\u95ed';
        }
        updateAcrylicText();
        acrylicBtn.addEventListener('click', function () {
            acrylicEnabled = !acrylicEnabled;
            storeAcrylic(acrylicEnabled);
            applyAcrylic(acrylicEnabled);
            updateAcrylicText();
        });

        var disclaimerHidden = true;
        var disclaimerBtn = document.getElementById('qb-toggle-disclaimer');
        var disclaimerText = document.getElementById('qb-disclaimer-text');
        disclaimerBtn.addEventListener('click', function () {
            disclaimerHidden = !disclaimerHidden;
            disclaimerText.textContent = disclaimerHidden ? '\u5e95\u90e8\u58f0\u660e\u5df2\u9690\u85cf' : '\u5e95\u90e8\u58f0\u660e\u5df2\u663e\u793a';
            var overrideStyle = document.getElementById('qwen-disclaimer-override');
            if (!disclaimerHidden) {
                if (!overrideStyle) {
                    overrideStyle = document.createElement('style');
                    overrideStyle.id = 'qwen-disclaimer-override';
                    overrideStyle.textContent = '.chat-footer, .chat-container-statement { display: flex !important; }';
                    document.head.appendChild(overrideStyle);
                }
            } else {
                if (overrideStyle) overrideStyle.remove();
            }
        });

        /* Reset floating ball position to default */
        document.getElementById('qb-reset-pos').addEventListener('click', function () {
            storePos('');
            var isMobile = window.innerWidth <= 768;
            var defaultRight = isMobile ? 20 : 24;
            var defaultBottom = isMobile ? 100 : 80;
            var panelW = panel.offsetWidth || 52;
            var panelH = panel.offsetHeight || 52;
            var newX = window.innerWidth - defaultRight - panelW;
            var newY = window.innerHeight - defaultBottom - panelH;
            setPanelPos(panel, newX, newY);
            menu.classList.remove('show');
        });

        /* Initialize script - clear all data and reload */
        document.getElementById('qb-init-script').addEventListener('click', function () {
            if (!confirm('\u786e\u8ba4\u6e05\u9664\u6240\u6709\u811a\u672c\u6570\u636e\uff08\u5305\u62ec\u80cc\u666f\u56fe\u7247/\u89c6\u9891\u3001\u4e3b\u9898\u8272\u3001\u5b57\u4f53\u3001\u4f4d\u7f6e\u7b49\u6240\u6709\u8bbe\u7f6e\uff09\u5e76\u5237\u65b0\u9875\u9762\uff1f')) return;
            /* Clear GM storage keys */
            var keys = ['qwen_bg_type', 'qwen_bg_opacity', 'qwen_panel_pos', 'qwen_theme_color', 'qwen_font', 'qwen_acrylic', 'qwen_custom_bg'];
            keys.forEach(function (k) {
                try { GM_setValue(k, ''); } catch (e) {}
                try { localStorage.removeItem(k); } catch (e) {}
            });
            /* Clear IndexedDB */
            revokeBgUrl();
            try {
                indexedDB.deleteDatabase(DB_NAME);
            } catch (e) {}
            /* Clear localStorage for any remaining keys */
            try {
                var toRemove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var lk = localStorage.key(i);
                    if (lk && lk.indexOf('qwen_') === 0) toRemove.push(lk);
                }
                toRemove.forEach(function (lk) { localStorage.removeItem(lk); });
            } catch (e) {}
            /* Reload page */
            location.reload();
        });
    }

    var TRANSPARENT_SELECTORS = [
        '.desktop-layout', '.desktop-layout-content', '.desktop-layout-content-temporary',
        '.chat-page-container',
        '.layout-main', '.layout-main-none-width',
        '.home-page-layout-main', '.home-page-layout-main-temporary',
        '.page-loading', '.page-loading-absolute', '.page-loading-center', '.page-loading-fixed',
        '.chat-content', '.chat-container', '.chat-messages-container',
        '.splitter-container', '.splitter-container-left-panel', '.splitter-container-right-panel',
        '.panel-group', '.desktop-container',
        '.project-layout', '.native-layout',
        '.h5-layout', '.main-layout', '.main-content', '.mobile-container',
        '.header-mobile', '.chat-header',
        '.qwen-textarea-container', '.qwen-textarea',
        '.app', '#root',
        '.response-message-content', '.container-response-message-content',
        '.auth-layout', '.qwenchat-auth-pc-top',
        '.qwen-chat-thinking-and-sources-header',
        '.qwen-chat-thinking-and-sources-content'
    ];

    var ACRYLIC_SELECTORS = [
        '.chat-response-message-right', '.chat-response-message-right-touch',
        '.chat-user-message', '.message-input-container',
        '.sidebar-wrapper', '.sidebar-wrapper .sidebar',
        '.sidebar-hide-side', '.session-list-wrapper', '.session-list-wrapper-small',
        '.header-mobile', '.header-desktop',
        '#qwen-beautify-panel', '#qwen-beautify-toggle', '#qwen-beautify-menu',
        '#qwen-custom-bg-layer', '#qwen-bg-opacity-overlay', '#qwen-custom-bg-video',
        '.ant-dropdown-menu',
        '[class*="model-selector-popup"]',
        '.ant-select-dropdown',
        '.mode-select-dropdown',
        '.qwen-dropdown-menu',
        '.qwen-chat-thinking-and-sources',
        '#qb-theme-modal-backdrop', '#qb-theme-modal',
        '#qb-font-modal-backdrop', '#qb-font-modal'
    ];

    var ACRYLIC_SELECTOR_STR = ACRYLIC_SELECTORS.join(',');

    function isAcrylicElement(el) {
        if (!el.matches) return false;
        try { return el.matches(ACRYLIC_SELECTOR_STR); } catch (e) {}
        if (el.closest && el.closest('#qwen-beautify-panel')) return true;
        /* Protect all elements inside the mobile sidebar from being made transparent */
        if (el.closest && el.closest('.sidebar-wrapper')) return true;
        return false;
    }

    var _styleLock = false;
    function enforceTransparentBg() {
        if (_styleLock) return;
        _styleLock = true;
        TRANSPARENT_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                if (isAcrylicElement(el)) return;
                el.style.setProperty('background-color', 'transparent', 'important');
                el.style.setProperty('background', 'transparent', 'important');
            });
        });
        _styleLock = false;
        document.documentElement.style.setProperty('background-color', 'transparent', 'important');
    }

    /* Auto-detect and fix white/light background elements that block acrylic effect */
    function fixWhiteBackgrounds() {
        if (!document.body) return;
        var allEls = document.querySelectorAll('div, section, main, aside, header, footer, nav, article');
        for (var i = 0; i < allEls.length; i++) {
            var el = allEls[i];
            if (isAcrylicElement(el)) continue;
            if (el.closest('#qwen-beautify-panel')) continue;
            if (el.closest('.sidebar-wrapper')) continue;
            if (el.id === 'qwen-custom-bg-layer' || el.id === 'qwen-bg-opacity-overlay') continue;
            var cs = window.getComputedStyle(el);
            var bg = cs.backgroundColor;
            if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;
            /* Parse rgb/rgba values */
            var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) continue;
            var r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
            /* If background is white or near-white (light gray), make transparent */
            if (r >= 240 && g >= 240 && b >= 240) {
                el.style.setProperty('background-color', 'transparent', 'important');
                el.style.setProperty('background', 'transparent', 'important');
            }
        }
    }

    /* Force-clear inline background styles inside code blocks (Monaco sets them dynamically) */
    function enforceCodeBlockTransparency() {
        var codeBodies = document.querySelectorAll(
            '.qwen-markdown-code-body, .qwen-markdown-code-body-streaming, .qwen-markdown-code-body-virtual'
        );
        codeBodies.forEach(function (body) {
            body.querySelectorAll('*').forEach(function (el) {
                var bg = el.style.backgroundColor || el.style.background;
                if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                    el.style.setProperty('background-color', 'transparent', 'important');
                    if (el.style.background && el.style.background !== 'transparent') {
                        el.style.setProperty('background', 'transparent', 'important');
                    }
                }
            });
        });
    }

    var bgRestoring = false;
    function enforceBackground() {
        var bgType = getStoredBgType();
        if (!bgType) return;
        if (_currentBgUrl) return;
        var existing = bgType === 'image'
            ? document.getElementById('qwen-custom-bg-layer')
            : document.getElementById('qwen-custom-bg-video');
        if (existing) return;
        if (bgRestoring) return;
        bgRestoring = true;
        idbGet(bgType).then(function (blob) {
            if (blob && !_currentBgUrl) {
                var url = URL.createObjectURL(blob);
                if (bgType === 'image') {
                    applyImageBackground(url, getStoredOpacity());
                } else {
                    applyVideoBackground(url, getStoredOpacity());
                }
            }
            bgRestoring = false;
        }).catch(function () { bgRestoring = false; });
    }

    function init() {
        if (!document.body) { setTimeout(init, 200); return; }
        migrateOldBg();
        injectStyles();
        createPanel();
        applyFont(getStoredFont());
        applyAcrylic(getStoredAcrylic());
        var bgType = getStoredBgType();
        if (bgType === 'image' || bgType === 'video') {
            bgRestoring = true;
            idbGet(bgType).then(function (blob) {
                if (blob && !_currentBgUrl) {
                    var url = URL.createObjectURL(blob);
                    if (bgType === 'image') {
                        applyImageBackground(url, getStoredOpacity());
                    } else {
                        applyVideoBackground(url, getStoredOpacity());
                    }
                }
                bgRestoring = false;
            });
        }
        var themeColor = getStoredThemeColor();
        if (themeColor) applyThemeColor(themeColor);
        enforceTransparentBg();
        fixWhiteBackgrounds();
        forceShowPanel();
    }

    function forceShowPanel() {
        var panel = document.getElementById('qwen-beautify-panel');
        if (!panel) return;
        var toggle = document.getElementById('qwen-beautify-toggle');
        if (toggle) {
            toggle.style.setProperty('visibility', 'visible', 'important');
            toggle.style.setProperty('opacity', '1', 'important');
            toggle.style.setProperty('display', 'flex', 'important');
            toggle.style.setProperty('pointer-events', 'auto', 'important');
        }
        panel.style.setProperty('visibility', 'visible', 'important');
        panel.style.setProperty('opacity', '1', 'important');
        panel.style.setProperty('display', 'block', 'important');
        panel.style.setProperty('pointer-events', 'auto', 'important');
    }

    var observerTimer = null;
    var observer = new MutationObserver(function (mutations) {
        if (_styleLock) return;
        if (observerTimer) return;
        observerTimer = setTimeout(function () {
            observerTimer = null;
            enforceTransparentBg();
            fixWhiteBackgrounds();
            enforceAcrylicOff();
            enforceCodeBlockTransparency();
            enforceBackground();
            clampPanelToScreen();
            if (!document.getElementById('qwen-beautify-panel') && document.body) createPanel();
            forceShowPanel();
        }, 500);
    });

    function startObserver() {
        observer.observe(document.body || document.documentElement, {
            childList: true, subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { init(); startObserver(); });
    } else {
        init(); startObserver();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            clampPanelToScreen();
            enforceBackground();
            if (!document.getElementById('qwen-beautify-panel') && document.body) createPanel();
        }, 300);
    });

    /* Detect orientation change more reliably */
    window.addEventListener('orientationchange', function () {
        setTimeout(clampPanelToScreen, 500);
    });

    function clampPanelToScreen() {
        var panel = document.getElementById('qwen-beautify-panel');
        if (!panel) return;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var pw = panel.offsetWidth || 52;
        var ph = panel.offsetHeight || 52;
        var margin = 8;
        var left = parseFloat(panel.style.left);
        var top = parseFloat(panel.style.top);
        /* If left/top not set via inline style, use getBoundingClientRect */
        if (isNaN(left) || isNaN(top)) {
            var rect = panel.getBoundingClientRect();
            left = rect.left;
            top = rect.top;
        }
        /* Any edge exceeding viewport → clamp back fully inside */
        var newLeft = Math.max(margin, Math.min(left, vw - pw - margin));
        var newTop = Math.max(margin, Math.min(top, vh - ph - margin));
        if (newLeft !== left || newTop !== top) {
            setPanelPos(panel, newLeft, newTop);
            storePos(newLeft + ',' + newTop);
        }
    }
})();
