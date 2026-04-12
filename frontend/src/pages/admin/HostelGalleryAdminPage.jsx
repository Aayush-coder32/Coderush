import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function HostelGalleryAdminPage() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'boys',
    description: '',
    capacity: 0,
    featured: false,
    warden: {
      name: '',
      phone: '',
      email: '',
    },
    location: {
      address: '',
    },
    amenities: [],
    rules: [],
  })

  const [amenityInput, setAmenityInput] = useState('')
  const [ruleInput, setRuleInput] = useState('')
  const [newImageFile, setNewImageFile] = useState(null)
  const [imageCaption, setImageCaption] = useState('')

  useEffect(() => {
    loadHostels()
  }, [])

  const loadHostels = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/campus/hostel-gallery')
      setHostels(data.data || [])
    } catch (err) {
      toast.error('Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditing(null)
    setFormData({
      name: '',
      type: 'boys',
      description: '',
      capacity: 0,
      featured: false,
      warden: { name: '', phone: '', email: '' },
      location: { address: '' },
      amenities: [],
      rules: [],
    })
    setAmenityInput('')
    setRuleInput('')
  }

  const handleEdit = (hostel) => {
    setEditing(hostel._id)
    setFormData(hostel)
    setAmenityInput('')
    setRuleInput('')
  }

  const handleCancel = () => {
    setEditing(null)
    setFormData({
      name: '',
      type: 'boys',
      description: '',
      capacity: 0,
      featured: false,
      warden: { name: '', phone: '', email: '' },
      location: { address: '' },
      amenities: [],
      rules: [],
    })
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Hostel name required')
      return
    }

    try {
      if (editing) {
        await client.patch(`/campus/hostel-gallery/${editing}`, formData)
        toast.success('Hostel updated')
      } else {
        await client.post('/campus/hostel-gallery', formData)
        toast.success('Hostel created')
      }
      loadHostels()
      handleCancel()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      })
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (idx) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== idx),
    })
  }

  const handleAddRule = () => {
    if (ruleInput.trim()) {
      setFormData({
        ...formData,
        rules: [...formData.rules, ruleInput.trim()],
      })
      setRuleInput('')
    }
  }

  const handleRemoveRule = (idx) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== idx),
    })
  }

  const handleUploadImage = async () => {
    if (!newImageFile) {
      toast.error('Please select an image')
      return
    }

    if (!editing) {
      toast.error('Save hostel first, then add images')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('image', newImageFile)
    formDataToSend.append('caption', imageCaption)

    try {
      const { data } = await client.post(
        `/campus/hostel-gallery/${editing}/image`,
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      setFormData(data.data)
      setNewImageFile(null)
      setImageCaption('')
      toast.success('Image added')
    } catch (err) {
      toast.error('Image upload failed')
    }
  }

  const handleDeleteImage = async (hostelId, idx) => {
    if (!window.confirm('Delete this image?')) return

    try {
      const { data } = await client.delete(
        `/campus/hostel-gallery/${hostelId}/image/${idx}`
      )
      if (editing === hostelId) {
        setFormData(data.data)
      }
      loadHostels()
      toast.success('Image deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hostel?')) return

    try {
      await client.delete(`/campus/hostel-gallery/${id}`)
      toast.success('Hostel deleted')
      loadHostels()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hostel Gallery</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage hostel information and gallery images
          </p>
        </div>
        {!editing && (
          <button
            onClick={handleCreateNew}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Hostel
          </button>
        )}
      </div>

      {editing !== null ? (
        // Edit Form
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            {editing ? 'Edit Hostel' : 'New Hostel'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Hostel Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Featured (show in gallery)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              />
            </div>

            {/* Warden Info */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Warden</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.warden?.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warden: { ...formData.warden, name: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.warden?.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warden: { ...formData.warden, phone: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.warden?.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warden: { ...formData.warden, email: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Location */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Location</h3>
              <input
                type="text"
                placeholder="Address"
                value={formData.location?.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
            </div>

            {/* Amenities */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Amenities</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add amenity"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
                <button
                  onClick={handleAddAmenity}
                  className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium dark:bg-slate-700"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.amenities?.map((a, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-sm dark:bg-slate-700"
                  >
                    {a}
                    <button
                      onClick={() => handleRemoveAmenity(idx)}
                      className="text-xs hover:font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Rules</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add rule"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
                <button
                  onClick={handleAddRule}
                  className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium dark:bg-slate-700"
                >
                  Add
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {formData.rules?.map((r, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span>- {r}</span>
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="text-xs text-red-600 hover:font-bold dark:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Images */}
            {editing && (
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Images</h3>

                <div className="mb-4 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImageFile(e.target.files?.[0])}
                    className="block w-full text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Image caption (optional)"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                  <button
                    onClick={handleUploadImage}
                    className="w-full rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Upload Image
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-300 dark:border-slate-700">
                      <img src={img.url} alt="Hostel" className="h-32 w-full object-cover rounded-t-lg" />
                      <div className="p-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{img.caption}</p>
                        <button
                          onClick={() => handleDeleteImage(editing, idx)}
                          className="mt-2 w-full rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <p className="text-center text-slate-500">Loading hostels...</p>
      ) : (
        // Hostels List
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((h) => (
            <div
              key={h._id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              {h.images?.[0] && (
                <img
                  src={h.images[0].url}
                  alt={h.name}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-semibold text-slate-900 dark:text-white">{h.name}</h3>
              <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{h.type} hostel</p>
              {h.capacity > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-300">Capacity: {h.capacity}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(h)}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(h._id)}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
