import { pb, getDatabase } from './pocketbase';

/**
 * Upload a local file (Image or Video) to PocketBase or store as Base64 Data URL locally
 */
export async function uploadMediaToPocketBase(file, collectionName = 'posts', recordId) {
  if (!file) return { url: null, type: 'none', error: new Error('No file provided') };

  const isVideo = file.type.startsWith('video');

  // If remote PocketBase is available
  if (pb && recordId) {
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
      console.warn('PocketBase upload failed, using client data URL:', error.message);
    }
  }

  // Convert to persistent Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        url: e.target.result,
        type: isVideo ? 'video' : 'image',
        error: null,
      });
    };
    reader.onerror = () => {
      resolve({
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        error: null,
      });
    };
    reader.readAsDataURL(file);
  });
}
