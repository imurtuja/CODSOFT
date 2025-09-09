export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    </div>
  )
}
