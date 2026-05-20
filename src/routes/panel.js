// Rutas del panel web — CRUD para accounts, products, appointments, rules, clients y modules

import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/crypto.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';

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

  // ── Send manual message ───────────────────────────────────────────────────
  fastify.post('/api/accounts/:id/messages/send', async (req, reply) => {
    const { clientPhone, message } = req.body ?? {};
    const accountId = req.params.id;

    if (!clientPhone || !message) {
      return reply.code(400).send({ error: 'clientPhone y message son requeridos' });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return reply.code(404).send({ error: 'Cuenta no encontrada' });

    let token = process.env.META_ACCESS_TOKEN;
    if (account.waToken) {
      try { token = decrypt(account.waToken); } catch { token = account.waToken; }
    }

    await sendWhatsAppMessage({
      to: clientPhone,
      phoneNumberId: account.phoneNumberId,
      token,
      message: { type: 'text', body: message },
    });

    const client_ = await prisma.client.findUnique({
      where: { accountId_phone: { accountId, phone: clientPhone } },
    });
    if (!client_) return reply.code(404).send({ error: 'Cliente no encontrado' });

    const saved = await prisma.message.create({
      data: {
        accountId,
        clientId: client_.id,
        direction: 'out',
        type: 'text',
        body: message,
        autoSent: false,
      },
    });

    fastify.io.emit('new_message', {
      accountId,
      message: saved,
      client: { id: client_.id, name: client_.name, phone: client_.phone },
    });

    return { success: true };
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

  // ── Business Hours ────────────────────────────────────────────────────────
  const HOUR_DEFAULTS = {
    0: { isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    1: { isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    2: { isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    3: { isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    4: { isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    5: { isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    6: { isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  };

  fastify.get('/api/accounts/:id/business-hours', async (req) => {
    const accountId = req.params.id;
    const saved = await prisma.businessHours.findMany({
      where: { accountId },
      orderBy: { dayOfWeek: 'asc' },
    });
    const savedMap = new Map(saved.map((h) => [h.dayOfWeek, h]));
    return [0, 1, 2, 3, 4, 5, 6].map((day) =>
      savedMap.get(day) ?? { accountId, dayOfWeek: day, ...HOUR_DEFAULTS[day] },
    );
  });

  fastify.put('/api/accounts/:id/business-hours', async (req) => {
    const accountId = req.params.id;
    const days = req.body;
    await Promise.all(
      days.map((d) =>
        prisma.businessHours.upsert({
          where:  { accountId_dayOfWeek: { accountId, dayOfWeek: d.dayOfWeek } },
          create: { accountId, dayOfWeek: d.dayOfWeek, isOpen: d.isOpen, openTime: d.openTime, closeTime: d.closeTime, slotDuration: d.slotDuration },
          update: { isOpen: d.isOpen, openTime: d.openTime, closeTime: d.closeTime, slotDuration: d.slotDuration },
        }),
      ),
    );
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

  // ── AI Config ─────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/ai-config', async (req) => {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      select: { aiConfig: true },
    });
    return account?.aiConfig ?? {};
  });

  fastify.put('/api/accounts/:id/ai-config', async (req) => {
    const { temperature, maxTokens, customInstructions, historyLength } = req.body ?? {};
    const aiConfig = {};
    if (temperature     !== undefined) aiConfig.temperature        = temperature;
    if (maxTokens       !== undefined) aiConfig.maxTokens          = maxTokens;
    if (customInstructions !== undefined) aiConfig.customInstructions = customInstructions;
    if (historyLength   !== undefined) aiConfig.historyLength      = historyLength;

    const updated = await prisma.account.update({
      where: { id: req.params.id },
      data: { aiConfig },
      select: { aiConfig: true },
    });
    return updated.aiConfig;
  });

  // ── Weekly report (Pro/Business only) ────────────────────────────────────
  fastify.get('/api/accounts/:id/reports/weekly', async (req, reply) => {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { plan: true } } },
    });
    if (!['pro', 'business'].includes(account?.user?.plan)) {
      return reply.code(403).send({ error: 'Esta función requiere el plan Pro o Business' });
    }

    const accountId = req.params.id;
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [msgEsta, msgAnterior, cliEsta, cliAnterior, aptEsta, aptAnterior] = await Promise.all([
      prisma.message.count({ where: { accountId, direction: 'in', createdAt: { gte: thisWeekStart } } }),
      prisma.message.count({ where: { accountId, direction: 'in', createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
      prisma.client.count({ where: { accountId, createdAt: { gte: thisWeekStart } } }),
      prisma.client.count({ where: { accountId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
      prisma.appointment.count({ where: { accountId, datetime: { gte: thisWeekStart }, status: { in: ['confirmed', 'completed'] } } }),
      prisma.appointment.count({ where: { accountId, datetime: { gte: lastWeekStart, lt: thisWeekStart }, status: { in: ['confirmed', 'completed'] } } }),
    ]);

    return {
      period: { from: thisWeekStart.toISOString(), to: now.toISOString() },
      mensajes: { estaSemana: msgEsta,  semanaAnterior: msgAnterior },
      clientes: { estaSemana: cliEsta,  semanaAnterior: cliAnterior },
      turnos:   { estaSemana: aptEsta,  semanaAnterior: aptAnterior },
    };
  });

  // ── Notification settings ────────────────────────────────────────────────
  fastify.put('/api/accounts/:id/notification-settings', async (req) => {
    const { notifyPhone1, notifyPhone2, reportEnabled } = req.body ?? {};
    return prisma.account.update({
      where: { id: req.params.id },
      data: {
        ...(notifyPhone1  !== undefined && { notifyPhone1:  notifyPhone1  || null }),
        ...(notifyPhone2  !== undefined && { notifyPhone2:  notifyPhone2  || null }),
        ...(reportEnabled !== undefined && { reportEnabled }),
      },
      select: { notifyPhone1: true, notifyPhone2: true, reportEnabled: true },
    });
  });

  // ── Reports ───────────────────────────────────────────────────────────────
  fastify.get('/api/accounts/:id/reports', async (req, reply) => {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { plan: true } } },
    });
    if (!['pro', 'business'].includes(account?.user?.plan)) {
      return reply.code(403).send({ error: 'Esta función requiere el plan Pro o Business' });
    }
    return prisma.report.findMany({
      where: { accountId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, type: true, filename: true, createdAt: true },
    });
  });

  fastify.get('/api/accounts/:id/reports/:reportId/download', async (req, reply) => {
    const report = await prisma.report.findFirst({
      where: { id: req.params.reportId, accountId: req.params.id },
    });
    if (!report) return reply.code(404).send('Not found');
    const pdfBuffer = Buffer.from(report.data, 'base64');
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${report.filename}"`);
    return reply.send(pdfBuffer);
  });

  // ── Cancel subscription ───────────────────────────────────────────────────
  fastify.post('/api/accounts/:id/cancel-subscription', async (req, reply) => {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true } } },
    });
    if (!account?.user) return reply.code(404).send({ error: 'Cuenta no encontrada' });

    await prisma.user.update({
      where: { id: account.user.id },
      data: { plan: 'starter' },
    });

    return { success: true, message: 'Suscripción cancelada. Tu cuenta ahora está en el plan Starter.' };
  });

  // ── Verify WhatsApp connection ─────────────────────────────────────────────
  fastify.post('/api/accounts/:id/verify-whatsapp', async (req, reply) => {
    const { phoneNumberId, waToken } = req.body ?? {};
    if (!phoneNumberId || !waToken) {
      return reply.code(400).send({ success: false, error: 'Faltan credenciales' });
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}`,
        { headers: { Authorization: `Bearer ${waToken}` }, signal: controller.signal },
      );
      clearTimeout(timeoutId)
      if (!res.ok) {
        return reply.send({ success: false, error: 'Token inválido o Phone Number ID incorrecto' });
      }
      await prisma.account.update({
        where: { id: req.params.id },
        data: { phoneNumberId, waToken: encrypt(waToken) },
      });
      return reply.send({ success: true });
    } catch {
      clearTimeout(timeoutId)
      return reply.send({ success: false, error: 'No se pudo conectar con la API de Meta' });
    }
  });
}