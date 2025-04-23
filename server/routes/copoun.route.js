import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  getCopoun,
  validateCopoun,
  addCopoun,
} from "../controllers/copoun.controller.js";
const router = express.Router();

/**
 * @swagger
 *  components:
 *      schemas:
 *          Copoun:
 *                  type: object
 *                  properties:
 *                          code:
 *                              type: string
 *                          discountAmount:
 *                              type: number
 *                          expirationDate:
 *                              type: string
 *                              format: date
 *                          isActive:
 *                              type: boolean
 *                          userId:
 *                              type: number
 */

/**
 * @swagger
 * /copoun:
 *    get:
 *      summary: Get the copoun of the user
 *      description: Get the copoun of the user
 *      responses:
 *          200:
 *              description: Get the copoun of the user
 *              content:
 *                   application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Copoun'
 *
 *          500:
 *              description: Internal server error
 */
router.get("/", protectRoute, getCopoun);
router.post("/", protectRoute, adminRoute, addCopoun);
router.get("/validate", protectRoute, validateCopoun);

export default router;
