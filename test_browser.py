#!/usr/bin/env python3
"""
YiShun App 测试脚本
使用 Playwright 连接到本地 Chrome CDP 进行测试
"""
import json
import os
from playwright.sync_api import sync_playwright

CDP_URL = "http://127.0.0.1:9222"
SCREENSHOT_DIR = "/Users/xiajarvan/Downloads/A股策略交易/yishun-app/test_screenshots"

def ensure_dir():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def save_screenshot(page, name):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"📸 截图已保存: {path}")
    return path

def main():
    ensure_dir()
    
    with sync_playwright() as pw:
        try:
            print("🔗 连接到 Chrome CDP...")
            browser = pw.chromium.connect_over_cdp(CDP_URL)
            print(f"✅ 已连接, 可用上下文: {len(browser.contexts)}")
            
            if browser.contexts:
                ctx = browser.contexts[0]
                print(f"✅ 上下文页面数: {len(ctx.pages)}")
                
                if ctx.pages:
                    page = ctx.pages[0]
                else:
                    page = ctx.new_page()
            else:
                ctx = browser.new_context()
                page = ctx.new_page()
            
            # 1. 打开目标网站
            print("🌐 打开 http://11263.com...")
            page.goto("http://11263.com", wait_until="networkidle", timeout=30000)
            save_screenshot(page, "01_homepage")
            
            print("📄 页面内容预览:")
            print(page.content()[:2000])
            
            # 获取页面所有可点击元素
            print("\n🔍 分析页面元素...")
            
            # 尝试查找输入框
            inputs = page.query_selector_all("input")
            print(f"找到 {len(inputs)} 个 input 元素")
            
            # 尝试查找按钮
            buttons = page.query_selector_all("button")
            print(f"找到 {len(buttons)} 个 button 元素")
            
            # 尝试查找链接
            links = page.query_selector_all("a")
            print(f"找到 {len(links)} 个链接")
            
            # 打印按钮文本
            for i, btn in enumerate(buttons):
                try:
                    text = btn.inner_text().strip()
                    if text:
                        print(f"  按钮 {i+1}: {text}")
                except:
                    pass
            
            # 等待一下
            page.wait_for_timeout(2000)
            
        except Exception as e:
            print(f"❌ 错误: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()