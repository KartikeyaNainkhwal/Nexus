import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            organizationId?: string | null;
            role?: string;
            avatar?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        organizationId?: string | null;
        role?: string;
        avatar?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        organizationId?: string | null;
        role?: string;
        avatar?: string | null;
    }
}
