/**
 * Sentry Performance Monitoring - Transaction Keys
 *
 * Технические ключи для доступа к транзакциям из разных частей кода.
 * Используются для связывания spans с транзакциями.
 */

// Room session - весь flow от входа до выхода из комнаты
export const ROOM_SESSION = 'room-session';

// Login flow - процесс аутентификации пользователя
export const LOGIN_FLOW = 'login-flow';

// API request - отдельные API запросы
export const API_REQUEST = 'api-request';

// Video call - видеозвонок
export const VIDEO_CALL = 'video-call';

// MQTT connection - подключение к MQTT
export const CONNECTION = 'connection';
