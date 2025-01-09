FROM node:18-alpine

WORKDIR /app

# Копируем package*.json
COPY package*.json ./

RUN yarn install

# Копируем исходники
COPY . .

RUN yarn build  # если используешь tsc

CMD ["node", "dist/index.js"]