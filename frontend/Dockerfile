# Imagem do front do DoseCerta.

# Etapa 1: monta o front com o Node.
FROM node:24-alpine AS montagem

WORKDIR /app

# Dependências antes do código, para o Docker reaproveitar esta etapa.
# --ignore-scripts: o "quasar prepare" do postinstall precisa do projeto inteiro.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Endereço da API visto pelo navegador; fica visível no build.
ARG QCLI_API_URL=http://localhost:3000
RUN echo "QCLI_API_URL=$QCLI_API_URL" > .env && npx quasar build

# Etapa 2: só os arquivos prontos, servidos pelo nginx.
FROM nginx:stable-alpine

COPY --from=montagem /app/dist/spa /usr/share/nginx/html

EXPOSE 80
