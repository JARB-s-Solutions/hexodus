/**
 * Configuración de Face-API.js para reconocimiento facial
 * 
 * Modelos utilizados:
 * - tinyFaceDetector: Detección de rostros (ligero)
 * - faceLandmark68Net: Detección de 68 puntos faciales
 * - faceRecognitionNet: Generación de descriptores faciales (128 dimensiones)
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Inicializa Face-API.js cargando los modelos necesarios
 * Los modelos se cargan desde la carpeta /models en public/
 */
export const initializeFaceAPI = async (): Promise<void> => {
  if (modelsLoaded) {
    console.log('✅ Face-API.js ya está inicializado');
    return;
  }

  try {
    const MODEL_URL = '/models';
    
    console.log('📦 Cargando modelos de Face-API.js...');
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('✅ Modelos de Face-API.js cargados exitosamente');
  } catch (error) {
    console.error('❌ Error cargando modelos de Face-API.js:', error);
    throw new Error('No se pudieron cargar los modelos de reconocimiento facial');
  }
};

/**
 * Detecta un rostro en una imagen y genera su descriptor facial
 * @param imageElement Elemento de imagen HTML o video
 * @returns Array de 128 números (descriptor facial) o null si no se detectó rostro
 */
export const detectFaceDescriptor = async (
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> => {
  try {
    // Asegurarse de que los modelos estén cargados
    if (!modelsLoaded) {
      await initializeFaceAPI();
    }

    // Detectar rostro con landmarks y descriptor
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.warn('⚠️ No se detectó ningún rostro en la imagen');
      return null;
    }

    // Convertir Float32Array a Array normal
    const descriptor = Array.from(detection.descriptor);
    
    console.log('✅ Descriptor facial generado:', {
      dimensiones: descriptor.length,
      confianza: detection.detection.score
    });

    return descriptor;
  } catch (error) {
    console.error('❌ Error detectando rostro:', error);
    return null;
  }
};

/**
 * Compara dos descriptores faciales usando distancia euclidiana
 * @param descriptor1 Descriptor facial 1 (128 números)
 * @param descriptor2 Descriptor facial 2 (128 números)
 * @returns Distancia entre 0 y 1 (0 = idénticos, 1 = completamente diferentes)
 */
export const compareFaceDescriptors = (
  descriptor1: number[],
  descriptor2: number[]
): number => {
  if (descriptor1.length !== 128 || descriptor2.length !== 128) {
    throw new Error('Los descriptores deben tener 128 dimensiones');
  }

  return faceapi.euclideanDistance(descriptor1, descriptor2);
};

/**
 * Valida si dos rostros pertenecen a la misma persona
 * @param descriptor1 Descriptor facial 1
 * @param descriptor2 Descriptor facial 2
 * @param threshold Umbral de similitud (default: 0.6)
 * @returns true si son la misma persona, false si no
 */
export const isSamePerson = (
  descriptor1: number[],
  descriptor2: number[],
  threshold: number = 0.6
): boolean => {
  const distance = compareFaceDescriptors(descriptor1, descriptor2);
  return distance < threshold;
};

/**
 * Calcula el porcentaje de confianza de que dos rostros sean iguales
 * @param descriptor1 Descriptor facial 1
 * @param descriptor2 Descriptor facial 2
 * @returns Porcentaje de confianza (0-100)
 */
export const getMatchConfidence = (
  descriptor1: number[],
  descriptor2: number[]
): number => {
  const distance = compareFaceDescriptors(descriptor1, descriptor2);
  const confidence = Math.max(0, (1 - distance) * 100);
  return Math.round(confidence * 100) / 100; // Redondear a 2 decimales
};

/**
 * Encuentra el mejor match de un rostro contra un array de descriptores
 * @param currentDescriptor Descriptor del rostro actual
 * @param savedDescriptors Array de descriptores guardados con IDs
 * @param threshold Umbral mínimo de similitud
 * @returns Objeto con el mejor match o null si no hay match
 */
export const findBestMatch = (
  currentDescriptor: number[],
  savedDescriptors: Array<{ id: number; descriptor: number[]; name: string }>,
  threshold: number = 0.6
): { id: number; name: string; confidence: number; distance: number } | null => {
  let bestMatch = null;
  let bestDistance = 1;

  for (const saved of savedDescriptors) {
    const distance = compareFaceDescriptors(currentDescriptor, saved.descriptor);
    
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = {
        id: saved.id,
        name: saved.name,
        confidence: getMatchConfidence(currentDescriptor, saved.descriptor),
        distance
      };
    }
  }

  // Solo retornar si cumple con el umbral
  if (bestMatch && bestDistance < threshold) {
    return bestMatch;
  }

  return null;
};

/**
 * Verifica si Face-API.js está inicializado
 */
export const isFaceAPIReady = (): boolean => {
  return modelsLoaded;
};

/**
 * Configuración recomendada para TinyFaceDetector
 */
export const FACE_DETECTOR_OPTIONS = {
  inputSize: 224,
  scoreThreshold: 0.5
};

/**
 * Umbral recomendado para validación de asistencia
 */
export const ATTENDANCE_THRESHOLD = 0.6;

/**
 * Umbral recomendado para registro (más estricto)
 */
export const REGISTRATION_THRESHOLD = 0.4;
