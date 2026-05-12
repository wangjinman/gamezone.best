"""
GameZone 部署打包脚本
用法：python pack.py
输出：gamezone-best-deploy-new.zip（在项目根目录）
"""
import zipfile, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DST = os.path.join(PROJECT_ROOT, 'gamezone-best-deploy-new.zip')

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

if os.path.exists(DST):
    os.remove(DST)

with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in FILES:
        local = os.path.join(SCRIPT_DIR, f.replace('/', os.sep))
        zf.write(local, f)
        print(f'  + {f} ({os.path.getsize(local)} bytes)')

print(f'\nDone: {DST} ({os.path.getsize(DST)} bytes)')
