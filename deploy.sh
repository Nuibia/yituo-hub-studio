#!/usr/bin/env bash
# Md2GZH 一键部署：rsync 站点白名单到服务器（与 Docker 镜像同源，见 deploy-files.txt）
# 用法: ./deploy.sh user@服务器IP [目标目录]
# 前置: 服务器已装 nginx，目标目录为 nginx root
set -euo pipefail

TARGET=${1:?用法: ./deploy.sh user@服务器IP [/var/www/yituo-hub]}
DIR=${2:-/var/www/yituo-hub}
HERE=$(cd "$(dirname "$0")" && pwd)

# 白名单同步：只有 deploy-files.txt 列出的站点文件会上线，
# 测试产物（gui-test-screenshots/、cli-func-test/ 等）不再被带上服务器。
rsync -avz --delete \
  --files-from="$HERE/deploy-files.txt" \
  --exclude '.DS_Store' \
  --exclude '._*' \
  "$HERE/" "$TARGET:$DIR/"

ssh "$TARGET" "nginx -t && systemctl reload nginx"
echo "✅ 部署完成: http://${TARGET#*@}/"
