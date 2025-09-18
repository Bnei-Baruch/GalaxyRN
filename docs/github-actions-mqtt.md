# GitHub Actions MQTT Notification Setup

Этот документ описывает настройку GitHub Action для автоматической отправки MQTT уведомлений при push в ветку master с информацией о версиях мобильного приложения Galaxy.

## Обзор

GitHub Action `version-release.yml` автоматически отправляет уведомление в MQTT брокер при каждом push в ветку `master`, извлекая версии из всех платформ:

- Package.json версия
- Android версия и build код
- iOS версия и build номер

## Настройка

### 1. Создание секретов в GitHub

В настройках репозитория (Settings → Secrets and variables → Actions) создайте секрет:

#### Обязательный секрет:

- `MQTT_TOKEN` - Токен в формате: `url|username|password|topic`

**Пример значения:**

```
mqtt.example.com:8883|your-username|your-password|galaxy/releases/mobile
```

### 2. Структура MQTT сообщения

Action отправляет JSON сообщение следующей структуры:

```json
{
  "type": "version_release",
  "project": "galaxy-mobile",
  "timestamp": "2025-09-18T12:00:00.000Z",
  "versions": {
    "package": "1.0.57",
    "android": {
      "versionName": "1.0.57",
      "versionCode": 57
    },
    "ios": {
      "marketingVersion": "1.0.57",
      "currentProjectVersion": 57
    }
  }
}
```

## Использование

### Автоматический триггер

Action срабатывает автоматически при каждом push в ветку `master`.

### Пример workflow

1. Сделайте любые изменения в коде

2. Создайте коммит и отправьте в master:

   ```bash
   git add .
   git commit -m "Any commit message"
   git push
   ```

3. GitHub Action автоматически:
   - Извлечет версии из всех платформ
   - Отправит MQTT уведомление с версиями

## Логика работы

### Получение версий

При каждом push извлекаются версии из:

- `package.json` - основная версия проекта
- `android/app/build.gradle` - Android versionName и versionCode
- `ios/GalaxyRN.xcodeproj/project.pbxproj` - iOS MARKETING_VERSION и CURRENT_PROJECT_VERSION

### Отправка уведомления

Отправляется MQTT сообщение с версиями всех платформ при каждом push в master.

## Troubleshooting

### Action не срабатывает

- Проверьте что push происходит в ветку `master`
- Убедитесь что все файлы версий существуют и содержат корректные версии

### Ошибки MQTT подключения

- Проверьте правильность секрета `MQTT_TOKEN`
- Убедитесь что MQTT брокер доступен из GitHub Actions
- Проверьте что используется правильный протокол (WSS)
- Проверьте формат токена: `url|username|password|topic`

### Проверка логов

Логи выполнения можно найти в разделе "Actions" репозитория GitHub.

## Безопасность

- Все чувствительные данные хранятся как GitHub Secrets
- Подключение к MQTT использует защищенный протокол WSS
- Сообщения отправляются с QoS 1 для гарантии доставки

## Файлы

### `scripts/send-mqtt-notification.js`

Отдельный скрипт для отправки MQTT уведомлений. Может использоваться как из GitHub Actions, так и локально для тестирования:

```bash
# Использование .env файла (автоматически загружается)
# Создайте файл .env в корне проекта с переменными:
# MQTT_TOKEN=your_mqtt_token_here
# MQTT_URL=your_mqtt_url_here
node scripts/send-mqtt-notification.js "1.0.57" "1.0.57" "57" "1.0.57" "57"

# Альтернативно: переменные окружения
MQTT_TOKEN="your_mqtt_token_here" MQTT_URL="your_mqtt_url_here" \
node scripts/send-mqtt-notification.js "1.0.57" "1.0.57" "57" "1.0.57" "57"
```

### `.github/workflows/version-release.yml`

GitHub Action workflow, который автоматически извлекает версии всех платформ и вызывает скрипт при push в master.

## Интеграция с существующей MQTT инфраструктурой

Action использует ту же MQTT библиотеку (`mqtt`), что и основное приложение, обеспечивая совместимость с существующей инфраструктурой.

Топик по умолчанию `galaxy/releases/mobile` следует существующему паттерну именования топиков в проекте (`galaxy/users/...`, `galaxy/service/...`).
