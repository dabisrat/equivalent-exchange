import { redirect } from "next/navigation";
import { getUser } from "@eq-ex/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  try {
    await getUser();
    // If we get here, user is authenticated, redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    console.error("User not authenticated:", error);
    // User is not authenticated, continue to auth pages
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">{children}</div>
    </div>
  );
}
