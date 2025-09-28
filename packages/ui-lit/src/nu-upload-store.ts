// Stub upload store for nu-awr-upload-link component
import { signal } from '@lit-labs/signals';

// Mock file upload functionality
export const fileToUpload = signal<File | null>(null);
export const fileUploadProgress = signal<number>(0);

export async function uploadFileTask(uploadIdentifier: string): Promise<string> {
  // Mock upload process
  console.log('Mock uploading file with identifier:', uploadIdentifier);

  // Simulate upload progress
  for (let i = 0; i <= 100; i += 10) {
    fileUploadProgress.set(i);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Return mock URL
  const mockUrl = `https://example.com/uploads/${uploadIdentifier}/${Date.now()}.jpg`;
  console.log('Mock upload completed:', mockUrl);
  return mockUrl;
}