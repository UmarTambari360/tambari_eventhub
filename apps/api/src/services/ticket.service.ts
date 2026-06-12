import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { ticketTypes, events }                      from '../db/schema/index.js';
import { queryEventById, queryTicketTypesForEvent } from '../db/queries/events.queries.js';
import { cacheDel } from '../lib/redis.js';
import { logger }   from '../lib/logger.js';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
}                           from '../middleware/error.middleware.js';
import type { 
    CreateTicketTypeInput, 
    UpdateTicketTypeInput } from '@eventhub/validators';

async function recomputeEventIsFree(eventId: string): Promise<void> {
  const types = await queryTicketTypesForEvent(eventId);
  const activeTypes = types.filter((t) => t.isActive);
  const isFree = activeTypes.length > 0 && activeTypes.every((t) => t.price === 0);

  await db.update(events).set({ isFree, updatedAt: new Date() }).where(eq(events.id, eventId));
}

export async function addTicketType(
  eventId: string,
  organizerId: string,
  input: CreateTicketTypeInput
): Promise<string> {
  const event = await queryEventById(eventId);
  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Access denied.');
  if (event.isCancelled) throw new ConflictError('Cannot add ticket types to a cancelled event.');

  const existing = await queryTicketTypesForEvent(eventId);
  if (existing.length >= 10) {
    throw new AppError(422, 'Maximum 10 ticket types per event.');
  }

  const [tt] = await db
    .insert(ticketTypes)
    .values({
      eventId,
      name: input.name,
      description: input.description || null,
      price: input.price,
      quantity: input.quantity,
      quantitySold: 0,
      saleStartDate: input.saleStartDate ? new Date(input.saleStartDate) : null,
      saleEndDate: input.saleEndDate ? new Date(input.saleEndDate) : null,
      minPurchase: input.minPurchase,
      maxPurchase: input.maxPurchase,
      isActive: true,
    })
    .returning({ id: ticketTypes.id });

  if (!tt) throw new AppError(500, 'Failed to create ticket type.');

  await recomputeEventIsFree(eventId);

  // Invalidate event cache
  await cacheDel(`event:${event.slug}`);

  logger.info('Ticket type added', { ticketTypeId: tt.id, eventId });

  return tt.id;
}

export async function updateTicketType(
  ticketTypeId: string,
  organizerId: string,
  input: UpdateTicketTypeInput
): Promise<void> {
  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, ticketTypeId))
    .limit(1);

  if (!tt) throw new NotFoundError('Ticket type not found.');

  const event = await queryEventById(tt.eventId);
  if (!event) throw new NotFoundError('Associated event not found.');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Access denied.');
  if (event.isCancelled) throw new ConflictError('Cannot update ticket types of a cancelled event.');

  // Business rule: cannot reduce quantity below what's already sold
  if (input.quantity !== undefined && input.quantity < tt.quantitySold) {
    throw new AppError(
      422,
      `Cannot set quantity to ${input.quantity} — ${tt.quantitySold} tickets already sold.`
    );
  }

  const updateData: Partial<typeof ticketTypes.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.saleStartDate !== undefined)
    updateData.saleStartDate = input.saleStartDate ? new Date(input.saleStartDate) : null;
  if (input.saleEndDate !== undefined)
    updateData.saleEndDate = input.saleEndDate ? new Date(input.saleEndDate) : null;
  if (input.minPurchase !== undefined) updateData.minPurchase = input.minPurchase;
  if (input.maxPurchase !== undefined) updateData.maxPurchase = input.maxPurchase;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  await db.update(ticketTypes).set(updateData).where(eq(ticketTypes.id, ticketTypeId));

  await recomputeEventIsFree(tt.eventId);
  await cacheDel(`event:${event.slug}`);

  logger.info('Ticket type updated', { ticketTypeId, eventId: tt.eventId });
}

export async function deleteTicketType(
  ticketTypeId: string,
  organizerId: string
): Promise<void> {
  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, ticketTypeId))
    .limit(1);

  if (!tt) throw new NotFoundError('Ticket type not found.');

  const event = await queryEventById(tt.eventId);
  if (!event) throw new NotFoundError('Associated event not found.');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Access denied.');

  // Business rule: cannot delete if any tickets sold
  if (tt.quantitySold > 0) {
    throw new ConflictError(
      `Cannot delete this ticket type — ${tt.quantitySold} ticket(s) already sold. Deactivate it instead.`
    );
  }

  await db.delete(ticketTypes).where(eq(ticketTypes.id, ticketTypeId));

  await recomputeEventIsFree(tt.eventId);
  await cacheDel(`event:${event.slug}`);

  logger.info('Ticket type deleted', { ticketTypeId, eventId: tt.eventId });
}

export async function getTicketTypesForEvent(eventId: string, organizerId: string) {
  const event = await queryEventById(eventId);
  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Access denied.');
  return queryTicketTypesForEvent(eventId);
}