FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS dev-deps
RUN npm ci

FROM dev-deps AS development
COPY . .
EXPOSE 3000
CMD ["node", "--watch", "src/index.js"]

FROM deps AS production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
