import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

export function getPagination(query) {
  const page = Math.max(1, Number(query.page || 1));
  const requested = Number(query.pageSize || DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export function makePageMeta(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { total, page, pageSize, totalPages };
}
