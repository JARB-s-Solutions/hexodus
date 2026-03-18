/**
 * API Route: Upload de imagen a Cloudinary
 * POST /api/upload-image
 * 
 * Recibe una imagen en base64 y la sube a Cloudinary
 * Retorna la URL de la imagen subida
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, PROFILE_IMAGE_OPTIONS, BIOMETRIC_IMAGE_OPTIONS } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, type = 'profile' } = body;

    // Validar que se envió una imagen
    if (!image) {
      return NextResponse.json(
        { error: 'Se requiere una imagen en formato base64' },
        { status: 400 }
      );
    }

    // Validar formato base64
    if (!image.startsWith('data:image')) {
      return NextResponse.json(
        { error: 'La imagen debe estar en formato base64 válido' },
        { status: 400 }
      );
    }

    // Seleccionar opciones según el tipo
    const options = type === 'biometric' 
      ? BIOMETRIC_IMAGE_OPTIONS 
      : PROFILE_IMAGE_OPTIONS;

    // Subir imagen a Cloudinary
    const result = await uploadImage(image, options);

    console.log('✅ Imagen subida a Cloudinary:', result.url);

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
      publicId: result.publicId
    });

  } catch (error) {
    console.error('❌ Error en upload de imagen:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al subir la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Configuración de Next.js App Router
// bodyParser se maneja automáticamente en App Router
// El tamaño máximo por defecto es suficiente para imágenes base64
export const maxDuration = 30; // Timeout de 30 segundos
export const dynamic = 'force-dynamic'; // No cachear responses
