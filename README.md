# NestJS PostgreSQL API

API пользователей на NestJS 11, TypeORM и PostgreSQL 17.

## Требования

- Node.js 24.11.0
- npm
- Docker Desktop

## Первый запуск

```bash
git clone https://github.com/AlexNaranovich/nestjs-postgres.git
cd nestjs-postgres
npm ci
cp .env.example .env
docker compose up -d --wait
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
npm run start:dev
```

Swagger: http://localhost:3000/docs

## API

| Метод | Путь | Действие |
|---|---|---|
| POST | /users | Создание пользователя |
| GET | /users | Список, поиск и пагинация |
| GET | /users/:id | Получение пользователя |
| PATCH | /users/:id | Обновление пользователя |
| DELETE | /users/:id | Удаление пользователя |

Пример поиска:

```text
GET /users?page=1&limit=10&search=alex
```

## Подготовка тестовой базы

После первого запуска PostgreSQL создай отдельную базу:

```bash
docker compose exec postgres createdb -U app app_test
DB_DATABASE=app_test npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

Если база app_test уже существует, повторно создавать её не нужно.

## Проверки

PostgreSQL должна быть запущена, а миграции применены к обеим базам.

```bash
npm test
npm run test:e2e
npm run build
```

Тест users-db.e2e-spec.ts использует app_test.
Стандартный app.e2e-spec.ts подключается к базе из настроек окружения.

GitHub Actions автоматически запускает миграции, тесты и сборку.

## Миграции

После изменения сущностей создай миграцию:

```bash
npx typeorm-ts-node-commonjs migration:generate src/migrations/DescribeChange -d src/data-source.ts
```

Примени её к базе разработки:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

И к тестовой базе:

```bash
DB_DATABASE=app_test npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

## Остановка

Сервер NestJS: Ctrl+C в его терминале.

PostgreSQL:

```bash
docker compose stop
```

Данные сохраняются в Docker volume.

## Настройки окружения

.env.example содержит пример настроек.
Локальный .env исключён из Git.
Пароль в compose.yaml предназначен для локальной разработки.