import assert from "node:assert/strict";
import test from "node:test";

import handler from "../src/pages/api/check";

function createResponseRecorder() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  return response;
}

test("api/check returns 405 for non-GET request", async () => {
  const req = { method: "POST", query: {} } as any;
  const res = createResponseRecorder() as any;

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("api/check returns 400 when required params are missing", async () => {
  const req = {
    method: "GET",
    query: { condition: "colonoscopy", dayStage: "d1" },
  } as any;
  const res = createResponseRecorder() as any;

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual((res.payload as { required: string[] }).required, [
    "condition",
    "dayStage",
    "query",
  ]);
});
