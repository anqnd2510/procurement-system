import { Role } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  role: Role;
}
