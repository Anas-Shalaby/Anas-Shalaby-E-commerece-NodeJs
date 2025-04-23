# E-commerce Store API

A robust and scalable E-commerce REST API built with Node.js, Express, MongoDB, and Redis. This API provides comprehensive functionality for managing products, user authentication, shopping cart operations, coupon management, and payment processing using Stripe.

## 🚀 Features

- **Authentication & Authorization**

  - User signup and login
  - JWT-based authentication with access and refresh tokens
  - Role-based access control (Admin/Customer)
  - Secure password hashing using bcrypt

- **Product Management**

  - CRUD operations for products
  - Featured products listing
  - Product categorization
  - Product recommendations
  - Image upload using Cloudinary

- **Shopping Cart**

  - Add/Remove products
  - Update quantities
  - Cart persistence

- **Coupon System**

  - Dynamic coupon generation
  - Coupon validation
  - Expiration date management
  - User-specific coupons

- **Payment Processing**

  - Secure checkout using Stripe
  - Order management
  - Payment status tracking

- **Performance Optimization**
  - Redis caching for featured products
  - Efficient database queries
  - Response optimization

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe API
- **Image Storage**: Cloudinary
- **API Documentation**: Swagger/OpenAPI
- **Others**: Cookie-parser, CORS

## 📦 Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd E-commerece-NodeJs
```
