import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
<div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center">
  <h1
    style={{
      fontSize: '6rem',
      fontWeight: 700,
      background: 'linear-gradient(90deg, #3b82f6, #9333ea)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    }}
  >
    404
  </h1>
  <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
  <p className="text-gray-600 mb-8">
    Oops! The page you&apos;re looking for doesn&apos;t exist or has been
    moved.
  </p>
  <Link href="/">
    <Button>Return Home</Button>
  </Link>
</div>
  );
}