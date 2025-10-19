# Картографическое приложение

Веб-приложение для работы с картами, поддерживающее WMS и WFS сервисы.

## Установка

```bash
npm install
```

## Настройка

Скопируйте `.env.example` в `.env` и настройте переменные:

```bash
cp .env.example .env
```

В файле `.env` укажите ваши настройки:

```env
# WFS Service
VITE_WFS_BASE_URL=https://your-wfs-server.com/wfs
VITE_WFS_USERNAME=your_username
VITE_WFS_PASSWORD=your_password
VITE_WFS_BUFFER=0.001

# WMS Service
VITE_WMS_BASE_URL=https://your-wms-server.com/wms
VITE_WMS_USERNAME=your_username
VITE_WMS_PASSWORD=your_password

# Карта
VITE_DEFAULT_LAYER_NAME=your_layer_name
VITE_MAP_CENTER_LAT=55.7558
VITE_MAP_CENTER_LNG=37.6176
VITE_MAP_ZOOM=10
```

## Запуск

```bash
npm run dev
```

## Использование

- Кнопка "Слои" - управление WMS/WFS слоями
- Клик по карте - получение информации об объектах
- Стандартная навигация Leaflet

## Переменные окружения

| Переменная                | Описание              | По умолчанию |
| ------------------------- | --------------------- | ------------ |
| `VITE_WFS_BASE_URL`       | URL WFS сервера       | -            |
| `VITE_WFS_USERNAME`       | Имя пользователя WFS  | -            |
| `VITE_WFS_PASSWORD`       | Пароль WFS            | -            |
| `VITE_WFS_BUFFER`         | Буфер поиска объектов | `0.001`      |
| `VITE_WMS_BASE_URL`       | URL WMS сервера       | -            |
| `VITE_WMS_USERNAME`       | Имя пользователя WMS  | -            |
| `VITE_WMS_PASSWORD`       | Пароль WMS            | -            |
| `VITE_DEFAULT_LAYER_NAME` | Имя слоя по умолчанию | `test_layer` |
| `VITE_MAP_CENTER_LAT`     | Широта центра карты   | `55.7558`    |
| `VITE_MAP_CENTER_LNG`     | Долгота центра карты  | `37.6176`    |
| `VITE_MAP_ZOOM`           | Масштаб карты         | `10`         |
