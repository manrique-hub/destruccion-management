import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, makePageMeta } from "../utils/pagination.js";
import {
  createActa,
  deleteActa,
  decideActa,
  getActaById,
  getOverviewStats,
  listActas,
  listHistorialByActa,
  submitActa,
  updateActa,
} from "../services/actas.service.js";
import { badRequest } from "../utils/errors.js";

export const actasRouter = Router();

actasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req.query);
    const result = await listActas({
      search: req.query.search,
      estado: req.query.estado,
      page,
      pageSize,
      offset,
    });

    res.json({ items: result.items, meta: makePageMeta(result.total, page, pageSize) });
  })
);

actasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const acta = await createActa(req.body || {});
    res.status(201).json({ acta });
  })
);

actasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = await getActaById(req.params.id);
    res.json(data);
  })
);

actasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const acta = await updateActa(req.params.id, req.body || {});
    res.json({ acta });
  })
);

actasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await deleteActa(req.params.id);
    res.json(result);
  })
);

actasRouter.post(
  "/:id/submit",
  asyncHandler(async (req, res) => {
    const user = req.body?.user;
    if (!user?.id || !user?.rol) throw badRequest("user.id y user.rol son obligatorios");

    const data = await submitActa(req.params.id, user);
    res.json(data);
  })
);

actasRouter.post(
  "/:id/decision",
  asyncHandler(async (req, res) => {
    const user = req.body?.user;
    if (!user?.id || !user?.rol) throw badRequest("user.id y user.rol son obligatorios");

    const data = await decideActa(req.params.id, {
      action: req.body?.action,
      comentario: req.body?.comentario,
      user,
    });
    res.json(data);
  })
);

actasRouter.get(
  "/:id/historial",
  asyncHandler(async (req, res) => {
    const historial = await listHistorialByActa(req.params.id);
    res.json({ historial });
  })
);

actasRouter.get(
  "/stats/overview",
  asyncHandler(async (_req, res) => {
    const stats = await getOverviewStats();
    res.json({ stats });
  })
);
