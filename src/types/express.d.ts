import type { JWTPayload } from "jose";

interface CustomUserPayload extends JWTPayload {
  id?: string;
  role?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: CustomUserPayload;
    }
  }
}
export {};
