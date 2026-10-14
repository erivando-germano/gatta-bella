
with p as (
  insert into public.products (name, slug, description, category_id, price, promo_price, featured, is_new, is_demo)
  values
   ('Vestido Envelope Nude (Demonstração)','demo-vestido-envelope','Produto de demonstração — não é um item real da loja. Vestido midi com amarração lateral.',(select id from public.categories where slug='roupas'),189.90,159.90,true,true,true),
   ('Conjunto Renda Noir (Demonstração)','demo-conjunto-renda','Produto de demonstração — não é um item real da loja. Conjunto de renda delicada.',(select id from public.categories where slug='lingerie'),129.90,null,true,true,true),
   ('Batom Rose Nude (Demonstração)','demo-batom-rose','Produto de demonstração — não é um item real da loja. Batom cremoso de longa duração.',(select id from public.categories where slug='maquiagens'),49.90,null,true,false,true)
  returning id, slug
)
insert into public.product_images (product_id, url, sort_order)
select id, case slug when 'demo-vestido-envelope' then '/demo/vestido.jpg' when 'demo-conjunto-renda' then '/demo/lingerie.jpg' else '/demo/batom.jpg' end, 0 from p;

insert into public.product_options (product_id, kind, value, sort_order)
select p.id, o.kind, o.value, o.ord from public.products p
join (values
  ('demo-vestido-envelope','color','Nude',1),('demo-vestido-envelope','color','Preto',2),
  ('demo-vestido-envelope','size','P',1),('demo-vestido-envelope','size','M',2),('demo-vestido-envelope','size','G',3),
  ('demo-conjunto-renda','color','Preto',1),('demo-conjunto-renda','size','P',1),('demo-conjunto-renda','size','M',2),('demo-conjunto-renda','size','G',3),
  ('demo-batom-rose','shade','Rose Nude',1),('demo-batom-rose','shade','Malva',2),('demo-batom-rose','shade','Terracota',3)
) as o(slug, kind, value, ord) on o.slug = p.slug;
