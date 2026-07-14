import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, makePageMeta } from "../utils/pagination.js";
import { listNotifications, markNotificationRead } from "../services/notifications.service.js";
import { badRequest } from "../utils/errors.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    if (!userId) throw badRequest("userId es obligatorio");

    const { page, pageSize, offset } = getPagination(req.query);
    const result = await listNotifications({
      userId,
      unreadOnly: req.query.unreadOnly === "true",
      page,
      pageSize,
      offset,
    });

    res.json({ items: result.items, meta: makePageMeta(result.total, page, pageSize) });
  })
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await markNotificationRead(req.params.id);
    res.json({ notification });
  })
);
