# Imagem do front do DoseCerta, usada pelo docker-compose.yml da raiz.

# Etapa 1: o Node monta o front (quasar build).
FROM node:24-alpine AS montagem

WORKDIR /app

# Dependências antes do código, para o Docker reaproveitar esta etapa.
# O --ignore-scripts pula o "quasar prepare" do postinstall, que precisa do
# projeto inteiro; o próprio build faz essa preparação depois.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Endereço da API como o navegador enxerga (o front roda no navegador, fora
# da rede do Docker). Fica gravado no build e é visível: nunca usar segredo.
ARG QCLI_API_URL=http://localhost:3000
RUN echo "QCLI_API_URL=$QCLI_API_URL" > .env && npx quasar build

# Etapa 2: só os arquivos prontos, servidos pelo nginx. O Node fica de fora.
FROM nginx:stable-alpine

COPY --from=montagem /app/dist/spa /usr/share/nginx/html

EXPOSE 80
