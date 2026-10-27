# Imagem da API do DoseCerta.
FROM node:24-alpine

WORKDIR /app

# Dependências antes do código, para o Docker reaproveitar esta etapa.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Pasta da sessão do WhatsApp, com dono "node" para o volume poder gravar nela.
RUN mkdir -p /app/sessao-whatsapp && chown node:node /app/sessao-whatsapp

ENV NODE_ENV=production

# Roda sem privilégios de root.
USER node

EXPOSE 3000

CMD ["node", "src/index.js"]
