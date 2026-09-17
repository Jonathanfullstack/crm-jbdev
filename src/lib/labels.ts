export const roleLabel = {
  ADMIN: "Admin",
  MANAGER: "Gestor",
  SELLER: "Vendedor",
} as const;

export const priorityLabel = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;

export const taskStatusLabel = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
} as const;

export const followUpTypeLabel = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  MEETING: "Reunião",
  RETURN: "Retorno",
  TASK: "Tarefa",
  OTHER: "Outro",
} as const;

export const proposalStatusLabel = {
  DRAFT: "Rascunho",
  SENT: "Enviada",
  VIEWED: "Visualizada",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
} as const;

export const activityTypeLabel = {
  LEAD_CREATED: "Lead criado",
  STAGE_CHANGED: "Etapa alterada",
  OWNER_CHANGED: "Responsável alterado",
  VALUE_CHANGED: "Valor alterado",
  NOTE: "Observação",
  TASK: "Tarefa",
  FOLLOW_UP: "Follow-up",
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  MEETING: "Reunião",
  MESSAGE: "Mensagem",
  PROPOSAL: "Proposta",
  CONVERTED: "Convertido em cliente",
} as const;
