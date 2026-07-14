import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, makePageMeta } from "../utils/pagination.js";
import { deleteUser, listUsers, updateUser, updateUserPassword, updateUserRole, updateUserStatus } from "../services/users.service.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req.query);
    const result = await listUsers({
      search: req.query.search,
      rol: req.query.rol,
      estado: req.query.estado,
      page,
      pageSize,
      offset,
    });

    res.json({ items: result.items, meta: makePageMeta(result.total, page, pageSize) });
  })
);

usersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const user = await updateUserStatus(req.params.id, Boolean(req.body?.activo));
    res.json({ user });
  })
);

usersRouter.patch(
  "/:id/role",
  asyncHandler(async (req, res) => {
    const user = await updateUserRole(req.params.id, req.body?.rol);
    res.json({ user });
  })
);

usersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await updateUser(req.params.id, req.body || {});
    res.json({ user });
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await deleteUser(req.params.id);
    res.json({ ok: true, user });
  })
);

usersRouter.patch(
  "/:id/password",
  asyncHandler(async (req, res) => {
    const user = await updateUserPassword(req.params.id, req.body?.password);
    res.json({ ok: true, user });
  })
);
