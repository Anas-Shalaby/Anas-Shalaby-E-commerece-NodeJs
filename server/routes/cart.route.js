import express from "express";
import {
  addToCart,
  getCartAllProducts,
  removeAllFromCart,
  updateQuantity,
} from "./../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

/**
 * @swagger
 * /api/v1/carts:
 *  get:
 *      summary: get all cart products of the user
 *      description: take the access token and get all produtcs to the user from the cart
 *      resposes :
 *            200:
 *                description: successfully get the cart products
 *                content:
 *                    application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  name: quantity
 *            500:
 *                description: Internal server error
 */

router.get("/", protectRoute, getCartAllProducts);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);
/**
 * @swagger
 * /api/v1/carts:
 *   post:
 *      summary: Add a product to the user's cart
 *      description: Use this endpoint to add products to user's cart
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                    schema:
 *                      type: string
 *                      properties:
 *                          name: productId
 *      responses:
 *          200:
 *              description: Product is added successfully to the cart
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#components/schemas/User'
 *          500:
 *            description: Internal server error
 *
 *
 *
 */
router.post("/", protectRoute, addToCart);
export default router;
