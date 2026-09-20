# GitHub Pages

1. В Settings → Pages → Build and deployment → Source выберите **GitHub Actions**.
2. Разрешите Actions и стандартные GitHub actions в настройках репозитория. При необходимости разрешите environment `github-pages` публикацию из `main`.
3. Добавьте Repository Variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Они публичны по назначению. Если их нет, публикация показывает demo и не принимает заказы.
4. Push в `main` или Actions → Validate and deploy GitHub Pages → Run workflow.
5. Workflow выполняет `npm ci`, lint, тесты и build, загружает только `dist`. Job deploy имеет минимальные права `pages:write` и `id-token:write`. PR проходят проверки, но не публикуются.
6. Откройте `https://zigger06.github.io/Incubator-market/` и прямую ссылку `https://zigger06.github.io/Incubator-market/#/catalog`; обновление страницы должно сохранять маршрут.

Vite `base=/Incubator-market/`, ссылки assets строятся через BASE_URL. HashRouter устраняет проблему 404 для вложенных экранов на Pages. Не используйте `/catalog` без `/#/` как прямой адрес — это другая серверная страница.

Для custom domain или другого имени репозитория измените Vite base/workflow, canonical, robots, Supabase Site URL и Edge Function ALLOWED_ORIGINS вместе. Контакты остаются настройками базы.

SEO: есть базовые title/description/Open Graph и canonical главной. Отдельные hash URL не включаются в sitemap, поскольку fragment не является отдельным индексируемым документом. Переход на SSG/SSR нужен для полноценных карточек в поиске и социальных превью отдельных товаров.

Откат: восстановите предыдущий исходный commit и снова запустите workflow. Миграции БД откатываются отдельно — Git revert не откатывает БД. Для следующих схем добавляйте новые migrations, не переписывайте применённую историю.
