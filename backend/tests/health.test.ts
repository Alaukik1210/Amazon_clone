import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app";

test("GET /api/v1/health returns 200", async () => {
  const response = await request(app).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(response.body?.status, "ok");
  assert.equal(typeof response.body?.uptime, "number");
});
