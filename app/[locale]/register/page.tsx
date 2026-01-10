import RegisterClient from "./register-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default async function RegisterPage() {
  return <RegisterClient />;
}
