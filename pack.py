"""
GameZone 部署打包脚本
用法：python pack.py
输出：gamezone-best-deploy-v{版本号}.zip（在项目根目录）
"""
import zipfile, os, sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# 版本号：每次打包手动递增
VERSION = "2.0.5"

DST = os.path.join(PROJECT_ROOT, f'gamezone-best-deploy-v{VERSION}.zip')

# arcname 使用正斜杠，确保 Cloudflare Pages 正确识别目录结构
FILES = [
    'ads.txt', 'robots.txt', 'sitemap.xml',
    'css/style.css',
    'js/game-store.js', 'js/gamepix-api.js', 'js/ui.js',
    'index.html', 'category.html', 'game.html', 'search.html',
    'about.html', 'privacy.html', 'terms.html', 'contact.html',
    'games-list.html',
    'og-image.png', 'og-image.svg',
]

# --- 变更记录 ---
# v2.0.5 - 全站链接去 .html 后缀（canonical/og:url/内部链接/JS 统一无后缀格式）
# v2.0.4 - 修复 search.html 软404（添加默认内容）、noindex 修复（game.html/search.html）
# v2.0.3 - SEO Phase 2: JSON-LD、games-list.html、Footer 12分类、sitemap 更新
# v2.0.2 - 邮箱替换为 wangjinman_2008@126.com
# v2.0.1 - GA4 接入、og-image 生成

# 检查版本号是否已通过命令行传入
if len(sys.argv) > 1:
    VERSION = sys.argv[1]
    DST = os.path.join(PROJECT_ROOT, f'gamezone-best-deploy-v{VERSION}.zip')

if os.path.exists(DST):
    os.remove(DST)

with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in FILES:
        local = os.path.join(SCRIPT_DIR, f.replace('/', os.sep))
        zf.write(local, f)
        print(f'  + {f} ({os.path.getsize(local)} bytes)')

size = os.path.getsize(DST)
print(f'\nDone: gamezone-best-deploy-v{VERSION}.zip ({size} bytes)')
