import { doc, getDocs, deleteDoc, updateDoc, collection } from '@firebase/firestore';
import { db } from '../firebase/firebase-config';
import { addDoc } from 'firebase/firestore';

const projectCollection = collection(db, 'project');

export const createProject = async (project: {
  name: string;
  points: number;
  screenshotUrl: string;
  videoUrl: string;
  markdown: string;
  deploymentUrl: string;
  electives: string[];
}) => {
  try {

    const docRef = await addDoc(projectCollection, project);
    console.log('Document successfully written with ID:', docRef.id);
    return docRef;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error(`Failed to create project: ${(error as Error).message}`);
  }
};

export const getProject = async () => {
  const snapshot = await getDocs(projectCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateProject = async (
  id: string,
  updatedData: {
    name: string;
    points: number;
    screenshotUrl: string;
    videoUrl: string;
    markdown: string;
    deploymentUrl: string;
    electives: string[];
  },
) => {
  const projectDoc = doc(projectCollection, id);
  return await updateDoc(projectDoc, updatedData);
};

export const deleteProject = async (id: string) => {
  const projectDoc = doc(projectCollection, id);
  return await deleteDoc(projectDoc);
};
