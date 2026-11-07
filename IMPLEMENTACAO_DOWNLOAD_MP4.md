# Implementação: download de aulas em MP4

## O que foi alterado

- `src/components/VideoDownload.tsx`: componente React reutilizável com download, progresso, cancelamento e mensagens de erro.
- `src/lib/video-download.ts`: validação de URL HTTPS fora do YouTube e geração de nome de arquivo seguro.
- `src/lib/video-download.test.ts`: testes unitários para validação e nome de arquivo.
- `src/routes/_authenticated/lessons.$lessonId.tsx`: integração do botão na página da aula, mantendo o player original do YouTube.
- `src/components/forms.tsx`: campos para cadastrar a URL externa do MP4 e confirmar autorização.
- `src/integrations/supabase/types.ts`: atualização dos tipos da tabela `lessons`.
- `supabase/migrations/20261107164200_add_lesson_mp4_download_source.sql`: inclusão dos campos de metadados na tabela.

## Aplicar no Supabase

Execute a migration pelo fluxo de migrations do Supabase ou copie o SQL abaixo no SQL Editor do projeto:

```sql
alter table public.lessons
  add column if not exists download_url text,
  add column if not exists download_authorized boolean not null default false;

comment on column public.lessons.download_url is
  'HTTPS URL of an externally hosted MP4 file whose download is permitted.';
comment on column public.lessons.download_authorized is
  'Explicit authorization confirmation for offering the external MP4 download.';
```

Os campos armazenam somente o endereço externo e a confirmação de autorização. O arquivo de vídeo não é enviado ao Supabase, ao banco ou ao servidor do TradeStudy.

## Como cadastrar uma aula com download

1. Abra a aula e escolha **Editar aula**.
2. Mantenha o link do YouTube no campo original para reprodução online.
3. No campo **Link direto do arquivo MP4**, informe a URL HTTPS do arquivo disponibilizado pelo criador ou por uma fonte que permita expressamente o download.
4. Marque a confirmação de autorização.
5. Salve a aula.

Sem URL MP4 e sem autorização marcada, o botão permanece desabilitado e informa o motivo.

## Requisitos da fonte MP4

- Deve ser uma URL HTTPS direta, fora do YouTube.
- O servidor da fonte precisa permitir requisições do navegador por CORS.
- O conteúdo deve ser servido como `video/mp4` ou conter assinatura ISO-BMFF MP4 (`ftyp`/`styp`).
- Para exibir percentual, a fonte deve enviar `Content-Length`. Sem esse cabeçalho, a interface exibe os bytes recebidos, sem inventar percentual.

A confirmação no formulário é uma declaração do responsável pelo cadastro; ela não verifica automaticamente direitos autorais ou a licença do arquivo. O responsável deve conferir a autorização antes de marcar a opção.

## Limitação técnica importante

Para exibir progresso e permitir cancelamento usando apenas o navegador, o componente lê o arquivo em fluxo e monta um `Blob` antes de iniciar o salvamento. Isso não armazena o vídeo no servidor, mas utiliza memória do computador do aluno. Arquivos muito grandes podem consumir bastante RAM. A fonte precisa permitir CORS; caso contrário, o navegador bloqueará a leitura e o componente mostrará um erro.

O download não extrai nem converte streams do player do YouTube. O player original permanece inalterado.
