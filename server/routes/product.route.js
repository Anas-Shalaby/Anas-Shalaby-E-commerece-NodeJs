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
import multer from "multer";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protectRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/reccomendations", getRecommendationProducts);
router.post("/", protectRoute, adminRoute, upload.single("image"), addProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProducts);
router.post("/delete/:id", protectRoute, adminRoute, deleteProduct);
export default router;
