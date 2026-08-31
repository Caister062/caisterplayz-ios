import { pb } from './pocketbase';

/**
 * Upload a local file (Image or Video) to a PocketBase collection record
 * PocketBase serves files directly via:
 * `${pb.baseUrl}/api/files/${record.collectionId}/${record.id}/${record.media}`
 */
export async function uploadMediaToPocketBase(file, collectionName = 'posts', recordId) {
  if (!file) return { url: null, type: 'none', error: new Error('No file provided') };

  const isVideo = file.type.startsWith('video');
  const formData = new FormData();
  formData.append('media', file);

  try {
    const updatedRecord = await pb.collection(collectionName).update(recordId, formData);
    const fileUrl = pb.files.getUrl(updatedRecord, updatedRecord.media);

    return {
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      error: null,
    };
  } catch (error) {
    console.error('PocketBase Storage upload error:', error);
    return { url: null, type: isVideo ? 'video' : 'image', error };
  }
}
