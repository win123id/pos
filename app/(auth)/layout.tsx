import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <Image
        src="/auth.jpg"
        alt="Background"
        fill
        priority
        className="object-cover brightness-90"
      />
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
