# Bella Gatta — Catálogo virtual com pedidos pelo WhatsApp

## Visão geral
Catálogo responsivo (prioridade celular) de moda feminina, lingerie e maquiagens. A cliente escolhe cor/tamanho/tonalidade, monta o carrinho e o pedido abre no WhatsApp da loja com a mensagem pronta. Sem pagamento online, sem cadastro de clientes, sem estoque numérico. Duas administradoras gerenciam tudo por um painel protegido.

## Identidade visual
- Paleta: rosa suave #F4E7E4, nude #E8D8C8, off-white #FFFDF9, preto ameixa #292326.
- Tipografia: serifada elegante para títulos (Cormorant Garamond) + sans legível para textos (Karla).
- Logotipo provisório tipográfico "Bella Gatta"; logo e banner substituíveis pelo painel.
- Animações mínimas, botões grandes para toque, fotos em destaque.

## Mapa de páginas
```text
/                       Início (banner, categorias, novidades, destaques, Instagram, WhatsApp)
/categorias             Todas as categorias + catálogo completo com busca
/categoria/roupas       Roupas femininas
/categoria/lingerie     Lingerie
/categoria/maquiagens   Maquiagens
/produto/$slug          Detalhes: galeria, opções, quantidade, adicionar
/carrinho               Itens, quantidades, subtotais, total
/finalizar              Nome, telefone, observações, resumo, abrir WhatsApp
/admin/login            Login das administradoras (+ recuperar senha)
/admin                  Painel: produtos, categorias, configurações (protegido)
/admin/produtos/novo, /admin/produtos/$id, /admin/categorias, /admin/configuracoes
/redefinir-senha        Definir nova senha a partir do e-mail
```

## Etapas
1. **Planejamento** — este documento.
2. **Interface** — design system, todas as páginas públicas e o carrinho (guardado só no navegador). Produtos de demonstração marcados claramente como "Demonstração".
3. **Backend (Lovable Cloud)** — banco, login, armazenamento de fotos e regras de segurança.
4. **Administração** — CRUD completo de produtos, fotos, opções, categorias e configurações da loja, com confirmações e mensagens reais de sucesso/erro.
5. **WhatsApp** — mensagem formatada em português, número lido das configurações salvas, preços revalidados no momento de finalizar.
6. **Testes** — fluxo público e administrativo no celular e no computador, permissões e isolamento de dados.

## Estrutura de dados prevista
- `categories` — nome, slug, ordem.
- `products` — nome, slug, descrição, categoria, preço, preço promocional, disponível, destaque, novidade.
- `product_images` — produto, caminho da foto, ordem.
- `product_options` — produto, tipo (cor | tamanho | tonalidade), valor, ordem.
- `store_settings` — linha única: nome, logo, banner, Instagram, WhatsApp (formato internacional, só dígitos).
- `user_roles` — vínculo usuário → papel `admin` (tabela separada, verificada por função segura no banco).
- Armazenamento `product-images` e `store-assets`: leitura pública, escrita apenas admins.

Nada de clientes, pedidos ou carrinho é salvo no banco.

## Segurança
- RLS em todas as tabelas: visitantes só leem o catálogo e configurações públicas; escrita exige papel admin validado no banco.
- Cadastro público desativado; não existe tela de "criar conta".
- As duas contas são criadas por convite/e-mail no painel do Cloud, cada uma define a própria senha; depois recebem o papel admin. Nenhuma senha no código.
- Nenhuma chave privada no navegador.

## Configuração manual necessária (documentada ao final)
- Informar os e-mails das duas administradoras para convite e atribuição do papel admin.
- Enviar logotipo definitivo, banner e o número definitivo do WhatsApp (trocável pelo painel).
- Opcional: domínio próprio no futuro.

## Custos
Uso dentro dos planos gratuitos sempre que suficientes; nada pago será ativado sem autorização. Planos gratuitos têm limites de armazenamento/tráfego e não garantem custo zero permanente.

## Detalhes técnicos
- TanStack Start + Tailwind v4, tokens semânticos em `src/styles.css`.
- Carrinho: contexto React + localStorage; chave do item = produto + cor + tamanho + tonalidade.
- Leitura do catálogo com loaders + React Query; validação com zod nos formulários.
- Checkout reconsulta preços/disponibilidade atuais antes de montar `https://wa.me/<numero>?text=<encodeURIComponent>`.
- Função `has_role(uid, 'admin')` SECURITY DEFINER usada nas políticas de tabelas e storage.
- Rotas admin sob layout autenticado que confere o papel antes de renderizar.
