-- Real installations start with categories only; no fictional offers are published.
insert into public.categories(id,slug,name) values
('10000000-0000-4000-8000-000000000001','home','{"tj":"Барои хона","ru":"Для дома"}'),
('10000000-0000-4000-8000-000000000002','farm','{"tj":"Барои хоҷагӣ","ru":"Для хозяйства"}'),
('10000000-0000-4000-8000-000000000003','professional','{"tj":"Касбӣ","ru":"Профессиональные"}') on conflict(id) do nothing;
-- Optional draft sample: fill in verified price, stock and photos before publishing.
insert into public.products(id,slug,name,description,category_id,price_minor,capacity,stock,published) values
('20000000-0000-4000-8000-000000000001','incubator-30','{"tj":"Инкубатор 30","ru":"Инкубатор 30"}','{"tj":"Лоиҳа: маълумоти воқеиро ворид кунед.","ru":"Черновик: внесите реальные данные."}','10000000-0000-4000-8000-000000000001',0,30,0,false) on conflict(id) do nothing;
