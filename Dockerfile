# Static site: nginx serves the files as-is (no build step).
# Blocks runs containers as non-root, so use the unprivileged nginx image (user 101, no port 80).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY assets /usr/share/nginx/html/assets
USER 101
EXPOSE 8080
