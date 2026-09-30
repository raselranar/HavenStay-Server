import * as jose from "jose";
import "dotenv/config";

export const JWKS = jose.createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);


export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
   
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  // console.log("line:32", { token, JWKS });
  try {
    const { payload } = await jose.jwtVerify(token, JWKS);

    req.user = payload;
    // console.log("payload", payload);
    next();
  } catch (error) {
    // console.log(error);
    return res.status(401).send({ message: "Unauthorized" });
  }
};
