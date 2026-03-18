/**
 * Configuración de Cloudinary para almacenamiento de imágenes
 * Las imágenes de perfil de socios se almacenan en Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary (variables de entorno)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Opciones de upload para imágenes de perfil de socios
 */
export const PROFILE_IMAGE_OPTIONS = {
  folder: 'hexodus/socios/perfiles',
  transformation: [
    {
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:good'
    }
  ],
  format: 'jpg'
};

/**
 * Opciones de upload para capturas faciales biométricas
 */
export const BIOMETRIC_IMAGE_OPTIONS = {
  folder: 'hexodus/socios/biometria',
  transformation: [
    {
      width: 800,
      height: 800,
      crop: 'limit',
      gravity: 'face',
      quality: 'auto:best'
    }
  ],
  format: 'jpg'
};

/**
 * Sube una imagen en formato base64 a Cloudinary
 * @param base64Image Imagen en formato base64
 * @param options Opciones de upload
 * @returns URL de la imagen subida
 */
export const uploadImage = async (
  base64Image: string,
  options = PROFILE_IMAGE_OPTIONS
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      ...options,
      resource_type: 'image'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ Error subiendo imagen a Cloudinary:', error);
    throw new Error('No se pudo subir la imagen');
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param publicId ID público de la imagen a eliminar
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Imagen eliminada:', publicId);
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    throw new Error('No se pudo eliminar la imagen');
  }
};

/**
 * Obtiene la URL de una imagen con transformaciones específicas
 * @param publicId ID público de la imagen
 * @param transformation Transformaciones a aplicar
 */
export const getImageUrl = (
  publicId: string,
  transformation?: Record<string, any>
): string => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformation
  });
};

/**
 * Genera un thumbnail de una imagen
 * @param publicId ID público de la imagen
 * @param size Tamaño del thumbnail (default: 150)
 */
export const getThumbnailUrl = (publicId: string, size: number = 150): string => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:good'
      }
    ]
  });
};

export default cloudinary;
