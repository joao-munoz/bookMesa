# Proposta Comercial — BookMesa

**Para:** Simões Ribeiro Bernardini e Furiati Advogados
**De:** BookMesa
**Data:** Julho/2026

---

## 1. Apresentação

A BookMesa é uma plataforma web completa para gestão de reservas de estações de trabalho, lockers e salas de reunião em escritórios corporativos. Desenvolvida sob medida para escritórios de advocacia e empresas que precisam otimizar o uso do espaço físico, a BookMesa elimina planilhas, conflitos de agenda e reservas fantasmas.

---

## 2. O Produto

Sistema 100% web, responsivo (funciona em desktop, tablet e celular), hospedado em servidor seguro com SSL. Acesso via navegador — sem instalação de software.

### 2.1 Mapa Interativo de Mesas

- Visualização gráfica do escritório com todas as mesas posicionadas
- Cores indicam status: verde (sua reserva), vermelho (ocupado), cinza (livre)
- Diferenciação visual entre mesas comuns e baias de vidro
- Ao passar o mouse: nome do ocupante aparece como tooltip
- Visão desktop (grid 12 colunas) e mobile (adaptado)

### 2.2 Sistema de Reservas por Horário

- Reserva em qualquer horário entre 06:00 e 22:00
- Duração mínima de 15 minutos
- Verificação automática de conflitos (mesmo usuário não pode ter duas reservas no mesmo horário)
- Validação de mesas e lockers já ocupados

### 2.3 Check-in e Check-out

- **Check-in manual:** janela de ±30 minutos do horário inicial; após 30 min sem check-in a reserva é automaticamente liberada
- **Check-out manual:** ao sair, o usuário faz check-out liberando o recurso
- Barra persistente no topo avisa quando há reserva pendente a menos de 1 hora
- Disponível em todas as páginas (mapa, lockers, salas, minhas reservas)

### 2.4 Lockers (20 unidades)

- Grade visual com 20 lockers (L01–L20)
- Reserva por horário com check-in e check-out
- Cores: verde (seu locker), vermelho (ocupado), branco (disponível)
- Nome do ocupante exibido em lockers ocupados

### 2.5 Salas de Reunião (3 salas)

- Timeline vertical 06:00–22:00 com colunas paralelas (Sala 1, Sala 2, Sala 3)
- Blocos de reserva clicáveis para check-in, check-out e cancelamento
- Botão flutuante "+" para criar nova reserva com seletor de sala
- Visão clara de horários ocupados e disponíveis

### 2.6 Central do Usuário

- **Minhas Reservas:** todas as reservas do usuário em um só lugar
- Visualização mensal (calendário) e semanal
- Dias com reserva destacados em verde
- Ações rápidas: check-in, check-out, cancelar

### 2.7 Painel Administrativo

- **Gerenciar Mesas:** cadastro, edição, ativação/desativação e posicionamento no mapa
- **Gerenciar Salas:** editar nome, ativar/desativar, excluir
- **Usuários:** listar e alterar permissões (admin/user)
- **Todas as Reservas:** tabela completa com data, horário, usuário e status; admin pode fazer check-out e cancelar qualquer reserva
- **Personalização:** cores, logo e nome do app configuráveis
- **Log de Auditoria:** histórico de ações (criação, check-in, check-out, cancelamento)

### 2.8 Segurança

- Login com senha criptografada (bcrypt)
- Autenticação por JWT com cookie httpOnly
- Proteção de rotas (usuário comum vs. administrador)
- Rate limit no login (proteção contra força bruta)
- Validação de dados em todas as entradas (Zod)
- Headers de segurança (Helmet)

---

## 3. Benefícios para o Escritório

| Problema | Solução BookMesa |
|---|---|
| Funcionários chegam e não têm onde sentar | Mapa mostra mesas disponíveis em tempo real |
| Reservas não cumpridas bloqueiam espaços | Auto-release libera após 30 min sem check-in |
| Conflito de horário na sala de reunião | Sistema impede reservas sobrepostas |
| Planilhas desatualizadas e confusas | Tudo online, atualizado em tempo real |
| Lockers ocupados por dias sem uso | Check-in/check-out obrigatório por horário |
| Administrador sem visão do todo | Painel completo com log de auditoria |

---

## 4. Modelo de Contratação

### 4.1 Setup (implantação)

Inclui:
- Instalação e configuração do sistema em servidor dedicado (VPS)
- Migração de dados iniciais (cadastro de usuários)
- Configuração do mapa com planta baixa do escritório
- Personalização visual (cores, logo, nome do sistema)
- SSL e domínio próprio (ex: app.escritorio.com.br)
- Treinamento da equipe (2h online)
- Suporte durante os primeiros 30 dias

**Valor: R$ X.XXX,00** (pagamento único)

### 4.2 Manutenção Mensal

Inclui:
- Hospedagem em VPS com backup automático
- Manutenção corretiva (bugs e ajustes)
- Suporte técnico por email/WhatsApp (dias úteis, 9h–18h)
- Atualizações de segurança
- Relatório mensal de uso (totais, ocupação, horários de pico)
- Backup automático do banco de dados

**Valor: R$ XXX,00/mês**

### 4.3 Benefícios da manutenção

- Sem preocupação com servidor ou atualizações
- Prioridade em novas funcionalidades
- Descontos em projetos futuros

---

## 5. Cronograma

| Etapa | Prazo |
|---|---|
| Assinatura do contrato | D+0 |
| Configuração do servidor e domínio | D+2 |
| Personalização e cadastro inicial | D+5 |
| Upload da planta baixa | D+7 |
| Treinamento da equipe | D+8 |
| Entrega oficial (go-live) | D+10 |
| Suporte intensivo | D+10 a D+40 |
| Manutenção mensal | A partir de D+40 |

---

## 6. Investimento Resumo

| Item | Valor |
|---|---|
| Setup (implantação) | R$ X.XXX,00 |
| Manutenção mensal | R$ XXX,00/mês |
| **Total primeiro mês** | **R$ X.XXX,00** |

---

## 7. Próximos Passos

1. Agendar reunião técnica de 30 min para tirar dúvidas
2. Ajustar proposta conforme necessidades específicas
3. Assinar contrato digital
4. Iniciar implantação em até 48h

---

**BookMesa** — booking made simple
Contato: [seu email] | [seu telefone]
