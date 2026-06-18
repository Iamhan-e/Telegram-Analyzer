declare namespace Express {
  interface Request {
    user?: {
      id: string; // internal users.id (UUID)
      authId: string; // Supabase auth.users.id (UUID)
      email: string;
    };
  }
}
