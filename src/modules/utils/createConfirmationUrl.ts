import { v4 } from "uuid";
import { confirmUserPrefix } from "../constants/redisPrefixes";

import { redisClient } from "../../redis";
export const createConfirmationUrl = async (userId: number) => {
  const { FRONTEND_HOST, FRONTEND_PORT } = process.env;
  const token = v4();
  await redisClient.set(confirmUserPrefix + token, userId, "ex", 60 * 60 * 24); //1day
  return `http://${FRONTEND_HOST}:${FRONTEND_PORT}/user/confirm/${token}`;
};
