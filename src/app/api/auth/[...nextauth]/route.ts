import NextAuth from "next-auth";

const handler = NextAuth({
  // Configure one or more authentication providers
  providers: [
    // ...add more providers here
  ],
});

export { handler as GET, handler as POST };
