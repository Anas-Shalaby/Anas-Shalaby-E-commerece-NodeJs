import express from "express";
import {
  getAllProducts,
  getFeaturedProducts,
  addProduct,
  deleteProduct,
  getRecommendationProducts,
  getProductsByCategory,
  toggleFeaturedProducts,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/reccomendations", getRecommendationProducts);
router.post("/", protectRoute, adminRoute, addProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProducts);
router.post("/delete/:id", protectRoute, adminRoute, deleteProduct);
export default router;
