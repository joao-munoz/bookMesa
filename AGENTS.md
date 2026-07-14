# DeskBooking - Scripts e Convenções

## Server (porta 3001)

```bash
cd server
npm run dev          # Iniciar servidor em dev
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Abrir Prisma Studio (interface gráfica do banco)
npm run db:push      # Sincronizar schema Prisma com o banco
```

## Client (porta 5173)

```bash
cd client
npm run dev          # Iniciar frontend em dev
npm run build        # Build de produção
```

## Credenciais de teste

| Papel  | Email                    | Senha  |
|--------|--------------------------|--------|
| Admin  | admin@escritorio.com     | 123456 |
| User   | ana@escritorio.com       | 123456 |
| User   | bruno@escritorio.com     | 123456 |
| User   | carla@escritorio.com     | 123456 |
| User   | daniel@escritorio.com    | 123456 |

## Estrutura

```
DeskBooking/
  server/         Express + TypeScript + Prisma + SQLite
  client/         React + Vite + TypeScript + TailwindCSS
```

## Como posicionar as mesas no mapa

**Método visual (recomendado):** Admin > Editar Mapa
- Arraste as mesas diretamente no SVG
- Snap to grid (10px) ativado por padrão
- Clique "confirmar" para salvar todas as alterações
- Funciona em desktop e mobile (touch)

**Método manual:** Admin > Gerenciar Mesas
- Ajuste os valores X (horizontal) e Y (vertical) manualmente

## Convenções

- Tipagem estrita no backend (Zod para validação de entrada)
- React Query para estado do servidor no frontend
- shadcn/ui patterns para componentes (Button, Card, Modal, Input, Badge)
- Cores dinâmicas via CSS variables (`--color-*`) — configuráveis pelo admin
- Rotas protegidas: `ProtectedRoute` (qualquer user logado) e `AdminRoute` (role ADMIN)
