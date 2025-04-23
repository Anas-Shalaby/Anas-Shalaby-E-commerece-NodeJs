import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

/**
 * Handle GET /products request
 * Return all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the products are successfully retrieved
 */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ status: true, data: products });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle GET /products/featured request
 * Return all featured products
 * First checks if the products are cached in Redis
 * If not, fetches from MongoDB and stores in Redis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the products are successfully retrieved
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    // get it from redis first
    let featuredProducts = await redis.get("featuredProducts");
    if (featuredProducts) {
      return res
        .status(200)
        .json({ status: true, data: JSON.parse(featuredProducts) });
    }
    // if not found in redis fetch from mongo db
    // lean() is gonna return plain javascript object not mongoose object which is good for performance
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(200).json({ status: true, data: [] });
    }

    // store it in redis
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));

    res.status(200).json({ status: true, data: featuredProducts });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle POST /products request
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} req.body.name - The name of the product
 * @param {string} req.body.description - The description of the product
 * @param {string|number} req.body.price - The price of the product
 * @param {string} [req.body.image] - The image of the product
 * @param {string} req.body.category - The category of the product
 * @returns {Promise<void>} - The promise resolves when the product is successfully created
 */
export const addProduct = async (req, res) => {
  try {
    // set the content type to form data
    let { name, description, price, category, image } = req.body;
    if (req.file) {
      // convert the image to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      // create the data uri
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      image = dataURI;
    }
    // upload image to cloudinary
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });
    res.status(201).json({ status: true, data: product });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle DELETE /products/:id request
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} req.params.id - The id of the product to delete
 * @returns {Promise<void>} - The promise resolves when the product is successfully deleted
 */
export const deleteProduct = async (req, res) => {
  try {
    const findProduct = await Product.findById(req.params.id);
    if (!findProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    if (findProduct.image) {
      const publicId = findProduct.image.split("/").pop().split(".")[0]; // extract the public_id from the image url
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Product image deleted successfully");
      } catch (error) {
        throw error;
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle GET /products/recommendation request
 * Return a random sample of 4 products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the products are successfully retrieved
 */
export const getRecommendationProducts = async (req, res) => {
  try {
    // aggregate() returns an array
    const products = await Product.aggregate({
      $sample: {
        size: 4,
      },
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        price: 1,
        image: 1,
      },
    });

    res.status(200).json({ status: true, data: products });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle GET /products/category/:category request
 * Return all products in the specified category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the products are successfully retrieved
 */
export const getProductsByCategory = async (req, res) => {
  const category = req.params.category;
  try {
    const products = await Product.find({ category });
    res.status(200).json({ status: true, data: products });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

export const toggleFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findById(req.params.id); // get the product
    if (products) {
      products.isFeatured = !products.isFeatured;
      const updatedProducts = await products.save();
      await updateFeaturedProductsCache();
      res.status(200).json({ status: true, data: updatedProducts });
    } else {
      res.status(404).json({ status: false, message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const updateFeaturedProductsCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating featured products cache:", error);
  }
};
