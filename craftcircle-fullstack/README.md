# CraftCircle — Full-Stack (Node.js + Express + MongoDB)

A single Node.js project containing **both** the backend API and the frontend
web app. Express serves the static frontend from `/public` alongside the
`/api/*` routes, so the whole thing runs from one `npm start` — ideal for
StackBlitz, Replit, or a single deploy target (Render, Railway, etc).

## Stack

- **Backend:** Express, MongoDB/Mongoose, JWT auth (`jsonwebtoken` + `bcryptjs`)
- **Frontend:** Plain HTML/CSS/JavaScript single-page app (no build step —
  served directly as static files, so it works instantly on StackBlitz)

## Run locally / on StackBlitz

```bash
npm install
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm start               # or: npm run dev (nodemon)
```

Then open the app at `http://localhost:5000` (StackBlitz opens this
automatically in the preview pane). The frontend and API share the same
origin and port — no separate frontend server needed.

**Database:** you need a reachable MongoDB instance. On StackBlitz, use a
free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and paste
its connection string into `MONGO_URI` in `.env` — StackBlitz's WebContainer
can't run MongoDB itself, only Node.

## Project structure

```
public/                 Frontend (served statically by Express)
  index.html             App shell — Home / Tutorials / Marketplace / Cart / Orders / Admin
  style.css               Terracotta craft theme, matches the pitch deck
  script.js                Fetch-based SPA logic, JWT stored in localStorage

config/db.js             Mongoose connection
models/                  User, Tutorial, Product, Cart, Order
middleware/               auth (JWT check + adminOnly), errorHandler
controllers/               business logic per module
routes/                     Express routers, mounted in server.js
utils/generateToken.js     JWT signing helper
server.js                   App entry point — mounts API routes, then serves public/
```

## What the frontend covers

- **Home** — landing page
- **Tutorials** — browse/search/filter, view detail, like, comment, publish (logged in)
- **Marketplace** — browse/search/filter, list a product (logged in), add to cart
- **Cart** — adjust quantity, remove items, checkout to create an order
- **Orders** — your own order history and status
- **Admin** — visible only to `role: "admin"` users: dashboard stats, order
  status updates, user activate/deactivate
- **Login / Sign Up** — JWT issued on success, stored in `localStorage`,
  attached to every authenticated request automatically

## API reference

All routes are mounted under `/api`.

### User Management — `/api/auth`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Log in, returns JWT |
| GET | `/api/auth/me` | user | Get own profile |
| PUT | `/api/auth/me` | user | Update name/bio/avatar |

### DIY Tutorial Management — `/api/tutorials`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/tutorials?search=&category=&page=&limit=` | — | List/search tutorials |
| GET | `/api/tutorials/:id` | — | Tutorial detail |
| POST | `/api/tutorials` | user | Upload a tutorial |
| PUT | `/api/tutorials/:id` | owner/admin | Edit tutorial |
| DELETE | `/api/tutorials/:id` | owner/admin | Delete tutorial |
| PUT | `/api/tutorials/:id/like` | user | Like / unlike |
| POST | `/api/tutorials/:id/comments` | user | Add comment |

### Marketplace — `/api/products`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products?search=&category=&page=&limit=` | — | Browse/search products |
| GET | `/api/products/:id` | — | Product detail |
| POST | `/api/products` | user | List a product for sale |
| PUT | `/api/products/:id` | owner/admin | Edit listing |
| DELETE | `/api/products/:id` | owner/admin | Remove listing |

### Shopping Cart — `/api/cart` (requires login)
| Method | Route | Description |
|---|---|---|
| GET | `/api/cart` | View cart |
| POST | `/api/cart` `{ productId, quantity }` | Add item |
| PUT | `/api/cart/:productId` `{ quantity }` | Update quantity |
| DELETE | `/api/cart/:productId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Order Management — `/api/orders` (requires login)
| Method | Route | Description |
|---|---|---|
| POST | `/api/orders` `{ shippingAddress }` | Checkout current cart to an order |
| GET | `/api/orders` | List own orders |
| GET | `/api/orders/:id` | Order detail (owner or admin) |

### Admin Panel — `/api/admin` (requires admin JWT)
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard counts |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id/status` `{ isActive }` | Activate/deactivate user |
| GET | `/api/admin/orders` | List all orders |
| PUT | `/api/admin/orders/:id/status` `{ status }` | Update order status |
| PUT | `/api/admin/products/:id/approval` `{ isApproved }` | Approve/hide a listing |

## Making your first admin

There's no public "become admin" endpoint by design. Register normally
through the UI, then set `role: "admin"` on that user directly in your
MongoDB collection (Atlas web UI, or `mongosh`/Compass). Log out and back in
afterward so the new role is reflected in the UI.

## Next steps

- **Image uploads:** `multer` is included as a dependency but not wired up.
  Add an `/api/uploads` route and swap the frontend's text-only forms for
  file inputs, or use a cloud storage SDK (S3, Cloudinary) for production.
- **Deploying beyond StackBlitz:** since the frontend is static files served
  by Express, this deploys as a single Node service anywhere (Render,
  Railway, Fly.io) — no separate frontend hosting needed.
