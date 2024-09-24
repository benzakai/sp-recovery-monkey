// // webhooks.ts
// import { Request, Response, NextFunction } from 'express';
// import crypto from 'crypto';

// export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
//   const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
//   const body = JSON.stringify(req.body);
//   const hmac = crypto
//     .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
//     .update(body, 'utf8')
//     .digest('base64');

//   if (hmac === hmacHeader) {
//     return next();
//   } else {
//     res.status(401).send('Webhook verification failed');
//   }
// }

// export function handleCheckoutWebhook(req: Request, res: Response) {
//   const checkout = req.body;
//   const abandoned = checkout.abandoned_checkout_url && checkout.updated_at;

//   if (abandoned) {
//     console.log('Abandoned checkout detected:', checkout);
//     // Add logic to send a WhatsApp message here

//     res.status(200).send('Webhook processed');
//   } else {
//     res.status(200).send('No abandoned checkout');
//   }
// }
