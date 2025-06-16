import Link from "next/link";

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="mt-4 text-gray-700">Sorry, something went wrong.</p>
        <p className="mt-2 text-gray-500">Please try signing in again.</p>
        <Link
          href="/login"
          className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
