import { Request } from "express";
import { UserType } from "../../models/userModel";

export type SEND_EMAIL = {
  to: string[], subject: string, text: string, html: string
}
export interface AuthenticatedRequest extends Request {
  query: { userType: 'seller' | 'buyer'; };
  user?: UserType;
}