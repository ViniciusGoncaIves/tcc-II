# Imagem da API do DoseCerta (Node.js + Express), usada pelo docker-compose.yml da raiz.
FROM node:24-alpine

WORKDIR /app

# Dependências antes do código: enquanto o package.json não muda, o Docker
# reaproveita esta etapa e a montagem fica mais rápida.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Pasta da sessão do WhatsApp (parte 8), criada já com o dono "node" para o
# volume do compose herdar a permissão de escrita.
RUN mkdir -p /app/sessao-whatsapp && chown node:node /app/sessao-whatsapp

ENV NODE_ENV=production

# Roda com um usuário sem privilégios, e não como root.
USER node

EXPOSE 3000

CMD ["node", "src/index.js"]
