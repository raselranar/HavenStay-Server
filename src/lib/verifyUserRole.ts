import type { NextFunction, Request, Response } from "express";

// verify tenant
export const verifyTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req;
  if (user?.role !== "tenant") {
    return res.status(401).send({ message: "Unauthorized" });
  }
  next();
};
// verify owner
export const verifyOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req;
  if (user?.role !== "owner") {
    return res.status(401).send({ message: "Unauthorized" });
  }
  next();
};
// verify admin
export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req;
  if (user?.role !== "admin") {
    return res.status(401).send({ message: "Unauthorized" });
  }
  next();
};
