# Подключение Supabase с нуля

## 1. Схема

Создайте проект в Supabase Dashboard. В SQL Editor выполните все файлы из `supabase/migrations/` по порядку имени, затем `supabase/seed.sql`. Миграция рассчитана на новую схему; на существующей базе предварительно сравните конфликтующие имена таблиц. Seed идемпотентен и создаёт категории и один **неопубликованный** черновик, без вымышленных продажных предложений.

Альтернатива через установленный Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Seed после `db push` выполните отдельно через SQL Editor. Локальное `supabase db reset` применяет migrations и seed к локальной базе.

### Обновление уже созданной базы

Если `202609200001_store.sql` уже выполнен, повторять его и seed не нужно. Выполните **только** `supabase/migrations/202609200002_contact_preferences.sql`, затем заново разверните функцию `contact` (раздел 6). Миграция добавляет выбранный канал и Telegram username; существующие обращения остаются телефонными. Новую функцию разворачивайте после миграции. Старый frontend и старая функция совместимы с новой схемой.

## 2. Auth

В Authentication → Providers → Phone включите provider и регистрацию. Для простого сценария phone + password отключите **Confirm phone**; не подменяйте телефон фиктивным email. Установите minimum password length = 8. Настройте Site URL:

`https://zigger06.github.io/Incubator-market/`

Если оставляете подтверждение включённым, настройте SMS provider. В приложении после signUp без session появляется OTP поле. Для отправки могут требоваться оплачиваемые внешние услуги — приложение их не подключает автоматически.

Без подтверждения номер не доказывает владение SIM: используйте его как идентификатор аккаунта. Не передавайте контроль над аккаунтом только на основании названного телефона. Восстановление пароля, OTP resend и MFA не реализованы в MVP; перед широким запуском продумайте подтверждённое восстановление.

Официальная документация: https://supabase.com/docs/guides/auth/passwords

## 3. Публичные переменные

Project settings/API → Project URL и publishable key (или legacy `anon`). Для локальной работы скопируйте `.env.example` в `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_BASE_PATH=/Incubator-market/
```

Для сайта добавьте эти первые две переменные в GitHub Settings → Secrets and variables → Actions → **Variables**. Workflow намеренно читает только эти публичные значения. Перезапустите deployment после изменения. `.env.local` никогда не коммитится.

## 4. Первый администратор

Зарегистрируйте владельца через сайт. Найдите UUID пользователя в Auth → Users. Выполните в SQL Editor:

```sql
insert into private.admins(user_id)
values ('UUID_СУЩЕСТВУЮЩЕГО_ПОЛЬЗОВАТЕЛЯ')
on conflict do nothing;
```

Перезагрузите сайт и откройте `#/admin`. Права нельзя назначить через редактирование профиля. Список пользователей показывает только profiles, не Auth credentials. Роль снимается только владельцем БД:

```sql
delete from private.admins where user_id = 'UUID';
```

Заполните Settings: название, телефон `+992XXXXXXXXX`, WhatsApp `992XXXXXXXXX`, Telegram username без URL, адрес, часы, тексты. Виджет связи виден всегда. До задания корректных значений WhatsApp и Telegram отображаются как недоступные; выдуманные номера не используются.

## 5. Storage

Миграция создаёт публичный bucket `product-images`, лимит 5 MB на файл, только JPEG/PNG/WebP. Загружать/удалять/обновлять могут лишь администраторы. В админке сначала сохраните товар, затем раскройте «Изображения» и загрузите фотографии. Ссылка хранится в `product_images`, файл — в Storage, без base64 в базе.

Bucket публичный: не загружайте туда документы клиентов или непубличные материалы. Фотографии черновиков тоже доступны по прямому URL. Перед физическим удалением товара удалите ненужные фото через управление изображениями: PostgreSQL cascade не удаляет Storage object автоматически.

## 6. Contact Edge Function

```bash
supabase functions deploy contact --no-verify-jwt
supabase secrets set ALLOWED_ORIGINS=https://zigger06.github.io
supabase secrets set CONTACT_RATE_SALT=YOUR_RANDOM_LONG_SECRET
```

Создайте salt локально, например `openssl rand -hex 32`, и передайте как server-side secret. При нескольких доверенных origins перечислите их через запятую. Origin **не содержит** `/Incubator-market/`. Для local dev добавьте только используемый origin, например `http://localhost:5173`.

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` предоставляются Supabase Edge runtime; они используются только внутри function, не в frontend. Функция публичная, поэтому JWT verification отключён намеренно. Она проверяет origin, размер/формат тела, honeypot; база ограничивает 5 сообщений на IP-хеш в час и 100 в час суммарно. Солёный hash IP живёт в закрытой схеме, старые записи удаляются при запросах. Global quota остаётся защитой при изменяемом/spoofed proxy header; перед ростом трафика добавить CAPTCHA и более строгий edge-level rate limiter.

## 7. Проверка с подключённым проектом

1. В двух разных браузерных сессиях создать пользователей A/B. Убедиться, что пароль не появляется в localStorage как поле пользователя.
2. Владелец публикует товар, задаёт цену/остаток и фото; анонимный посетитель видит его.
3. A оформляет заказ, видит номер и историю. B не видит заказ A, в том числе через Data API.
4. Повторный вызов RPC с тем же request UUID не создаёт дубль. Подмена итога/количества отклоняется, остаток не уходит в минус.
5. A открывает `/admin` и получает отказ; прямые записи товаров/ролей также отвергаются.
6. Администратор меняет статус заказа; отмена возвращает остаток один раз.
7. Контактная форма успешно сохраняет сообщение; оно доступно только администратору. Шестая заявка с одного hash в течение часа отклоняется.
8. Проверить signUp, login/logout, OTP если включён, реальную загрузку и удаление Storage images.

Эти live-проверки требуют вашего проекта. Локальные автоматические тесты не являются проверкой внешнего SMS provider или рабочего Supabase deployment.
