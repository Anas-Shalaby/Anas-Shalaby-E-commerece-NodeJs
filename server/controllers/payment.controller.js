import { stripe } from "../lib/stripe.js";
import Copoun from "../models/copoun.model.js";
import Order from "../models/order.model.js";

/**
 * Handle POST /payment request
 * Create a stripe checkout session
 * The session includes all the products in the cart and a discount if a coupon code is provided
 * If the total amount of the checkout is greater than or equal to 40000, create a new coupon for the user
 * @param {Object} req - Express request object
 * @param {Object} req.body - The request body containing the products and coupon code
 * @param {number} req.body.products - Array of products to be purchased
 * @param {string} [req.body.copounCode] - Coupon code to be applied to the purchase
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the checkout session is successfully created
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, copounCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "No products selected or Invalid products" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // convert to cents because stripe requires cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity, // This was missing
      };
    });
    let copoun = null;
    if (copounCode) {
      copoun = await Copoun.findOne({
        code: copounCode,
        userId: req.user._id,
        isActive: true,
      });
      if (copoun) {
        totalAmount -= Math.round((totalAmount * copoun.discountAmount) / 100);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/canceled`,
      discounts: copoun
        ? [
            {
              copoun: await createStripeCopoun(copoun.discountAmount),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        copounCode: copounCode || "",
        products: JSON.stringify(
          products.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          }))
        ),
      },
    });

    if (totalAmount >= 40000) {
      await createNewCopoun(req.user._id);
    }

    res.status(200).json({
      status: true,
      sessionId: session.id,
      url: session.url, // Add this to your response
      totalAmount: totalAmount / 100,
    });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Error creating checkout session",
    });
  }
};

/**
 * Create a stripe copoun with a given discount amount.
 * @param {number} discountAmount - Percentage discount amount (e.g. 10 for 10% off).
 * @returns {Promise<string>} - The id of the created copoun.
 */
const createStripeCopoun = async (discountAmount) => {
  const copoun = await stripe.coupons.create({
    percent_off: discountAmount,
    duration: "once",
  });

  return copoun.id;
};

/**
 * Create a new copoun for the given user.
 * The copoun has a unique code, a discount amount of 10%, and expires in 30 days.
 * @param {ObjectId} userId - The id of the user to create the copoun for.
 * @returns {Promise<Copoun>} - The newly created copoun.
 */
async function createNewCopoun(userId) {
  const newCopoun = new Copoun({
    code: "DISCOUNT" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    discountAmount: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    userId: userId,
  });

  await newCopoun.save();

  return newCopoun;
}

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.copounCode) {
        await Copoun.findByIdAndUpdate(
          {
            code: session.metadata.copounCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }

      // create a new order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });
      await newOrder.save();
      return res.status(200).json({
        status: true,
        data: newOrder,
        message: "Order created successfully",
      });
    } else {
      // Handle non-paid status
      return res.status(400).json({
        status: false,
        message: `Payment status is ${session.payment_status}`,
      });
    }
  } catch (error) {
    console.error("Checkout success error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Error processing checkout",
    });
  }
};
