import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

// A simple loading component to show while Suspense is waiting
function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Loading...</p>
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
