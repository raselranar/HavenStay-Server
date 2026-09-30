import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("haven-stay");
const propertiesCollection = database.collection("properties");
const favoritesCollection = database.collection("favorites");
const bookingCollection = database.collection("bookings");
const usersCollection = database.collection("user");

export {propertiesCollection, favoritesCollection, bookingCollection, usersCollection}
