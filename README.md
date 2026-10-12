# Lumina Energy

MVP demonstravel para acompanhar geracao e consumo simulados e negociar creditos de energia entre contas. O frontend usa Vue 3, Pinia, TypeScript e Tailwind; autenticacao, persistencia e regras transacionais usam Supabase.

> Leituras, creditos e valores financeiros deste MVP sao simulados. O projeto nao integra medidores certificados, distribuidoras ou pagamentos reais.

## Demonstracao sem backend

O GitHub Pages funciona mesmo sem Supabase configurado. Na tela de acesso, escolha **Explorar demonstracao local**. Esse modo permite:

- navegar pelo dashboard e historico;
- comprar ofertas iniciais;
- publicar e cancelar ofertas;
- adicionar dispositivos;
- registrar leituras simuladas;
- exportar o extrato.

Os dados ficam no `localStorage` do navegador. Eles nao sao compartilhados entre dispositivos ou visitantes e nao demonstram a operacao multiusuario/atomica do Supabase.

## Requisitos

- Node.js 22.12 ou superior
- npm
- Um projeto Supabase

## Configuracao

1. Instale as dependencias:

   ```bash
   npm ci
   ```

2. Copie `.env.example` para `.env.local` e informe a URL e a chave publica do projeto Supabase.

3. Aplique `supabase/migrations/202610120001_initial_mvp.sql` pelo SQL Editor do Supabase ou com a Supabase CLI:

   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```

4. Em Authentication > URL Configuration, cadastre a URL local e a URL publicada. Para desenvolvimento, use `http://localhost:5173`.

5. Inicie o frontend:

   ```bash
   npm run dev
   ```

Por padrao, o Supabase pode exigir confirmacao de email. Para uma demonstracao imediata, desative essa exigencia temporariamente no projeto de desenvolvimento ou confirme as contas criadas.

## Roteiro de demonstracao

1. Crie duas contas com emails diferentes.
2. Na primeira conta, adicione um dispositivo gerador.
3. Registre uma leitura simulada para gerar saldo.
4. Publique parte do saldo no mercado.
5. Entre com a segunda conta e compre a oferta.
6. Confira os lancamentos de entrada e saida nos historicos das duas contas.

A publicacao reserva o saldo. Compra, debito do vendedor, credito do comprador e encerramento da oferta acontecem na mesma transacao SQL.

## Comandos

```bash
npm run dev         # servidor local
npm run lint        # analise estatica
npm run type-check  # verificacao TypeScript
npm test            # testes unitarios
npm run build       # build de producao
```

## Seguranca do MVP

- Todas as tabelas possuem Row Level Security.
- O navegador usa apenas a chave publica do Supabase.
- Ledger, pedidos e ofertas nao aceitam escrita direta do cliente.
- Criacao, cancelamento e compra de ofertas usam RPCs transacionais.
- O ledger rejeita alteracao e exclusao de lancamentos.
- Leituras simuladas validam a propriedade do dispositivo.

Nunca exponha a chave `service_role` no frontend ou em variaveis `VITE_*`.

## Deploy

O workflow `.github/workflows/deploy-pages.yml` valida lint, testes e build antes de publicar no GitHub Pages. Sem secrets, a pagina oferece apenas a demonstracao local. Para habilitar contas e persistencia compartilhada, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Limites conhecidos

- Compra apenas da oferta completa.
- Historico ainda nao possui paginacao; contas com grande volume exigirao consulta agregada e carregamento incremental.
- Sem pagamento, conciliacao financeira ou estorno.
- Sem integracao com hardware ou certificacao de origem.
- O horario diario usa o fuso do navegador; um produto real deve fixar o fuso da instalacao.
