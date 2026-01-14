import { PrismaClient } from "@prisma-gen/client";
import "dotenv/config";

const prisma = new PrismaClient();

export { prisma };