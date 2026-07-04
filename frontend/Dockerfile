# Build context is the repository root (see docker-compose.yml) so this
# stage can also pick up nginx/nginx.conf.
FROM node:22-alpine AS build

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:1.29-alpine

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
