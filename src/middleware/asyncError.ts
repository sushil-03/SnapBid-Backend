import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/utils";
type MiddlewareFunction = (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;

export default (func: MiddlewareFunction) => (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {

  Promise.resolve(func(req, res, next)).catch(next);
};
