FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM caddy:2-alpine

RUN setcap -r /usr/bin/caddy

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

EXPOSE 80
