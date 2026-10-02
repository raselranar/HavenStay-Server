import { Router, type Request, type Response } from "express";
import { verifyToken } from "../lib/verifyToken.js";
import { verifyOwner } from "../lib/verifyUserRole.js";
import {
  bookingCollection,
  propertiesCollection,
} from "../lib/databaseCollections.js";
import { ObjectId } from "mongodb";

const ownerRoute = Router();

// add property
ownerRoute.post(
  "/properties",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const data = req.body;
    const property = await propertiesCollection.insertOne({
      ...data,
      createdAt: new Date(),
    });
    res.send(property);
  },
);

// get properties
ownerRoute.get(
  "/properties/:ownerId",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const ownerId = req.params.ownerId;
    const query = {
      "ownerInfo.ownerId": ownerId,
    };
    const properties = await propertiesCollection.find(query).toArray();
    res.send(properties);
  },
);

// get owner booking requests
ownerRoute.get(
  "/bookings/:ownerId",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const ownerId = req.params.ownerId;
    const bookings = await bookingCollection
      .find({ "ownerInfo.ownerId": ownerId })
      .toArray();

    res.send(bookings);
  },
);

// update booking status for owner
ownerRoute.put(
  "/bookings",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const { id, bookingStatus } = req.body;
    if (!id || !bookingStatus) {
      return res.status(400).send({ message: "Missing id or bookingStatus" });
    }

    const booking = await bookingCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!booking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    const updated = await bookingCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { bookingStatus, updatedAt: new Date() } },
    );

    if (updated.matchedCount === 0) {
      return res.status(404).send({ message: "Booking not found" });
    }

    res.send({ success: true, bookingStatus });
  },
);

// update properties by id
ownerRoute.put(
  "/properties/:id",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { _id, ...updateData } = req.body;

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!property) {
      return res.status(404).send({ message: "Property not found" });
    }
    const updatedProperty = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );
    res.send(updatedProperty);
  },
);
// delete property by id
ownerRoute.delete(
  "/properties",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const id = req.body.id;

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
    });
    if (result.deletedCount < 1) {
      return res.status(404).send({ message: "Property not found" });
    }

    res.send(result);
  },
);

// get analytics data
ownerRoute.get(
  "/analytics",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    const { userId } = req.body?.session;
    if (!userId) {
      return res.status(400).send({ message: "Missing userId" });
    }
    const totalEarningsResult = await bookingCollection
      .aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$rent" } },
          },
        },
      ])
      .toArray();
    const totalEarningsSum = totalEarningsResult[0]?.total || 0;
    const propertiesCount = propertiesCollection.countDocuments({
      "ownerInfo.ownerId": userId,
    });
    const bookingsCount = bookingCollection.countDocuments({
      "ownerInfo.ownerId": userId,
    });
    const monthlyEarningsResult = await bookingCollection
      .aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
            },
            earnings: { $sum: { $toDouble: "$rent" } },
          },
        },
        {
          $sort: { "_id.month": 1 },
        },
      ])
      .toArray();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyEarnings: {
      month: string;
      earnings: number;
    }[] = monthNames.map((month) => ({
      month: month,
      earnings: 0,
    }));

    monthlyEarningsResult.forEach((item) => {
      const monthIndex = item._id.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyEarnings[monthIndex]!.earnings = item.earnings;
      }
    });

    const [totalEarnings, totalProperties, totalBookings] = await Promise.all([
      totalEarningsSum,
      propertiesCount,
      bookingsCount,
    ]);

    res.send({
      totalEarnings,
      totalProperties,
      totalBookings,
      monthlyEarnings,
    });
  },
);

ownerRoute.get(
  "/monthly-earnings",
  verifyToken,
  verifyOwner,
  async (req: Request, res: Response) => {
    try {
      //  res.status(200).json(formattedData);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

export default ownerRoute;
