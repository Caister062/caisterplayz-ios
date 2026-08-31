import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload a local file (Image or Video) directly to Supabase Storage
 * @param {File | Blob} file - The file object from native picker or file input
 * @param {string} bucket - 'posts', 'avatars', or 'banners'
 * @param {string} userId - Auth user UUID
 * @returns {Promise<{ url: string, type: 'image' | 'video', error: Error | null }>}
 */
export async function uploadMediaToSupabase(file, bucket = 'posts', userId) {
  if (!file) return { url: null, type: 'none', error: new Error('No file provided') };

  const isVideo = file.type.startsWith('video');
  const fileExt = file.name ? file.name.split('.').pop() : isVideo ? 'mp4' : 'jpg';
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  if (!isSupabaseConfigured()) {
    // Return object URL for local offline testing if keys not set
    const objectUrl = URL.createObjectURL(file);
    return { url: objectUrl, type: isVideo ? 'video' : 'image', error: null };
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    return { url: null, type: isVideo ? 'video' : 'image', error };
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    type: isVideo ? 'video' : 'image',
    error: null,
  };
}
