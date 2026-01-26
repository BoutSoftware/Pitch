import { auth } from "@/config/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect('/exp/Auth/dashboard');
  } else {
    redirect('/exp/Auth/login');
  }
}