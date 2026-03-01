import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-2xl font-medium text-slate-800">
        Client Management & Appointment System
      </h1>
      <Link
        href="/booking"
        className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md border border-blue-600 hover:bg-blue-700 transition-colors"
      >
        Randevu Al
      </Link>
    </div>
  );
}
