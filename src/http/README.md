# HTTP

Легкая обертка для сетевых запросов, которую вызывают репозитории WMS/WFS. Логи и обработка ошибок выводятся в консоль сервисами.

## Где используется

- `src/services/wmsService.ts`
- `src/services/wfsService.ts`

## Как использовать

Обращаемся только через сервисы (напрямую к HTTP-слою — не нужно).

```ts
import { getWMSUrl, testWMSConnection } from "../services/wmsService";
import { getFeatureByPoint } from "../services/wfsService";

const url = getWMSUrl("layer-name");
await testWMSConnection("layer-name");
await getFeatureByPoint(55.75, 37.61, "layer-name");
```

## Переменные окружения

- `VITE_WMS_BASE_URL`
- `VITE_WFS_BASE_URL`
- `VITE_WFS_USERNAME`
- `VITE_WFS_PASSWORD`
- `VITE_DEFAULT_LAYER_NAME`

## Траблшутинг

Если слой не загружается или пусто на карте — смотрите подробные сообщения в консоли из `wmsService.ts` и `wfsService.ts` (URL, логин/пароль, доступность сервера, `.env`).
