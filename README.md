# Картографическое приложение

Веб-приложение для работы с картами, поддерживающее WMS и WFS сервисы.

## Возможности

- Отображение интерактивных карт с использованием OpenStreetMap
- Поддержка WMS (Web Map Service) слоев
- Поддержка WFS (Web Feature Service) для получения данных об объектах
- Интерактивное управление слоями
- Клик по объектам для получения информации
- Адаптивный интерфейс с Material-UI

## Технологии

- React 19
- TypeScript
- Vite
- Leaflet + React-Leaflet
- Material-UI
- Axios

## Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd map-app
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и настройте переменные:

```bash
cp .env.example .env
```

Отредактируйте файл `.env`:

```env
# WFS Service Configuration
VITE_WFS_BASE_URL=https://your-wfs-server.com/wfs
VITE_WFS_USERNAME=your_username
VITE_WFS_PASSWORD=your_password

# WMS Service Configuration
VITE_WMS_BASE_URL=https://your-wms-server.com/wms
VITE_WMS_USERNAME=your_username
VITE_WMS_PASSWORD=your_password

# Map Configuration
VITE_DEFAULT_LAYER_NAME=your_layer_name
VITE_MAP_CENTER_LAT=55.7558
VITE_MAP_CENTER_LNG=37.6176
VITE_MAP_ZOOM=10
```

### 3. Запуск приложения

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр сборки
npm run preview
```

## Структура проекта

```
src/
├── components/
│   └── MapView.tsx          # Основной компонент карты
├── hooks/
│   └── useMapClick.ts       # Хук для обработки кликов по карте
├── services/
│   ├── wfsService.ts        # Сервис для работы с WFS
│   └── wmsService.ts        # Сервис для работы с WMS
├── App.tsx                  # Главный компонент приложения
└── main.tsx                 # Точка входа
```

## Использование

1. **Управление слоями**: Используйте кнопку "Слои" в правом верхнем углу для включения/выключения WMS, WFS и ZWS слоев.

2. **Получение информации об объектах**: Кликните на объект на карте для получения информации о нем.

3. **Навигация по карте**: Используйте стандартные элементы управления Leaflet для масштабирования и перемещения по карте.

## API

### WFSService

- `getFeatureByPoint(lat, lng, layerName, buffer?)` - получение объектов по точке
- `getFeaturesByBbox(bbox, layerName)` - получение объектов по области
- `getCapabilities()` - получение информации о доступных слоях

### WMSService

- `getWMSUrl(layerName, bbox, width?, height?)` - получение URL для WMS слоя
- `getCapabilities()` - получение информации о доступных слоях
- `createBbox(minLng, minLat, maxLng, maxLat)` - создание bbox строки

## Переменные окружения

| Переменная                | Описание              | По умолчанию              |
| ------------------------- | --------------------- | ------------------------- |
| `VITE_WFS_BASE_URL`       | URL WFS сервера       | `https://example.com/wfs` |
| `VITE_WFS_USERNAME`       | Имя пользователя WFS  | `mo`                      |
| `VITE_WFS_PASSWORD`       | Пароль WFS            | `mo`                      |
| `VITE_WMS_BASE_URL`       | URL WMS сервера       | `https://example.com/wms` |
| `VITE_WMS_USERNAME`       | Имя пользователя WMS  | `mo`                      |
| `VITE_WMS_PASSWORD`       | Пароль WMS            | `mo`                      |
| `VITE_DEFAULT_LAYER_NAME` | Имя слоя по умолчанию | `test_layer`              |
| `VITE_MAP_CENTER_LAT`     | Широта центра карты   | `55.7558`                 |
| `VITE_MAP_CENTER_LNG`     | Долгота центра карты  | `37.6176`                 |
| `VITE_MAP_ZOOM`           | Масштаб карты         | `10`                      |

## Разработка

### Линтинг

```bash
npm run lint
```

### Сборка

```bash
npm run build
```

## Лицензия

MIT
