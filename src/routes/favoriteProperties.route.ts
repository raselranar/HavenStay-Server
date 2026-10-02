import { Router, type Request, type Response } from "express";
import { verifyToken } from "../lib/verifyToken.js";
import { verifyTenant } from "../lib/verifyUserRole.js";
import {
  favoritesCollection,
  propertiesCollection,
} from "../lib/databaseCollections.js";
import { ObjectId } from "mongodb";

const favoriteProperties = Router();

// Add to favorites
favoriteProperties.post(
  "/favorites",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const { userId, propertyId } = req.body;
    if (!userId || !propertyId) {
      return res.status(400).send({ message: "Missing userId or propertyId" });
    }
    const favorite = await favoritesCollection.insertOne({
      userId,
      propertyId,
      createdAt: new Date(),
    });
    // update property
    await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      { $inc: { favorites: 1 } },
    );
    res.send(favorite);
  },
);
// remove form favorites
favoriteProperties.delete(
  "/favorites",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).send({ message: "Missing userId or propertyId" });
    }
    const favorite = await favoritesCollection.deleteOne({
      _id: new ObjectId(_id),
    });
    res.send(favorite);
  },
);

// get favorites
favoriteProperties.get(
  "/favorites",
  verifyToken,
  verifyTenant,
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    const favoriteProperties = await favoritesCollection
      .aggregate([
        { $match: { userId: userId } },

        {
          $addFields: {
            propertyObjectId: { $toObjectId: "$propertyId" },
          },
        },

        {
          $lookup: {
            from: "properties",
            localField: "propertyObjectId",
            foreignField: "_id",
            as: "propertyDetails",
          },
        },

        { $unwind: "$propertyDetails" },

        {
          $project: {
            _id: "$_id",
            title: "$propertyDetails.title",
            type: "$propertyDetails.propertyType",
            location: "$propertyDetails.location",
            price: "$propertyDetails.rent",
            beds: "$propertyDetails.bedrooms",
            baths: "$propertyDetails.bathrooms",
          },
        },
      ])
      .toArray();
    // console.log(favoriteProperties);
    res.send(favoriteProperties);
  },
);

export default favoriteProperties;
