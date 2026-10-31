# =============================================================================
# Dockerfile - Frontend Vite / React / TypeScript (Fongo Gestion)
# Build multi-étapes : construction puis serveur Nginx pour servir les statiques
# =============================================================================

# ---------- Étape 1 : Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package.json package-lock.json* ./
RUN npm ci

# Copie du code et build de production
COPY . .
RUN npm run build

# ---------- Étape 2 : Serveur (Nginx) ----------
FROM nginx:alpine AS runner

# Copie des fichiers buildés depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx pour le SPA (redirection vers index.html pour le routing côté client)
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    location /media { \
        proxy_pass http://backend:8000; \
    } \
    location /static { \
        proxy_pass http://backend:8000; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
