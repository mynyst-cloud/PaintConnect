// src/components/examples/PhotoUploadExample.jsx
// Voorbeeld: Hoe uploadPhotos te gebruiken in een component

import React, { useState } from 'react'
import { uploadPhotos, deletePhoto } from '@/lib/storage'
import { Camera, X, Loader2, Upload } from 'lucide-react'

export default function PhotoUploadExample() {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Handle file selection en upload
  const handleFileChange = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      // Upload alle geselecteerde foto's
      const urls = await uploadPhotos(files, 'project-uploads')
      
      // Voeg nieuwe URLs toe aan bestaande foto's
      setPhotos(prev => [...prev, ...urls])
      
      console.log('Upload succesvol:', urls)
    } catch (err) {
      console.error('Upload mislukt:', err)
      setError(err.message || 'Er ging iets mis bij het uploaden')
    } finally {
      setUploading(false)
      // Reset input zodat dezelfde file opnieuw kan worden geselecteerd
      e.target.value = ''
    }
  }

  // Verwijder foto
  const handleDelete = async (url, index) => {
    try {
      await deletePhoto(url, 'project-uploads')
      setPhotos(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Verwijderen mislukt:', err)
      setError('Kon foto niet verwijderen')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Foto Upload Voorbeeld</h2>

      {/* Upload Button */}
      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-emerald-600">Uploaden...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">Klik om foto's te uploaden</span>
          </>
        )}
      </label>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Geüploade foto's ({photos.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDelete(url, index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Output (voor debugging) */}
      {photos.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">URLs (voor opslag in database):</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(photos, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}


// ==============================================
// ANDERE VOORBEELDEN VAN GEBRUIK
// ==============================================

/*
// Voorbeeld 1: In een formulier met state
// ----------------------------------------
import { uploadPhotos } from '@/lib/storage'

function MyForm() {
  const [formData, setFormData] = useState({
    title: '',
    photos: [] // Array van URLs
  })

  const handlePhotoUpload = async (e) => {
    const urls = await uploadPhotos(e.target.files)
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...urls]
    }))
  }

  const handleSubmit = async () => {
    // Sla formData op in database
    await Project.create({
      title: formData.title,
      photos: formData.photos // URLs worden opgeslagen
    })
  }
}


// Voorbeeld 2: Met custom bucket
// ----------------------------------------
const urls = await uploadPhotos(files, 'damage-reports')


// Voorbeeld 3: Enkele foto uploaden
// ----------------------------------------
import { uploadPhoto } from '@/lib/storage'

const url = await uploadPhoto(file, 'avatars')


// Voorbeeld 4: Met progress feedback
// ----------------------------------------
const handleUpload = async (files) => {
  setStatus('Uploaden...')
  try {
    const urls = await uploadPhotos(files)
    setStatus(`${urls.length} foto's geüpload!`)
    return urls
  } catch (error) {
    setStatus('Upload mislukt')
    throw error
  }
}


// Voorbeeld 5: In een DailyUpdate component
// ----------------------------------------
const handleAddPhotos = async (e) => {
  const newUrls = await uploadPhotos(e.target.files)
  await DailyUpdate.create({
    project_id: projectId,
    description: 'Voortgang vandaag',
    photos: newUrls
  })
}
*/




