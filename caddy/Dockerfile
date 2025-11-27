FROM caddy:2.10-alpine

ARG CADDY_ENV=default
ARG PTA_PUBLIC_DOMAIN
ENV PTA_PUBLIC_DOMAIN=${PTA_PUBLIC_DOMAIN}

COPY ${CADDY_ENV}.Caddyfile /etc/caddy/Caddyfile

RUN sed -i "s/%PTA_PUBLIC_DOMAIN%/$PTA_PUBLIC_DOMAIN/" /etc/caddy/Caddyfile
