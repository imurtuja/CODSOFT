# EverCart - E-commerce Platform

A modern e-commerce website built with Next.js, React, and MongoDB.

## Features

- **Product Catalog** - Browse products by categories
- **Shopping Cart** - Add/remove items, view cart
- **User Authentication** - Login, signup, profile management
- **Checkout System** - Step-by-step checkout with address management
- **Payment Integration** - Razorpay payment gateway
- **Admin Panel** - Manage products and orders
- **Order Tracking** - View order history and status
- **Responsive Design** - Works on mobile and desktop

## Tech Stack

- Next.js 15
- React 18
- MongoDB
- Tailwind CSS
- Razorpay API

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   JWT_SECRET=your_jwt_secret
   ```
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Admin Access

- Email: admin@evercart.com
- Password: admin123

## Project Structure

```
src/
├── app/                 # Next.js pages
├── components/          # React components
├── models/             # MongoDB schemas
├── lib/                # Utilities and configs
└── middleware.js       # Next.js middleware
```

## API Endpoints

- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/addresses` - Address management
- `/api/payment` - Payment processing
- `/api/auth` - Authentication

Built with ❤️ for learning purposes.
