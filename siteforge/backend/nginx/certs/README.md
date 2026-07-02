# SSL 证书目录
#
# 将证书文件放到这里以启用 HTTPS：
#   - fullchain.pem   证书链
#   - privkey.pem     私钥
#
# 启用 HTTPS 步骤：
#   1. 将证书文件放入此目录
#   2. 将 ../conf.d/https.conf.disabled 重命名为 https.conf
#   3. 修改 ../conf.d/siteforge.conf，把 80 端口的 server 改为 301 跳转到 HTTPS
#   4. 在 .env 中设置 HTTPS_ENABLED=true
#   5. docker compose restart nginx
#
# 使用 Let's Encrypt 签发：
#   certbot certonly --standalone -d example.com -d www.example.com
#   cp /etc/letsencrypt/live/example.com/fullchain.pem .
#   cp /etc/letsencrypt/live/example.com/privkey.pem .
