export type UploadMode = 'none' | 'upload' | 'url' | 'add';

export type MediaType = 'image' | 'document' | 'video' | 'void';

export interface UploadLinkConfig {
  mode: UploadMode;
  linkUrl: string;
  fileName: string;
  isUploading: boolean;
  uploadProgress: number;
  isValid: boolean;
  mediaType: MediaType;
}

export interface UploadLinkFile {
  file: File | null;
  name: string;
  type: string;
  size: number;
}

export interface UploadLinkChangeEvent {
  mode: UploadMode;
  linkUrl: string;
  isValid: boolean;
}