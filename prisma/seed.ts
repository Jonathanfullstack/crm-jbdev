import {
  FollowUpType,
  PrismaClient,
  Priority,
  ProposalStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Seed ignorado: o banco já tem usuários.");
    return;
  }

  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.task.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.leadTag.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.product.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.source.deleteMany();
  await prisma.lostReason.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.session.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const passwordHash = await bcrypt.hash("Demo@1234", 12);

  const workspace = await prisma.workspace.create({
    data: {
      name: "NovaTech Comercial",
      slug: "novatech",
      phone: "1130004000",
      email: "contato@novatech.com",
      website: "https://novatech.com",
      logoUrl: "https://ui-avatars.com/api/?name=NovaTech&background=1D4ED8&color=fff&bold=true",
      primaryColor: "#1D4ED8",
      secondaryColor: "#DBEAFE",
      theme: "LIGHT",
      onboardingDone: true,
      showDeveloperCredit: true,
    },
  });

  const [admin, manager, seller1, seller2] = await Promise.all([
    prisma.user.create({
      data: {
        workspaceId: workspace.id,
        name: "Ana Admin",
        email: "admin@novatech.com",
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        workspaceId: workspace.id,
        name: "Gabriel Gestor",
        email: "gestor@novatech.com",
        passwordHash,
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        workspaceId: workspace.id,
        name: "Marina Vendas",
        email: "vendedor1@novatech.com",
        passwordHash,
        role: UserRole.SELLER,
      },
    }),
    prisma.user.create({
      data: {
        workspaceId: workspace.id,
        name: "Rafael Atendimento",
        email: "vendedor2@novatech.com",
        passwordHash,
        role: UserRole.SELLER,
      },
    }),
  ]);

  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId: workspace.id,
      name: "Funil comercial",
      isDefault: true,
    },
  });

  const stageDefs = [
    { name: "Novo lead", color: "#64748B", kind: "OPEN" as const },
    { name: "Contato iniciado", color: "#0EA5E9", kind: "OPEN" as const },
    { name: "Em atendimento", color: "#2563EB", kind: "OPEN" as const },
    { name: "Qualificado", color: "#7C3AED", kind: "OPEN" as const },
    { name: "Proposta enviada", color: "#D97706", kind: "OPEN" as const },
    { name: "Negociação", color: "#EA580C", kind: "OPEN" as const },
    { name: "Fechado", color: "#059669", kind: "WON" as const },
    { name: "Perdido", color: "#E11D48", kind: "LOST" as const },
  ];

  const stages = await Promise.all(
    stageDefs.map((stage, index) =>
      prisma.pipelineStage.create({
        data: {
          workspaceId: workspace.id,
          pipelineId: pipeline.id,
          name: stage.name,
          color: stage.color,
          kind: stage.kind,
          position: index,
        },
      }),
    ),
  );

  const sourceNames = [
    "WhatsApp",
    "Instagram",
    "Site",
    "Indicação",
    "Telefone",
    "Facebook",
    "Google",
    "Outro",
  ];
  const sources = await Promise.all(
    sourceNames.map((name) =>
      prisma.source.create({
        data: {
          workspaceId: workspace.id,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        },
      }),
    ),
  );

  const lostReasons = await Promise.all(
    ["Preço", "Sem interesse", "Escolheu concorrente", "Sem retorno", "Sem orçamento", "Timing", "Outro"].map(
      (name) => prisma.lostReason.create({ data: { workspaceId: workspace.id, name } }),
    ),
  );

  const tagDefs = [
    { name: "Cliente quente", color: "#DC2626" },
    { name: "VIP", color: "#7C3AED" },
    { name: "Retorno", color: "#2563EB" },
    { name: "Indicação", color: "#059669" },
    { name: "Empresa", color: "#0F172A" },
    { name: "Interessado", color: "#D97706" },
    { name: "Urgente", color: "#E11D48" },
  ];
  const tags = await Promise.all(
    tagDefs.map((tag) => prisma.tag.create({ data: { workspaceId: workspace.id, ...tag } })),
  );

  const companies = await Promise.all(
    [
      { legalName: "Horizon Serviços Ltda", tradeName: "Horizon", city: "São Paulo", state: "SP", segment: "Serviços" },
      { legalName: "Atlas Consultoria", tradeName: "Atlas", city: "Campinas", state: "SP", segment: "Consultoria" },
      { legalName: "Nimbus Educação", tradeName: "Nimbus", city: "Curitiba", state: "PR", segment: "Educação" },
      { legalName: "Pulse Fitness Group", tradeName: "Pulse", city: "Belo Horizonte", state: "MG", segment: "Saúde" },
    ].map((company) => prisma.company.create({ data: { workspaceId: workspace.id, ...company } })),
  );

  const products = await Promise.all(
    [
      { name: "Plano Essencial", category: "Assinatura", price: 890, description: "Implantação e operação mensal." },
      { name: "Plano Pro", category: "Assinatura", price: 1890, description: "Time comercial + automações." },
      { name: "Consultoria de processo", category: "Serviço", price: 4500, description: "Diagnóstico e playbook." },
    ].map((product) => prisma.product.create({ data: { workspaceId: workspace.id, ...product } })),
  );

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000);
  const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 3600000);

  const leadSeeds = [
    { first: "Carla", last: "Mendes", company: "Horizon", stage: 0, owner: seller1, value: 3200, source: 0, tags: [0, 6], city: "São Paulo" },
    { first: "Bruno", last: "Lopes", company: "Atlas", stage: 1, owner: seller2, value: 5400, source: 1, tags: [5], city: "Campinas" },
    { first: "Fernanda", last: "Dias", company: "Nimbus", stage: 2, owner: seller1, value: 8900, source: 2, tags: [1, 4], city: "Curitiba" },
    { first: "Igor", last: "Nascimento", company: "Pulse", stage: 3, owner: seller2, value: 2100, source: 3, tags: [3], city: "Belo Horizonte" },
    { first: "Patrícia", last: "Ramos", company: "Studio Norte", stage: 4, owner: seller1, value: 7600, source: 4, tags: [0], city: "Porto Alegre" },
    { first: "Diego", last: "Faria", company: "Casa & Obra", stage: 5, owner: manager, value: 12800, source: 5, tags: [1, 6], city: "Santos" },
    { first: "Helena", last: "Costa", company: "Verde Vida", stage: 6, owner: seller1, value: 4500, source: 6, tags: [1], city: "São Paulo", won: true },
    { first: "Otávio", last: "Pires", company: "Metta", stage: 7, owner: seller2, value: 3100, source: 7, tags: [2], city: "Recife", lost: 0 },
    { first: "Juliana", last: "Azevedo", company: "Orbit", stage: 0, owner: seller2, value: 1800, source: 0, tags: [5], city: "Fortaleza" },
    { first: "Marcelo", last: "Tavares", company: "Lumen", stage: 2, owner: seller1, value: 9700, source: 2, tags: [4, 0], city: "Brasília" },
    { first: "Sofia", last: "Martins", company: "Alta Vista", stage: 4, owner: manager, value: 15200, source: 3, tags: [1], city: "São Paulo" },
    { first: "Renato", last: "Barros", company: "Grupo Norte", stage: 6, owner: seller2, value: 6200, source: 1, tags: [3], city: "Manaus", won: true },
    { first: "Lívia", last: "Teixeira", company: "Casa Clara", stage: 1, owner: seller1, value: 2400, source: 4, tags: [2], city: "Vitória" },
    { first: "André", last: "Moraes", company: "Vector", stage: 5, owner: seller2, value: 18400, source: 6, tags: [0, 4], city: "Rio de Janeiro" },
    { first: "Camila", last: "Souza", company: "Bem Estar", stage: 3, owner: seller1, value: 3900, source: 0, tags: [5], city: "Florianópolis" },
    { first: "Eduardo", last: "Lima", company: "Prime Office", stage: 7, owner: manager, value: 5100, source: 2, tags: [2], city: "Goiânia", lost: 3 },
    { first: "Beatriz", last: "Cunha", company: "Nova Era", stage: 6, owner: seller1, value: 8700, source: 3, tags: [1], city: "São Paulo", won: true },
    { first: "Thiago", last: "Rezende", company: "Delta", stage: 2, owner: seller2, value: 4300, source: 5, tags: [6], city: "Belém" },
    { first: "Amanda", last: "Vieira", company: "Ponto Certo", stage: 0, owner: seller1, value: 1500, source: 1, tags: [5], city: "Natal" },
    { first: "Gustavo", last: "Ferraz", company: "Integra", stage: 4, owner: seller2, value: 11200, source: 2, tags: [4], city: "São Paulo" },
  ];

  const leads = [];
  for (let index = 0; index < leadSeeds.length; index += 1) {
    const seed = leadSeeds[index];
    const createdAt = daysAgo(18 - index);
    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        firstName: seed.first,
        lastName: seed.last,
        companyName: seed.company,
        companyId: companies[index % companies.length]?.id,
        phone: `1199${String(1000000 + index).slice(0, 7)}`,
        whatsapp: `1199${String(1000000 + index).slice(0, 7)}`,
        email: `${seed.first.toLowerCase()}.${seed.last.toLowerCase()}@email.com`,
        jobTitle: "Decisor",
        city: seed.city,
        state: "BR",
        sourceId: sources[seed.source].id,
        stageId: stages[seed.stage].id,
        ownerId: seed.owner.id,
        estimatedValue: seed.value,
        probability: 20 + seed.stage * 10,
        interest: products[index % products.length].name,
        kind: seed.won ? "CLIENT" : "LEAD",
        convertedAt: seed.won ? daysAgo(3) : null,
        lostReasonId: seed.lost !== undefined ? lostReasons[seed.lost].id : null,
        lastContactAt: daysAgo(index % 5),
        nextFollowUpAt: seed.won || seed.lost !== undefined ? null : hoursFromNow(index % 2 === 0 ? -6 : 18),
        createdAt,
        tags: {
          create: seed.tags.map((tagIndex) => ({ tagId: tags[tagIndex].id })),
        },
      },
    });
    leads.push(lead);

    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        actorId: seed.owner.id,
        type: "LEAD_CREATED",
        title: "Lead criado",
        createdAt,
      },
    });

    await prisma.note.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        authorId: seed.owner.id,
        content: `Primeiro contato com ${seed.first}. Interesse no ${products[index % products.length].name}.`,
      },
    });

    if (!seed.won && seed.lost === undefined) {
      await prisma.followUp.create({
        data: {
          workspaceId: workspace.id,
          leadId: lead.id,
          ownerId: seed.owner.id,
          type: [FollowUpType.WHATSAPP, FollowUpType.CALL, FollowUpType.MEETING][index % 3],
          description: "Retomar conversa e confirmar próxima etapa.",
          dueAt: hoursFromNow(index % 2 === 0 ? -6 : 18),
          priority: index % 3 === 0 ? Priority.HIGH : Priority.MEDIUM,
        },
      });
    }

    if (index % 2 === 0) {
      await prisma.task.create({
        data: {
          workspaceId: workspace.id,
          title: `Preparar proposta para ${seed.first}`,
          description: "Revisar escopo e enviar valores.",
          ownerId: seed.owner.id,
          leadId: lead.id,
          dueAt: hoursFromNow(24),
          priority: Priority.MEDIUM,
          status: index % 4 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING,
        },
      });
    }

    if (seed.stage >= 4) {
      await prisma.proposal.create({
        data: {
          workspaceId: workspace.id,
          leadId: lead.id,
          title: `Proposta ${products[index % products.length].name}`,
          value: seed.value,
          description: "Proposta comercial com condições padrão de implantação e mensalidade.",
          items: [
            {
              name: products[index % products.length].name,
              quantity: 1,
              unitPrice: seed.value,
            },
          ],
          sentAt: daysAgo(2),
          validUntil: hoursFromNow(240),
          status: seed.won ? ProposalStatus.ACCEPTED : ProposalStatus.SENT,
        },
      });
    }

    await prisma.opportunity.create({
      data: {
        workspaceId: workspace.id,
        title: `${products[index % products.length].name} · ${seed.company}`,
        leadId: lead.id,
        productId: products[index % products.length].id,
        value: seed.value,
        stageId: stages[seed.stage].id,
        probability: 20 + seed.stage * 10,
        ownerId: seed.owner.id,
        expectedClose: hoursFromNow(120),
        status: seed.won ? "WON" : seed.lost !== undefined ? "LOST" : "OPEN",
        closedAt: seed.won || seed.lost !== undefined ? daysAgo(2) : null,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: seller1.id,
        type: "FOLLOW_UP_OVERDUE",
        title: "Follow-up atrasado",
        body: "Há conversas sem retorno.",
        link: "/follow-ups",
      },
      {
        workspaceId: workspace.id,
        userId: seller2.id,
        type: "NEW_LEAD",
        title: "Novo lead recebido",
        body: "Um novo contato entrou pelo site.",
        link: "/leads",
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        type: "TASK_DUE",
        title: "Tarefa vencendo",
        body: "Revise as propostas em aberto.",
        link: "/tasks",
      },
    ],
  });

  const atlas = await prisma.workspace.create({
    data: {
      name: "Atlas Serviços",
      slug: "atlas",
      phone: "1140005000",
      email: "contato@atlas.com",
      website: "https://atlas.com",
      logoUrl: "https://ui-avatars.com/api/?name=Atlas&background=0F766E&color=fff&bold=true",
      primaryColor: "#0F766E",
      secondaryColor: "#CCFBF1",
      theme: "DARK",
      onboardingDone: true,
      showDeveloperCredit: true,
    },
  });

  const atlasAdmin = await prisma.user.create({
    data: {
      workspaceId: atlas.id,
      name: "Clara Admin",
      email: "admin@atlas.com",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  const atlasSeller = await prisma.user.create({
    data: {
      workspaceId: atlas.id,
      name: "Pedro Vendas",
      email: "vendedor@atlas.com",
      passwordHash,
      role: UserRole.SELLER,
    },
  });

  const atlasPipeline = await prisma.pipeline.create({
    data: { workspaceId: atlas.id, name: "Funil comercial", isDefault: true },
  });
  const atlasStages = await Promise.all(
    stageDefs.map((stage, index) =>
      prisma.pipelineStage.create({
        data: {
          workspaceId: atlas.id,
          pipelineId: atlasPipeline.id,
          name: stage.name,
          color: stage.color,
          kind: stage.kind,
          position: index,
        },
      }),
    ),
  );
  const atlasSource = await prisma.source.create({
    data: { workspaceId: atlas.id, name: "Site", slug: "site" },
  });

  await prisma.lead.createMany({
    data: [
      {
        workspaceId: atlas.id,
        firstName: "Rita",
        lastName: "Alves",
        companyName: "Casa Clara",
        email: "rita.alves@atlas-demo.com",
        stageId: atlasStages[0].id,
        ownerId: atlasSeller.id,
        sourceId: atlasSource.id,
        estimatedValue: 2800,
      },
      {
        workspaceId: atlas.id,
        firstName: "Paulo",
        lastName: "Nunes",
        companyName: "Norte Sul",
        email: "paulo.nunes@atlas-demo.com",
        stageId: atlasStages[4].id,
        ownerId: atlasAdmin.id,
        sourceId: atlasSource.id,
        estimatedValue: 9100,
      },
      {
        workspaceId: atlas.id,
        firstName: "Elisa",
        lastName: "Prado",
        companyName: "Prado & Cia",
        email: "elisa.prado@atlas-demo.com",
        stageId: atlasStages[6].id,
        ownerId: atlasAdmin.id,
        sourceId: atlasSource.id,
        estimatedValue: 6400,
        kind: "CLIENT",
        convertedAt: daysAgo(2),
      },
    ],
  });

  console.log("Seed concluído. Workspaces de demonstração:");
  console.log("  NovaTech Comercial  /login?w=novatech  admin@novatech.com / Demo@1234");
  console.log("  Atlas Serviços      /login?w=atlas     admin@atlas.com / Demo@1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
