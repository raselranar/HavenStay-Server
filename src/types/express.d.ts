import { JWTPayload } from "jose";
declare global {
  namespace Express {
    interface Request {
      user?: { JWTPayload; role: string };
    }
  }
}
export {};
