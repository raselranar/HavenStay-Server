import { ObjectId } from "mongodb";
import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import { verifyToken } from "./lib/verifyToken.js";
import { verifyTenant, verifyOwner } from "./lib/verifyUserRole.js";
import propertiesRouter from "./routes/properties.route.js";
import adminRoute from "./routes/admin.route.js";
import {
  favoritesCollection,
  propertiesCollection,
  bookingCollection,
} from "./lib/databaseCollections.js";
import favoriteProperties from "./routes/favoriteProperties.route.js";
import bookingRoute from "./routes/booking.route.js";
import ownerRoute from "./routes/owner.route.js";
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    // starting
    app.get("/", (req: Request, res: Response) => {
      res.status(200).json({ status: true, message: "server is running" });
    });

    //  properties route
    app.use("/api/properties", propertiesRouter);

    // favorite properties route
    app.use("/api/properties", favoriteProperties);

    // booking route
    app.use("/api/properties", bookingRoute);

    // owner route
    app.use("/api/owner", ownerRoute);

    // admin routes
    app.use("/api/admin", adminRoute);

    // tenant review submission
    app.post(
      "/api/properties/reviews",
      verifyToken,
      verifyTenant,
      async (req: Request, res: Response) => {
        const { propertyId, rating, comment } = req.body;
        const user = req.body?.user;
        const reviewerId = user?.session?.userId;
        const reviewerName = user?.user?.name || "Unknown";
        const reviewerEmail = user?.user?.email || "";

        if (!propertyId || !rating || !comment) {
          return res
            .status(400)
            .send({ message: "propertyId, rating, and comment are required" });
        }

        const property = await propertiesCollection.findOne({
          _id: new ObjectId(propertyId),
        });
        if (!property) {
          return res.status(404).send({ message: "Property not found" });
        }

        const review = {
          reviewerId,
          reviewerName,
          reviewerEmail,
          rating: Number(rating),
          comment,
          date: new Date(),
        };

        await propertiesCollection.updateOne(
          { _id: new ObjectId(propertyId) },
          { $push: { reviews: review } as any },
        );

        res.send({ review });
      },
    );

    // get analytics data
    app.get(
      "/api/properties/tenant-analytics",
      verifyToken,
      verifyTenant,
      async (req: Request, res: Response) => {
        const { userId } = req.body?.session;
        if (!userId) {
          return res.status(400).send({ message: "Missing userId" });
        }
        const totalBookings = bookingCollection.countDocuments({
          userId: userId,
        });
        const totalFavorites = favoritesCollection.countDocuments({
          userId: userId,
        });
        const totalActiveRentals = bookingCollection.countDocuments({
          userId: userId,
          bookingStatus: "confirmed",
        });
        const [bookingsCount, favoritesCount, activeRentalsCount] =
          await Promise.all([
            totalBookings,
            totalFavorites,
            totalActiveRentals,
          ]);

        res.send({
          bookingsCount,
          favoritesCount,
          activeRentalsCount,
        });
      },
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {});
