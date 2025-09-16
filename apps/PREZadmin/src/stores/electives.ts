// src/electivesService.ts

import { doc, getDocs, deleteDoc, updateDoc, collection } from '@firebase/firestore';
import { db } from '../firebase/firebase-config';
import { addDoc } from 'firebase/firestore';
import { fileToUpload } from './upload';

const electivesCollection = collection(db, 'electives');

export const createElectives = async (elective: { name?: string; screenShot?: string; creationDate?: string; points?: number }) => {
  // console.log('Document successfully written with ID:', elective);
  try {
    if (!elective.name || !elective.creationDate || typeof elective.points !== 'number') {
      throw new Error('Invalid elective data. Ensure name, dueDate, and points are provided.');
    }
    elective.screenShot = 'FIX ME';
    const docRef = await addDoc(electivesCollection, elective);
    // console.log('Document successfully written with ID:', docRef.id);
    // uploadedFileLink.set(""); FIX ME
    fileToUpload.set(null);
    return docRef;
  } catch (error) {
    // Handle Firestore and validation errors
    console.error('Error creating elective:', error);

    // Optionally, you can rethrow the error or handle it based on your needs
    throw new Error(`Failed to create elective: ${(error as Error).message}`);
  }
};

export const getElectives = async () => {
  const snapshot = await getDocs(electivesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const getElectiveSelect = async (): Promise<{ id: string; name: string }[]> => {
  const snapshot = await getDocs(electivesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
};

export const updateElectives = async (id: string, updatedData: { points: number }) => {
  const electiveDoc = doc(electivesCollection, id);
  return await updateDoc(electiveDoc, updatedData);
};

export const deleteElectives = async (id: string) => {
  const electiveDoc = doc(electivesCollection, id);
  return await deleteDoc(electiveDoc);
};
