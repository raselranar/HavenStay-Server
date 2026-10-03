import { Router, type Request, type Response } from "express";
import { verifyToken } from "../lib/verifyToken.js";
import { verifyOwner, verifyTenant } from "../lib/verifyUserRole.js";
import { bookingCollection } from "../lib/databaseCollections.js";

const bookingRoute = Router();
// add booking
bookingRoute.post(
  "/bookings",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const { userId, propertyId } = req.body;
    const data = req.body;

    // console.log(data);
    if (!userId || !propertyId) {
      return res.status(400).send({ message: "Missing userId or propertyId" });
    }
    const booking = await bookingCollection.insertOne({
      ...data,
      createdAt: new Date(),
    });
    res.send(booking);
  },
);

// get booking by
bookingRoute.get(
  "/bookings/tenant",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const query: { transactionId?: string; userId?: string } = {};
    const userId = req.user?.id;
    // const transactionId = req.body.transactionId;
    // index;
    // if (transactionId) query.transactionId = transactionId;

    if (!userId) {
      return res.status(400).send({ message: "Missing userId" });
    }
    query.userId = userId;
    const bookings = await bookingCollection.find(query).toArray();
    res.send(bookings);
  },
);
// get bookings
bookingRoute.get(
  "/bookings",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const query: { stripId?: string; userId?: string } = {};
    const { userId } = req.body.session;
    const stripId = req.query.stripId as string;
    if (stripId) query.stripId = stripId;

    if (!userId) {
      return res.status(400).send({ message: "Missing userId" });
    }
    query.userId = userId;
    const bookings = await bookingCollection.find(query).toArray();
    res.send(bookings);
  },
);

export default bookingRoute;
