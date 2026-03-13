import Razorpay from "razorpay";
import { env } from "./env";

// Single Razorpay instance shared across the app
const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

export default razorpay;
