/**
 * SIMRS ZEN - Prisma v7 Configuration
 *
 * Prisma v7 memindahkan DATABASE_URL dan directUrl dari schema.prisma ke file ini.
 * Referensi: https://pris.ly/d/config-datasource
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
});
