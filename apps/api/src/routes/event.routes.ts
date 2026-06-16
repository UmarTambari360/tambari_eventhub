import { Router } from 'express';
import type { 
    Router as ExpressRouter, 
    Request, Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  requireOrganizerApproved,
}                   from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  publishEventSchema,
  createTicketTypeSchema,
  updateTicketTypeSchema,
  eventFilterSchema,
} from '@eventhub/validators';
import {
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getEventBySlug,
  getPublishedEvents,
  getFeaturedEvents,
  getOrganizerEventById,
  getOrganizerEventsList,
} from '../services/event.service.js';
import {
  addTicketType,
  updateTicketType,
  deleteTicketType,
} from '../services/ticket.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router: ExpressRouter = Router();

// ─── Public routes

//GET /events/featured
//Returns featured events — cached.
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await getFeaturedEvents();
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

//GET /events
//Public paginated event listing with filters.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = eventFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid filter parameters' },
      });
      return;
    }
    const result = await getPublishedEvents(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

//GET /events/:slug
//Public event detail by slug.
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params as { slug: string };
    const event = await getEventBySlug(slug);

    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// ─── Organizer routes — require approved organizer

const organizerMiddleware = [
  authenticate,
  requireRole('organizer', 'admin'),
  requireOrganizerApproved,
];

//GET /events/organizer/list
//Organizer's own events (including unpublished).
router.get(
  '/organizer/list',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 40);
      const result = await getOrganizerEventsList(authReq.user.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

//GET /events/organizer/:id
//Single event detail for organizer (includes unpublished + ticket types).
router.get(
  '/organizer/:id',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      const event = await getOrganizerEventById(id, authReq.user.userId);
      res.json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }
);

//POST /events
//Create a new event with initial ticket types.
router.post(
  '/',
  ...organizerMiddleware,
  validate(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await createEvent(
        authReq.user.userId, 
        req.body as Parameters<typeof createEvent>[1]);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

//PATCH /events/:id
//Update event details (not ticket types).
router.patch(
  '/:id',
  ...organizerMiddleware,
  validate(updateEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      await updateEvent(
        id, authReq.user.userId, 
        req.body as Parameters<typeof updateEvent>[2]);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

//POST /events/:id/publish
//Publish or unpublish an event.
router.post(
  '/:id/publish',
  ...organizerMiddleware,
  validate(publishEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      const { publish } = req.body as { publish: boolean };
      await publishEvent(id, authReq.user.userId, publish);
      res.json({
        success: true,
        data: null,
        message: publish ? 'Event published.' : 'Event unpublished.',
      });
    } catch (err) {
      next(err);
    }
  }
);

//POST /events/:id/cancel
//Cancel an event.
router.post(
  '/:id/cancel',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      await cancelEvent(id, authReq.user.userId);
      res.json({ success: true, data: null, message: 'Event cancelled.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Ticket type routes

//POST /events/:id/ticket-types
//Add a ticket type to an event.
router.post(
  '/:id/ticket-types',
  ...organizerMiddleware,
  validate(createTicketTypeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      const ticketTypeId = await addTicketType(
        id, authReq.user.userId, 
        req.body as Parameters<typeof addTicketType>[2]);
      res.status(201).json({ success: true, data: { id: ticketTypeId } });
    } catch (err) {
      next(err);
    }
  }
);

//PATCH /events/ticket-types/:ticketTypeId
//Update a ticket type.
router.patch(
  '/ticket-types/:ticketTypeId',
  ...organizerMiddleware,
  validate(updateTicketTypeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { ticketTypeId } = req.params as { ticketTypeId: string };
      await updateTicketType(ticketTypeId, authReq.user.userId, req.body as Parameters<typeof updateTicketType>[2]);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

//DELETE /events/ticket-types/:ticketTypeId
//Delete a ticket type (only if 0 tickets sold).
router.delete(
  '/ticket-types/:ticketTypeId',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { ticketTypeId } = req.params as { ticketTypeId: string };
      await deleteTicketType(ticketTypeId, authReq.user.userId);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export { router as eventRouter };