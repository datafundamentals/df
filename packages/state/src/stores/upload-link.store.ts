import {computed, signal} from '@lit-labs/signals';
import type {UploadLinkConfig, UploadMode, MediaType} from '@df/types';

const modeSignal = signal<UploadMode>('none');
const linkUrlSignal = signal<string>('');
const fileNameSignal = signal<string>('Select File to Upload');
const isUploadingSignal = signal<boolean>(false);
const uploadProgressSignal = signal<number>(0);
const isValidSignal = signal<boolean>(false);
const mediaTypeSignal = signal<MediaType>('void');

export const uploadLinkState = computed<UploadLinkConfig>(() => ({
  mode: modeSignal.get(),
  linkUrl: linkUrlSignal.get(),
  fileName: fileNameSignal.get(),
  isUploading: isUploadingSignal.get(),
  uploadProgress: uploadProgressSignal.get(),
  isValid: isValidSignal.get(),
  mediaType: mediaTypeSignal.get(),
}));

export function setUploadMode(mode: UploadMode) {
  modeSignal.set(mode);

  if (mode === 'none') {
    resetUploadLink();
  }
}

export function setLinkUrl(url: string) {
  linkUrlSignal.set(url);
  validateUrl(url);
}

export function setUploadFile(file: File | null) {
  if (!file) {
    fileNameSignal.set('Select File to Upload');
    return;
  }

  fileNameSignal.set(file.name);
  detectMediaType(file.type);
}

export function setUploadProgress(progress: number) {
  uploadProgressSignal.set(Math.max(0, Math.min(100, progress)));
}

export function setIsUploading(uploading: boolean) {
  isUploadingSignal.set(uploading);
  if (uploading) {
    uploadProgressSignal.set(0);
  }
}

export function resetUploadLink() {
  linkUrlSignal.set('');
  fileNameSignal.set('Select File to Upload');
  isUploadingSignal.set(false);
  uploadProgressSignal.set(0);
  isValidSignal.set(false);
  mediaTypeSignal.set('void');
}

function validateUrl(url: string) {
  if (!url || url.trim() === '') {
    isValidSignal.set(false);
    return;
  }

  try {
    new URL(url);
    isValidSignal.set(true);

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) {
      mediaTypeSignal.set('image');
    } else if (lowerUrl.match(/\.(mp4|webm|ogg|avi)(\?|$)/)) {
      mediaTypeSignal.set('video');
    } else if (lowerUrl.match(/\.(pdf|doc|docx|txt)(\?|$)/)) {
      mediaTypeSignal.set('document');
    } else {
      mediaTypeSignal.set('void');
    }
  } catch {
    isValidSignal.set(false);
    mediaTypeSignal.set('void');
  }
}

function detectMediaType(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    mediaTypeSignal.set('image');
  } else if (mimeType.startsWith('video/')) {
    mediaTypeSignal.set('video');
  } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    mediaTypeSignal.set('document');
  } else {
    mediaTypeSignal.set('void');
  }
}