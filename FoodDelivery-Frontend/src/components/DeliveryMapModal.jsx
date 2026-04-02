import { X } from 'lucide-react'

const DeliveryMapModal = ({ pickup = '', destination = '', onClose }) => {
  const pickupSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(pickup || '')}`
  const destinationSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(destination || '')}`

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Delivery Route</h3>
            <p className="text-sm text-gray-500">Preview route and open in maps</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm font-medium">{pickup || 'Unknown pickup location'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium">{destination || 'Unknown destination'}</p>
          </div>

          <div className="mt-4 flex gap-3">
            <a
              href={destinationSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-linner-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold"
            >
              Open Destination in OSM
            </a>
            <a
              href={pickupSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold"
            >
              Open Pickup in OSM
            </a>
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-100">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryMapModal
