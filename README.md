# HavenStay Server

HavenStay Server is the backend API for the HavenStay property rental platform. It exposes Express routes for property browsing, favorites, bookings, owner analytics, and admin management.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB + MongoDB Driver
- JWT verification via `jose`
- Stripe integration support

## Project Structure

```bash
HavenStay-Server/
├── src/
│   ├── index.ts
│   ├── lib/
│   │   ├── databaseCollections.ts
│   │   ├── verifyToken.ts
│   │   └── verifyUserRole.ts
│   └── routes/
│       ├── admin.route.ts
│       ├── booking.route.ts
│       ├── favoriteProperties.route.ts
│       ├── owner.route.ts
│       └── properties.route.ts
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the server root:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
```

3. Start the development server:

```bash
npm run dev
```

4. Production build:

```bash
npm run build
npm start
```

## Base URL

```text
http://localhost:5000
```

## Postman Collection

A ready-to-import Postman collection is included at:

- [HavenStay-Server-post-c-pm-collection.json](HavenStay-Server-post-c-pm-collection.json)

Import it into Postman and set the `baseUrl`, `authToken`, `tenantId`, `ownerId`, `propertyId`, `bookingId`, and `favoriteId` variables before sending requests.

## Authentication

Most protected routes require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt>
```

The server verifies the JWT using the JWKS endpoint exposed by the client app:

```text
CLIENT_URL/api/auth/jwks
```

User roles enforced by the backend:

- `tenant`
- `owner`
- `admin`

## API Endpoints

### Health Check

#### GET /

Returns whether the server is running.

Response:

```json
{
  "status": true,
  "message": "server is running"
}
```

---

### Public Property Routes

#### GET /api/properties

Fetches approved properties with optional filters.

Query params:

- `search` – text search on location
- `type` – property type
- `sort` – `price_asc` or `price_desc`
- `minPrice` – minimum rent
- `maxPrice` – maximum rent

#### GET /api/properties/featured

Returns featured approved properties (limit: 6).

#### GET /api/properties/recent

Returns recently added approved properties (limit: 3).

#### GET /api/properties/details/:id

Requires: `tenant` role

Fetches a single property by ID and checks whether it is favorited for the supplied `userId`.

Query params:

- `userId` – current user ID

---

### Favorite Property Routes

These routes are mounted under `/api/properties`.

#### POST /api/properties/favorites

Requires: `tenant` role

Adds a property to a user's favorites list.

Body:

```json
{
  "userId": "user_id",
  "propertyId": "property_id"
}
```

#### DELETE /api/properties/favorites

Requires: `tenant` role

Removes a favorite entry by favorite document `_id`.

Body:

```json
{
  "_id": "favorite_document_id"
}
```

#### GET /api/properties/favorites

Requires: `tenant` role

Gets a user's favorite properties.

Query params:

- `userId`

Response includes populated property details such as title, location, price, bedrooms, and bathrooms.

---

### Booking Routes

These routes are mounted under `/api/properties`.

#### POST /api/properties/bookings

Requires: `tenant` role

Creates a booking record.

Body:

```json
{
  "userId": "tenant_user_id",
  "propertyId": "property_id",
  "rent": 1200,
  "bookingStatus": "pending"
}
```

#### GET /api/properties/bookings

Requires: `tenant` role

Gets bookings for the authenticated tenant.

Uses the token session user ID and optional query/body filters like `transactionId`.

#### GET /api/properties/bookings

Requires: `owner` role

Gets bookings related to the authenticated owner.

Query params:

- `stripId` – booking/stripe identifier

---

### Owner Routes

These routes are mounted under `/api/owner`.

#### POST /api/owner/properties

Requires: `owner` role

Adds a new property for the owner.

#### GET /api/owner/properties/:ownerId

Requires: `owner` role

Fetches all properties owned by a specific owner ID.

#### GET /api/owner/bookings/:ownerId

Requires: `owner` role

Fetches booking requests related to a specific owner ID.

#### PUT /api/owner/bookings

Requires: `owner` role

Updates a booking status.

Body:

```json
{
  "id": "booking_id",
  "bookingStatus": "confirmed"
}
```

#### PUT /api/owner/properties/:id

Requires: `owner` role

Updates a property by ID.

#### DELETE /api/owner/properties

Requires: `owner` role

Deletes a property by request body `id`.

Body:

```json
{
  "id": "property_id"
}
```

#### GET /api/owner/analytics

Requires: `owner` role

Returns ownership analytics including:

- `totalEarnings`
- `totalProperties`
- `totalBookings`
- `monthlyEarnings`

---

### Admin Routes

These routes are mounted under `/api/admin`.

#### GET /api/admin/users

Requires: `admin` role

Returns all users in the `user` collection.

#### PATCH /api/admin/users/:userId/role

Requires: `admin` role

Updates a user's role.

Body:

```json
{
  "role": "owner"
}
```

#### GET /api/admin/properties

Requires: `admin` role

Returns all properties.

#### PATCH /api/admin/properties/:propertyId/status

Requires: `admin` role

Updates a property status.

Body:

```json
{
  "status": "approved",
  "rejectionFeedback": "Reason if rejected"
}
```

#### PUT /api/admin/properties/:propertyId

Requires: `admin` role

Updates property details for a property ID.

#### DELETE /api/admin/properties/:propertyId

Requires: `admin` role

Deletes a property record.

#### GET /api/admin/transactions

Requires: `admin` role

Returns a summary of transactions with tenant name, owner name, property title, amount, date, and status.

---

### Tenant Review and Analytics

#### POST /api/properties/reviews

Requires: `tenant` role

Submits a property review.

Body:

```json
{
  "propertyId": "property_id",
  "rating": 5,
  "comment": "Great place to stay"
}
```

#### GET /api/properties/tenant-analytics

Requires: `tenant` role

Returns tenant statistics:

- `bookingsCount`
- `favoritesCount`
- `activeRentalsCount`

---

## MongoDB Collections

The server connects to the database named `haven-stay` and uses these collections:

- `properties`
- `favorites`
- `bookings`
- `user`

## Notes

- The app uses `cors()` to allow cross-origin requests.
- Authorization is role-based and is enforced with `verifyToken`, `verifyTenant`, `verifyOwner`, and `verifyAdmin` middleware.
- Property routes are split by role and feature area, while the main Express app mounts them in `src/index.ts`.
