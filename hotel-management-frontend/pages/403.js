export default function ForbiddenPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-600">403</h1>
        <p className="mt-4 text-xl">🚫 You are not authorized to view this page.</p>
      </div>
    </div>
  );
}

