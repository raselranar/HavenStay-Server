import { Router, type Request, type Response } from "express";
import { ObjectId, type Filter } from "mongodb";
import {
  bookingCollection,
  favoritesCollection,
  propertiesCollection,
} from "../lib/databaseCollections.js";
import { verifyToken } from "../lib/verifyToken.js";
import { verifyTenant } from "../lib/verifyUserRole.js";

const propertiesRouter = Router();

//  fetch all properties
propertiesRouter.get("/", async (req: Request, res: Response) => {
  const query: Filter<any> = { status: { $in: ["approved", "Approved"] } };
  if (req.query.search) {
    query.$or = [{ location: { $regex: req.query.search, $options: "i" } }];
  }
  if (req.query.type) {
    query.propertyType = req.query.type;
  }
  let sortOption = {};
  if (req.query.sort === "price_asc") {
    sortOption = { rent: 1 };
  } else if (req.query.sort === "price_desc") {
    sortOption = { rent: -1 };
  }
  if (req.query.minPrice) {
    const minPrice = Number(req.query.minPrice);
    // console.log(minPrice);
    query.rent = { $gte: minPrice };
  }
  if (req.query.maxPrice) {
    const maxPrice = Number(req.query.maxPrice);
    query.rent = { $lte: maxPrice };
  }

  // console.log(query);
  const properties = await propertiesCollection
    .find(query)
    .sort(sortOption)
    .toArray();
  res.send(properties);
});
// fetch single property by id
propertiesRouter.get(
  "/details/:id",
  verifyToken,
  verifyTenant,
  async (req, res) => {
    const { id } = req.params;
    const userId = req.query?.userId;
    // console.log("userId", userId);
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id as string),
    });
    const isFavorite = await favoritesCollection.findOne({
      userId,
      propertyId: id,
    });
    if (isFavorite && property) {
      property.isFavorite = true;
    }

    res.send(property);
  },
);

// Featured Properties
propertiesRouter.get("/featured", async (req, res) => {
  const featuredProperties = await propertiesCollection
    .find({ status: "Approved" })
    .limit(6)
    .toArray();
  res.send(featuredProperties);
});
// Recently Added Properties
propertiesRouter.get("/recent", async (req, res) => {
  const recentProperties = await propertiesCollection
    .find({ status: "Approved" })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();
  res.send(recentProperties);
});

// get analytics data
propertiesRouter.get(
  "/tenant-analytics",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const userId = req?.user?.id;
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
      await Promise.all([totalBookings, totalFavorites, totalActiveRentals]);

    res.send({
      bookingsCount,
      favoritesCount,
      activeRentalsCount,
    });
  },
);

export default propertiesRouter;
