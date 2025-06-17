import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

// This is a simple UI to show while the main component is loading
function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}
