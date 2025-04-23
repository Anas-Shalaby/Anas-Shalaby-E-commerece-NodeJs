import express from "express";
import {
  logout,
  signup,
  login,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 *  components:
 *      schemas:
 *          User:
 *               type: object
 *               properties:
 *                    name:
 *                        type: string
 *                    email:
 *                        type: string
 *                    password:
 *                        type: string
 *                    cartItems:
 *                        type: object
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *      summary: Signup new user
 *      description: Signup new user
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                    schema:
 *                      $ref : '#/components/schemas/User'
 *      responses:
 *          201:
 *              description: User created successfully
 *              content:
 *                   application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *
 *          500:
 *              description: Internal server error
 */
router.post("/signup", signup);

// route to logout
router.post("/logout", logout);

// route to login
router.post("/login", login);

router.post("/refresh-token", refreshToken);

// TODO route to the user profile page

export default router;
