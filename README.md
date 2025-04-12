# Dotpress – a modern express microframework

**Dotpress** is a lightweight and modern wrapper around Express.js designed for clean and scalable APIs written in TypeScript.

[Full documentation here](https://dotpress.dev)

## Why Dotpress?

Writing Express apps in TypeScript can be painful:
- Repetitive boilerplate for routing, validation, and errors
- Manual typing for request/response
- Middleware chains that quickly become messy

**Dotpress** solves this with:
- ✅ Auto-typed request/response via schema definitions
- ✅ Built-in validation using [Zod](https://github.com/colinhacks/zod)
- ✅ Clean `defineRoute()` syntax for composable APIs (no decorators here!)
- ✅ Built-in error handling and 404/500 responses
- ✅ First-class support for global and per-route middlewares
- ✅ Developer-friendly DX and sensible defaults
- ✅ Standardize error responses

---

## Quick Start

### 1. Install

```bash
npm install dotpress express@4 zod
```

Note: for now, we are supporting express v4. Express 5 support will be implemented soon.

### 2. Create a simple server

```ts
// index.ts
import { createApp, defineRoute } from 'dotpress'

defineRoute({
  path: '/hello',
  method: 'get',
  handler: async () => {
    return { message: 'Hello World!' }
  }
})

const app = await createApp()

app.listen(3000, () => {
  console.log('Server listening on port 3000')
})
```

### Call it:

```bash
curl http://localhost:3000/hello
# { "message": "Hello World!" }
```

---

## Features

### Automatic Typing via Schema

```ts
defineRoute({
  method: 'post',
  path: '/user',
  schema: (z) => ({
    body: z.object({
      name: z.string(),
      age: z.number().optional()
    })
  }),
  handler: async ({ req }) => {
    // req.body is fully typed here
    return { created: true }
  }
})
```

You can also type req.query and req.params. Note that params are always received as strings so you can just list expected parameters:

```ts
defineRoute({
  path: '/projects/:projectId/boards/:boardId/issues',
  schema: (z) => ({
    params: ['projectId', 'boardId'],
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional(),
    }),
  }),
  handler: async ({ req }) => {
    // req.body is fully typed here
    return { created: true }
  }
})
```


### Built-in Validation

- Body, query and params validation via [Zod](https://zod.dev)
- Automatically returns `400` with full error details

```ts
schema: (z) => ({
  query: z.object({ mode: z.string().optional() }),
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ name: z.string() })
})
```

On validation failure:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "source": "body",
      "issues": [
        {
          "path": ["name"],
          "message": "Required",
          "code": "invalid_type"
        }
      ]
    }
  ]
}
```

---

### Context-aware Request Handling

Every handler receives a `RequestContext` object:

```ts
defineRoute({
  method: 'get',
  path: '/me',
  handler: async ({ req, logger, requestId }) => {
    logger.info('Fetching profile');
    return { user: req.user }
  }
})
```

Context includes:
- `req`, `res`: Express request/response
- `logger`: (Pino or console fallback)
- `requestId`: Unique ID per request
- `user`: if provided by a middleware

---

### Route-Level Middleware

```ts
defineRoute({
  path: '/private-route',
  middlewares: [
    async ({ user }) => {
      if (!user) return unauthorizedError()
    }
  ],
  handler: async () => {
    return { secure: true }
  }
})
```

---

### Global Middleware

```ts
await createApp({
  middlewares: [
    async ({ req }) => {
      const token = req.headers.authorization
      req.user = decodeToken(token)
    }
  ]
})
```

---

### ❌ 6. Built-in Error Responses

You can return standard HTTP errors from handlers:

```ts
import { badRequestError, unauthorizedError, forbiddenError, notFoundError } from 'dotpress'

// Helpers for sommon errors
return forbiddenError();
return badRequestError("Invalid name");
return notFoundError("User not found");
return unauthorizedError();

// Or you can use a custom error response here
return errorResponse(403, "Forbidden", { reason: 'not_allowed' });
```

---

## Test-ready

You can use [Supertest](https://github.com/visionmedia/supertest) + [Vitest](https://vitest.dev) for functional testing.

```ts
import request from 'supertest';

it('should respond to GET /hello', async () => {
  const app = await createApp();
  const res = await request(app).get('/hello');
  expect(res.status).toBe(200);
});
```
