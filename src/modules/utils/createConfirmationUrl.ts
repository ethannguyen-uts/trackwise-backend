import { v4 } from "uuid";
import { confirmUserPrefix } from "../constants/redisPrefixes";

import { redisClient } from "../../redis";
export const createConfirmationUrl = async (userId: number) => {
  const token = v4();
  await redisClient.set(confirmUserPrefix + token, userId, "ex", 60 * 60 * 24); //1day
  return `http://localhost:3000/user/confirm/${token}`;
};
