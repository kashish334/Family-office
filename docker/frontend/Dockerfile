FROM node:20-alpine AS builder

ARG VITE_API_URL=http://localhost/api
ARG VITE_APP_NAME="Family Office"

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_APP_NAME=${VITE_APP_NAME}

WORKDIR /app

COPY frontend/package.json ./

# Pin npm itself and install with exact versions
RUN npm install -g npm@10.8.2 && \
    npm install --prefer-dedupe

COPY frontend/ .

RUN ./node_modules/.bin/vite build

RUN test -d dist && echo "Build successful" || (echo "Build failed" && exit 1)


FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN addgroup -g 1001 -S nginxgroup && \
    adduser -u 1001 -S nginxuser -G nginxgroup && \
    chown -R nginxuser:nginxgroup /usr/share/nginx/html && \
    chown -R nginxuser:nginxgroup /var/cache/nginx && \
    chown -R nginxuser:nginxgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginxuser:nginxgroup /var/run/nginx.pid

USER nginxuser
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]