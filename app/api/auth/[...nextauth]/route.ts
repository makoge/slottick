import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// add more providers later (Facebook, etc.)

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
