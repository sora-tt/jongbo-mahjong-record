export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
};

export type AppBindings = {
  Variables: {
    authUser: AuthUser;
  };
};
