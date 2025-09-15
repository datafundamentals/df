import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase-config';
import { signal } from '@lit-labs/signals';
import { isLoggedIn, userSignal } from './auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

export const fileToUpload = signal<File | null>(null);
export const fileUploadProgress = signal<number>(0);

// This method shouldnt be written to return a file uploaded link because this is a signal variabele. But for some reason the watch directive isn't picking up the change, so instead rewrote this to force things'
export const uploadFileTask = async (uploadIdentifier: string): Promise<string> => {
  const file = fileToUpload.get();
  if (!file || !isLoggedIn) {
    throw new Error('No file to upload or user is not logged in.');
  }

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `uploads/${userSignal.get()?.uid}/${uploadIdentifier}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes;
        fileUploadProgress.set(progress == 1 ? 0 : progress + 0.1); //always 10% high vs never showing
      },
      error => {
        console.error('Upload failed:', error);
        reject(error); // Reject promise on error
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const uidDoc = await doc(db, 'uploads', userSignal.get()?.uid);
          const uidLinks = collection(uidDoc, uploadIdentifier);
          await uidLinks.firestore;
          const docRef = await doc(uidLinks, file.name);
          const write = { link: downloadURL };
          await setDoc(docRef, write);
          resolve(downloadURL); // Resolve promise with download URL
        } catch (err) {
          console.error('Failed to get download URL:', err);
          reject(err); // Reject promise on URL retrieval failure
        }
      },
    );
  });
};

export const clearUploadObservables = () => {
  fileToUpload.set(null);
  // uploadedFileLink.set(""); FIX ME
  fileUploadProgress.set(0);
};
