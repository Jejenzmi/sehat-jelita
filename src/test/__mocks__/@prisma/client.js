// Mock for @prisma/client - used in tests that import backend files
export const Prisma = {
  PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
    constructor(message, { code, clientVersion } = {}) {
      super(message);
      this.code = code;
      this.clientVersion = clientVersion;
    }
  },
  PrismaClientValidationError: class PrismaClientValidationError extends Error {},
};
