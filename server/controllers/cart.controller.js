import Product from "../models/product.model.js";

/**
 * Handle POST /carts request
 * Add a product to the user's cart
 * If the product is already in the cart, increase its quantity by 1
 * If the product is not in the cart, add it to the cart with a quantity of 1
 * @param {Object} req - Express request object
 * @param {Object} req.body - The request body containing the productId
 * @param {string} req.body.productId - The id of the product to be added to the cart
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the product is successfully added to the cart
 */
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    // check for existing item in cart
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      // increase quantity by 1
      existingItem.quantity += 1;
    } else {
      // add new item to cart
      user.cartItems.push(productId);
    }

    await user.save();
    res.status(200).json({ status: true, data: user });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
export const getCartAllProducts = async (req, res) => {
  try {
    const user = req.user;
    // get all products in cart the $in is used to check if the product id is in the cart
    const cartProducts = await Product.find({ _id: { $in: user.cartItems } });

    // add quantity property to each product
    const quantity = cartProducts.map((product) => {
      // check if product is in cart
      const item = user.cartItems.find((item) => item.id === product.id);
      return { ...product.toJSON(), quantity: item ? item.quantity : 0 };
    });
    res.status(200).json({
      status: true,
      data: quantity,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle DELETE /carts request
 * Remove a product from the user's cart
 * If productsId is not provided, remove all products from the cart
 * @param {Object} req - Express request object
 * @param {Object} req.body - The request body containing the product id
 * @param {string} req.body.productsId - The id of the product to be removed from the cart
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the product is successfully removed from the cart
 */
export const removeAllFromCart = async (req, res) => {
  try {
    const { productsId } = req.body;
    const user = req.user;
    if (!productsId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productsId);
    }

    await user.save();
    res.status(200).json({ status: true, data: user });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle PUT /carts/:id request
 * Update the quantity of a product in the user's cart
 * If the quantity is 0, remove the product from the cart
 * @param {Object} req - Express request object
 * @param {Object} req.params - The request params containing the id of the product to update
 * @param {string} req.params.id - The id of the product to update
 * @param {Object} req.body - The request body containing the new quantity
 * @param {number} req.body.quantity - The new quantity of the product
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the product's quantity is successfully updated
 */
export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const quantity = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);
    // if quantity is 0, remove the product from the cart
    if (existingItem && quantity == 0) {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
      await user.save();
      res.status(200).json({ status: true, data: user });
    } else {
      existingItem.quantity = quantity;
      await user.save();
      res.status(200).json({ status: true, data: user });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
