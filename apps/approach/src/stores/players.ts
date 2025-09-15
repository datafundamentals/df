import { getDocs, collection } from '@firebase/firestore';
import { db } from '../firebase/firebase-config';

const playersCollection = collection(db, 'players');

export const getPlayers = async () => {
  const snapshot = await getDocs(playersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
