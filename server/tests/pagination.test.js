import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPagination,
  parsePagination,
} from "../utils/pagination.js";

test("no query parameters keep the unpaginated response", () => {
  assert.deepEqual(parsePagination({}), { paginated: false });
});

test("page and limit are parsed into an offset", () => {
  assert.deepEqual(parsePagination({ page: "3", limit: "9" }), {
    paginated: true,
    page: 3,
    limit: 9,
    offset: 18,
  });
});

test("a page without a limit uses the resource default", () => {
  assert.deepEqual(parsePagination({ page: "2" }, { defaultLimit: 9 }), {
    paginated: true,
    page: 2,
    limit: 9,
    offset: 9,
  });
});

test("a limit without a page starts at page one", () => {
  assert.deepEqual(parsePagination({ limit: "6" }), {
    paginated: true,
    page: 1,
    limit: 6,
    offset: 0,
  });
});

test("invalid and oversized values are rejected", () => {
  for (const query of [
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "abc" },
    { page: ["1", "2"] },
    { limit: "0" },
    { limit: "49" },
  ]) {
    assert.ok(parsePagination(query).error, JSON.stringify(query));
  }
});

test("pagination metadata clamps a page beyond the last page", () => {
  const meta = buildPagination(14, 99, 9);

  assert.equal(meta.total, 14);
  assert.equal(meta.page, 2);
  assert.equal(meta.totalPages, 2);
  assert.equal(meta.offset, 9);
  assert.equal(meta.hasNextPage, false);
  assert.equal(meta.hasPreviousPage, true);
});

test("an empty collection still reports one page", () => {
  const meta = buildPagination(0, 1, 9);

  assert.equal(meta.totalPages, 1);
  assert.equal(meta.offset, 0);
  assert.equal(meta.hasNextPage, false);
  assert.equal(meta.hasPreviousPage, false);
});
