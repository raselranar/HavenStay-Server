import { Router } from "express";
import { verifyToken } from "../lib/verifyToken.js";
import { verifyAdmin } from "../lib/verifyUserRole.js";
import {
  bookingCollection,
  propertiesCollection,
  usersCollection,
} from "../lib/databaseCollections.js";
import { ObjectId } from "mongodb";

const adminRoute = Router();

// get all users
adminRoute.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const users = await usersCollection.find().toArray();

  res.send(users);
});
// change users role
adminRoute.patch(
  "/users/:userId/role",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const userId = req.params.userId as string;
    const { role } = req.body;
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const updatedUser = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } },
    );
    res.send(updatedUser);
  },
);
// get all properties
adminRoute.get("/properties", verifyToken, verifyAdmin, async (req, res) => {
  const properties = await propertiesCollection.find().toArray();
  res.send(properties);
});

// change properties status
adminRoute.patch(
  "/properties/:propertyId/status",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const propertyId = req.params.propertyId as string;
    const { status, rejectionFeedback } = req.body;

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });

    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }

    const updateData: { status: string; rejectionFeedback?: any } = { status };

    if (rejectionFeedback) {
      updateData.rejectionFeedback = rejectionFeedback;
    } else {
      updateData.rejectionFeedback = "";
    }

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      { $set: updateData },
    );

    res.send(result);
  },
);

// update property details as admin
adminRoute.put(
  "/properties/:propertyId",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const propertyId = req.params.propertyId as string;
    const { _id, ...updateData } = req.body;

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });
    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      { $set: updateData },
    );
    res.send(result);
  },
);

adminRoute.delete(
  "/properties/:propertyId",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const propertyId = req.params.propertyId as string;

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(propertyId),
    });
    if (result.deletedCount < 1) {
      return res.status(404).send({ message: "Property not found" });
    }

    res.send(result);
  },
);
// transactions
adminRoute.get("/transactions", verifyToken, verifyAdmin, async (req, res) => {
  const bookings = await bookingCollection
    .find({ transactionId: { $exists: true } })
    .sort({ createdAt: -1 })
    .toArray();

  const transactions = bookings.map((booking) => ({
    id: booking.transactionId,
    tenantName: booking.userName || "Unknown Tenant",
    ownerName: booking.ownerInfo?.name || "Unknown Owner",
    propertyTitle: booking.title || "Unknown Property",
    amount: Number(booking.rent) || 0,
    date: booking.createdAt ? booking.createdAt.toISOString().slice(0, 10) : "",
    status:
      booking.paymentStatus === "paid"
        ? "completed"
        : booking.paymentStatus || "pending",
  }));

  res.send(transactions);
});

export default adminRoute;
