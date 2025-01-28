FROM node:20-alpine

WORKDIR /app

# Устанавливаем необходимые пакеты
RUN apk add --no-cache netcat-openbsd dcron tzdata

# Копируем package*.json и yarn.lock
COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

# Копируем миграции отдельно
COPY migrations ./migrations/
COPY database.json ./

# Копируем остальные исходники
COPY . .

RUN yarn build

# Создаем лог-файл для cron
RUN touch /var/log/cron.log

# Добавляем скрипт для запуска
COPY scripts/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]