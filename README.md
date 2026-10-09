# TradeStudy — Plataforma pessoal de estudos do mercado financeiro

Aplicação privada para organizar módulos e aulas, incorporar vídeos do YouTube, registrar anotações e resumos, acompanhar dúvidas e revisões e manter um diário de observações de gráficos.

## Funcionalidades incluídas

- Login privado por e-mail e senha, recuperação de senha e logout.
- Dashboard com métricas calculadas a partir dos dados reais.
- CRUD de módulos e aulas, com links do YouTube validados.
- Página de aula com vídeo incorporado, anotações livres, resumo, dúvidas e aplicação prática.
- Salvamento de anotações na nuvem via Supabase.
- Lista de dúvidas com status e resposta.
- Revisões agendadas e registro de revisão concluída.
- Diário de gráficos com WIN/WDO ou qualquer ativo, timeframe, POC, ajuste, máxima/mínima, zonas e contexto macro.
- Busca no caderno e exportação de estudos para JSON.
- Interface responsiva em modo escuro.

## Configuração

1. Abra o projeto no Lovable e conecte o Lovable Cloud/Supabase. O arquivo `.env` contém somente as variáveis de configuração pública do projeto; nunca coloque `service_role` ou segredos no frontend.
2. Confirme que a migração `drizzle/migrations/0000_migration.sql` foi aplicada ao banco conectado. Se o banco ainda não tiver as tabelas, execute o SQL pelo Supabase SQL Editor.
3. Execute também `drizzle/migrations/0001_integrity_and_private_chart_storage.sql` para validar as relações de propriedade e configurar o bucket privado de imagens de gráficos.
4. No painel Authentication, desative o cadastro público de usuários. Crie a conta do proprietário pelo painel do Supabase; a tela da aplicação não oferece cadastro.
5. Configure as URLs de redirecionamento de autenticação para os domínios locais e de produção, incluindo `/reset-password`.

## Desenvolvimento local

Requer Node.js compatível com Vite e npm.

```sh
npm install
npm run dev
```

Verificações disponíveis:

```sh
npm run test
npm run lint
npm run build
```

## Observações importantes

- As políticas RLS da migração principal isolam registros pelo `auth.uid()`; mantenha RLS habilitado.
- A aplicação não envia ordens, não fornece sinais de compra/venda e não substitui o estudo do usuário.
- Vídeos que o proprietário do canal não permite incorporar ainda precisarão ser abertos diretamente no YouTube.
