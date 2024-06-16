import { Request, Response } from 'express';
import { updateProductStatusOnSuccess } from "../controller/productController";

export const handleWebhook = async (request: Request, response: Response) => {
  const event = request.body;
  console.log('event called', event);

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      await updateProductStatusOnSuccess(paymentIntent.metadata);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  response.json({ received: true });
};