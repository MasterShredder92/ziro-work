import { redirect } from "next/navigation";

// app.zirowork.com/ → /login
// Old marketing home page removed.
// signup.zirowork.com is the public-facing home for pricing and signup.
export default function RootPage() {
  redirect("/login");
}
