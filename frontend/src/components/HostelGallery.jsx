import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function HostelGallery() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHostel, setSelectedHostel] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadHostels()
  }, [])

  const loadHostels = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/campus/hostel-gallery')
      setHostels(data.data || [])
      if (data.data?.[0]) {
        setSelectedHostel(data.data[0])
        setCurrentImageIndex(0)
      }
    } catch (err) {
      toast.error('Failed to load hostel gallery')
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = () => {
    if (!selectedHostel?.images?.length) return
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedHostel.images.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    if (!selectedHostel?.images?.length) return
    setCurrentImageIndex((prev) =>
      prev === selectedHostel.images.length - 1 ? 0 : prev + 1
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="font-medium text-slate-500">Loading gallery...</div>
      </div>
    )
  }

  if (!hostels.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">No hostels in gallery yet</p>
      </div>
    )
  }

  const currentImages = selectedHostel?.images || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hostel Gallery</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Explore our hostels and facilities
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Image Viewer */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {currentImages.length > 0 ? (
              <div className="relative bg-slate-100 dark:bg-slate-800">
                {/* Main Image */}
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={currentImages[currentImageIndex]?.url}
                    alt={`${selectedHostel.name} - Image ${currentImageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Navigation */}
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      aria-label="Previous image"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      aria-label="Next image"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                      {currentImageIndex + 1} / {currentImages.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <p className="text-slate-500">No images available</p>
              </div>
            )}

            {/* Image Caption */}
            {currentImages[currentImageIndex]?.caption && (
              <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {currentImages[currentImageIndex].caption}
                </p>
              </div>
            )}

            {/* Thumbnail Strip */}
            {currentImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                {currentImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-16 w-16 flex-shrink-0 rounded-lg border-2 overflow-hidden transition ${
                      idx === currentImageIndex
                        ? 'border-blue-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hostel List and Details */}
        <div className="space-y-4">
          {/* Hostel List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Hostels</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {hostels.map((h) => (
                <button
                  key={h._id}
                  onClick={() => {
                    setSelectedHostel(h)
                    setCurrentImageIndex(0)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedHostel?._id === h._id
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs opacity-75 capitalize">{h.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hostel Details */}
          {selectedHostel && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">About</h3>

              {selectedHostel.description && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{selectedHostel.description}</p>
              )}

              {selectedHostel.capacity > 0 && (
                <div className="mb-3 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">Capacity:</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-400">{selectedHostel.capacity} students</span>
                </div>
              )}

              {selectedHostel.warden?.name && (
                <div className="mb-3 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">Warden:</span>
                  <div className="mt-1 text-slate-600 dark:text-slate-400">
                    <div>{selectedHostel.warden.name}</div>
                    {selectedHostel.warden.phone && (
                      <div>{selectedHostel.warden.phone}</div>
                    )}
                    {selectedHostel.warden.email && (
                      <div>{selectedHostel.warden.email}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedHostel.amenities?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHostel.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedHostel.location?.address && (
                <div className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">Location:</span>
                  <div className="mt-1 text-slate-600 dark:text-slate-400">{selectedHostel.location.address}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
