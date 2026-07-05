import swaggerJsdoc from "swagger-jsdoc";

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DevPulse API",
      version: "1.0.0",
      description: "REST API for the DevPulse Developer Productivity Intelligence Dashboard"
    },
    servers: [{ url: "http://localhost:4000/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/auth/github": { get: { summary: "Start GitHub OAuth read-only authorization" } },
      "/dashboard/developer": { get: { summary: "Developer dashboard aggregate" } },
      "/dashboard/executive": { get: { summary: "Executive dashboard aggregate" } },
      "/repositories": { get: { summary: "List repositories with health and risk counts" } },
      "/analytics/commits": { get: { summary: "Commit analytics summary" } },
      "/ai/chat": { post: { summary: "Ask the analytics-grounded AI assistant" } },
      "/webhooks/github": { post: { summary: "Receive and verify GitHub webhook events" } }
    }
  },
  apis: []
});
