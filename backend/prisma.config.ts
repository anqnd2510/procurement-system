import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

export default {
  schema: 'src/prisma/schema.prisma',
  migrations: {
    path: 'src/prisma/migrations',
  },
  datasource: {
    // Prisma Migrate needs a direct connection; application traffic keeps using DATABASE_URL.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
};
