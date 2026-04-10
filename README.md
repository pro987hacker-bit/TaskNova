# SkillCentre (Freelancer Marketplace MVP+)

Browser-based freelancer marketplace where:
- You can sell your own services
- Other people can create seller accounts and post services
- Buyers can place paid orders
- You earn platform commission from each order

## Monetization Logic
- Platform fee: **15%** per order
- Seller receives: **85%** per order

## Advanced Features Added
- Multi-package gigs: Basic, Standard, Premium
- Checkout modal with payment methods:
  - Card
  - PayPal
  - Bank Transfer
  - Easypaisa
  - JazzCash
- Rich order details (order number, due date, payment status, requirements)
- Buyer reviews after order completion
- Order-based inbox chat between buyer and seller
- Seller withdrawal system:
  - withdrawable balance tracking
  - payout request form
  - admin approval/rejection panel
- Admin analytics:
  - GMV, commission, payouts
  - payment-method breakdown
  - transactions and reviews feed

## Run
1. Open `index.html` in your browser.
2. Login/Create account from the top card.
3. Use **Become Seller** to post services.
4. Place orders via **Marketplace**.
5. Use **My Dashboard** for orders, inbox, and withdrawals.
6. Use **Your Earnings** for admin analytics and payout approvals.

## Files
- `index.html` - layout and modals
- `styles.css` - visual design and responsive styles
- `app.js` - marketplace logic, storage, checkout, reviews, chat, withdrawals

## Note
This app uses `localStorage` (no real backend yet). For production, next step is backend auth, database, and live payment gateway integration.
