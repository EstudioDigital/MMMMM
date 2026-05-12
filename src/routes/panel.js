// Rutas del panel web — CRUD para accounts, products, appointments, rules, clients y modules

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function panelRoutes(fastify) {
  // ── Accounts ──────────────────────────────────────────────────────────────
  fastify.get('/api/accounts', async () =>
    prisma.account.findMany({
      select: { id: true, name: true, phoneNumberId: true, ownerPhone: true, industry: true, tone: true, plan: true, businessInfo: true, faq: true },
    }),
  );

  fastify.get('/api/accounts/:id', async (req) =>
    prisma.account.findUniqueOrThrow({ where: { id: req.params.id } }),
  );

  fastify.put('/api/accounts/:id', async (req) => {
    const { name, industry, tone, businessInfo, faq, ownerPhone } = req.body;
    return prisma.account.update({
      where: { id: req.params.id },
      data: { name, industry, tone, businessInfo, faq, ownerPhone },
    });
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/stats', async (req) => {
    const accountId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [mensajesToday, clientesNuevos, turnosHoy, ventasHoy] = await Promise.all([
      prisma.message.count({ where: { accountId, createdAt: { gte: today } } }),
      prisma.client.count({ where: { accountId, createdAt: { gte: today } } }),
      prisma.appointment.count({
        where: { accountId, datetime: { gte: today, lt: tomorrow }, status: 'confirmed' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { accountId, type: 'income', createdAt: { gte: today } },
      }),
    ]);

    return {
      mensajesToday,
      clientesNuevos,
      turnosHoy,
      ventasHoy: ventasHoy._sum.amount ?? 0,
    };
  });

  // ── Messages (conversations grouped by client) ────────────────────────────
  fastify.get('/api/accounts/:id/messages', async (req) => {
    const accountId = req.params.id;
    const clients = await prisma.client.findMany({
      where: { accountId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { lastContact: 'desc' },
      take: 50,
    });
    return clients.map((c) => ({
      client: { id: c.id, name: c.name, phone: c.phone },
      lastMessage: c.messages[0] ?? null,
    }));
  });

  // ── Products ──────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/products', async (req) =>
    prisma.product.findMany({ where: { accountId: req.params.id }, orderBy: { order: 'asc' } }),
  );

  fastify.post('/api/accounts/:id/products', async (req) => {
    const { name, description, price, unit, available, order } = req.body;
    return prisma.product.create({
      data: {
        accountId: req.params.id,
        name,
        description: description ?? null,
        price: parseFloat(price),
        unit: unit ?? null,
        available: available ?? true,
        order: order ?? 0,
      },
    });
  });

  fastify.put('/api/accounts/:id/products/:pid', async (req) => {
    const { name, description, price, unit, available } = req.body;
    return prisma.product.update({
      where: { id: req.params.pid },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price       !== undefined && { price: parseFloat(price) }),
        ...(unit        !== undefined && { unit }),
        ...(available   !== undefined && { available }),
      },
    });
  });

  fastify.delete('/api/accounts/:id/products/:pid', async (req) => {
    await prisma.product.delete({ where: { id: req.params.pid } });
    return { ok: true };
  });

  // ── Appointments ──────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/appointments', async (req) => {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return prisma.appointment.findMany({
      where: { accountId: req.params.id, datetime: { gte: now, lte: week } },
      include: { client: { select: { name: true, phone: true } } },
      orderBy: { datetime: 'asc' },
    });
  });

  fastify.put('/api/accounts/:id/appointments/:aid', async (req) => {
    const { status, notes } = req.body;
    return prisma.appointment.update({
      where: { id: req.params.aid },
      data: { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
    });
  });

  // ── Rules ─────────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/rules', async (req) =>
    prisma.rule.findMany({ where: { accountId: req.params.id }, orderBy: { priority: 'asc' } }),
  );

  fastify.post('/api/accounts/:id/rules', async (req) => {
    const { trigger, response, priority, active } = req.body;
    return prisma.rule.create({
      data: { accountId: req.params.id, trigger, response, priority: priority ?? 10, active: active ?? true },
    });
  });

  fastify.put('/api/accounts/:id/rules/:rid', async (req) => {
    const { trigger, response, priority, active } = req.body;
    return prisma.rule.update({
      where: { id: req.params.rid },
      data: {
        ...(trigger  !== undefined && { trigger }),
        ...(response !== undefined && { response }),
        ...(priority !== undefined && { priority }),
        ...(active   !== undefined && { active }),
      },
    });
  });

  fastify.delete('/api/accounts/:id/rules/:rid', async (req) => {
    await prisma.rule.delete({ where: { id: req.params.rid } });
    return { ok: true };
  });

  // ── Clients ───────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/clients', async (req) =>
    prisma.client.findMany({
      where: { accountId: req.params.id },
      include: { _count: { select: { messages: true } } },
      orderBy: { lastContact: 'desc' },
    }),
  );

  fastify.get('/api/accounts/:id/clients/:cid/messages', async (req) =>
    prisma.message.findMany({
      where: { accountId: req.params.id, clientId: req.params.cid },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
  );

  // ── Modules ───────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/modules', async (req) =>
    prisma.module.findMany({ where: { accountId: req.params.id } }),
  );

  fastify.put('/api/accounts/:id/modules/:type', async (req) => {
    const { active } = req.body;
    const { id: accountId, type } = req.params;
    return prisma.module.upsert({
      where: { accountId_type: { accountId, type } },
      create: { accountId, type, active },
      update: { active },
    });
  });
}
