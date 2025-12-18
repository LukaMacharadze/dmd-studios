// backend/swagger.js
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DMD Studios API",
      version: "1.0.0",
      description: "API documentation for DMD Studios (Products, Auth, Upload, Orders).",
    },
    servers: [{ url: "http://localhost:3000" }],

    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Modern Sofa" },
            price: { type: "number", example: 900 },
            image: { type: "string", example: "uploads/p_1766063.webp" },
            category: { type: "string", example: "Sofas" },
            description: { type: "string", example: "Comfortable modern sofa." },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            login: { type: "string", example: "admin" },
            role: { type: "string", example: "admin" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            product_id: { type: "integer", example: 26 },
            title: { type: "string", example: "Modern Sofa" },
            price: { type: "number", example: 150 },
            qty: { type: "integer", example: 1 },
            image: { type: "string", example: "uploads/p_1766063.webp" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_login: { type: "string", example: "admin" },
            full_name: { type: "string", example: "John Doe" },
            phone: { type: "string", example: "+995 555 555 555" },
            address: { type: "string", example: "Tbilisi, Georgia" },
            comment: { type: "string", example: "Leave at the door" },
            total: { type: "number", example: 150 },
            created_at: { type: "string", example: "2025-12-18T14:14:14.034Z" },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "db error" },
          },
        },
      },
    },

    tags: [{ name: "Auth" }, { name: "Products" }, { name: "Upload" }, { name: "Orders" }],
  },

  // ✅ ВАЖНО: абсолютный путь, чтобы JSDoc 100% нашёлся
  apis: [path.join(__dirname, "index.js")],
};

module.exports = swaggerJSDoc(options);
