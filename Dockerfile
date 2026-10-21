# 站点镜像：COPY 全量仓库 + .dockerignore 排除测试与开发产物。
# 此前逐文件 COPY 曾漏掉 create.html/js/css 导致线上 404，
# 改为 .dockerignore 后新增站点文件自动进镜像。
FROM nginx:alpine
COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
