import { signal } from '@lit-labs/signals';

export const fileToUpload = signal<File | null>(null);
export const fileUploadProgress = signal<number>(0);

export async function uploadFileTask(uploadIdentifier: string): Promise<string> {
  return new Promise((resolve) => {
    const file = fileToUpload.get();
    if (!file) {
      resolve('');
      return;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        fileUploadProgress.set(100);

        // Mock URL generation based on upload identifier and file
        const mockUrl = `https://cdn.example.com/${uploadIdentifier}/${file.name}`;
        resolve(mockUrl);
      } else {
        fileUploadProgress.set(progress);
      }
    }, 100);
  });
}