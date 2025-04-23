import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import copounRoutes from "./routes/copoun.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUIExpress from "swagger-ui-express";
dotenv.config();
const app = express();
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
    ],
  },
  apis: [`./backend/routes/*.js`],
};

const swaggerSpec = swaggerJSDoc(options);

app.use(
  "/api-docs",
  swaggerUIExpress.serve,
  swaggerUIExpress.setup(swaggerSpec)
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 4000;

// allow json and parse the body of the request
app.use(express.json());
// allow url encoded
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/coupons", copounRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log("Server is running on the port " + PORT);
  connectDB();
});
