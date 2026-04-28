// Purpose: Root page — immediately redirects users to /dashboard.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
