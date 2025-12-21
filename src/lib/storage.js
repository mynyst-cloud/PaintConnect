// src/lib/storage.js
// Algemene foto upload functie voor Supabase Storage

import { supabase } from '@/lib/supabase'

/**
 * Upload meerdere foto's naar Supabase Storage
 * 
 * @param {FileList|File[]} files - FileList of array van File objecten
 * @param {string} bucket - Naam van de storage bucket (default: 'project-uploads')
 * @returns {Promise<string[]>} Array van public URLs
 * @throws {Error} Bij upload fouten
 * 
 * @example
 * // In een component:
 * const urls = await uploadPhotos(e.target.files, 'project-uploads')
 * console.log('Geüploade foto URLs:', urls)
 */
export async function uploadPhotos(files, bucket = 'project-uploads') {
  // Validatie
  if (!files || files.length === 0) {
    console.error('uploadPhotos: Geen bestanden meegegeven')
    throw new Error('Geen bestanden om te uploaden')
  }

  const uploadedUrls = []
  const fileArray = Array.from(files) // Convert FileList to Array

  console.log(`📤 Start upload van ${fileArray.length} bestand(en) naar bucket: ${bucket}`)

  // Upload bestanden één voor één (progressief)
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    
    try {
      // Genereer unieke bestandsnaam
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const randomId = Math.random().toString(36).substring(2, 15)
      const timestamp = Date.now()
      const uniqueFileName = `${randomId}_${timestamp}.${fileExtension}`

      console.log(`📁 [${i + 1}/${fileArray.length}] Uploading: ${file.name} → ${uniqueFileName}`)

      // Upload naar Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false // Niet overschrijven als bestand bestaat
        })

      if (uploadError) {
        console.error(`❌ Upload error voor ${file.name}:`, uploadError)
        throw new Error(`Upload mislukt voor ${file.name}: ${uploadError.message}`)
      }

      // Haal public URL op
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      if (!urlData?.publicUrl) {
        console.error(`❌ Kon public URL niet ophalen voor ${file.name}`)
        throw new Error(`Kon public URL niet ophalen voor ${file.name}`)
      }

      uploadedUrls.push(urlData.publicUrl)
      console.log(`✅ [${i + 1}/${fileArray.length}] Geüpload: ${urlData.publicUrl}`)

    } catch (error) {
      console.error(`❌ Fout bij uploaden van ${file.name}:`, error)
      throw error // Stop bij eerste fout
    }
  }

  console.log(`🎉 Alle ${uploadedUrls.length} bestanden succesvol geüpload`)
  return uploadedUrls
}

/**
 * Upload een enkele foto naar Supabase Storage
 * 
 * @param {File} file - File object
 * @param {string} bucket - Naam van de storage bucket (default: 'project-uploads')
 * @returns {Promise<string>} Public URL van de geüploade foto
 */
export async function uploadPhoto(file, bucket = 'project-uploads') {
  const urls = await uploadPhotos([file], bucket)
  return urls[0]
}

/**
 * Verwijder een foto uit Supabase Storage
 * 
 * @param {string} url - Public URL van de foto
 * @param {string} bucket - Naam van de storage bucket (default: 'project-uploads')
 * @returns {Promise<boolean>} True als succesvol verwijderd
 */
export async function deletePhoto(url, bucket = 'project-uploads') {
  try {
    // Extract bestandsnaam uit URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) {
      throw new Error('Kon bestandsnaam niet uit URL halen')
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      console.error('❌ Delete error:', error)
      throw error
    }

    console.log(`🗑️ Foto verwijderd: ${fileName}`)
    return true

  } catch (error) {
    console.error('❌ Fout bij verwijderen foto:', error)
    throw error
  }
}




