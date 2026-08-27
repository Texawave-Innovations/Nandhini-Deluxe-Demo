// Firebase Realtime Database Service Operations for Nandhini Deluxe HRMS

import { db } from './firebase';
import { ref, set, push, onValue, update, remove, get } from 'firebase/database';

export const firebaseDataService = {
  // Sync state from Firebase path with initial data fetch
  subscribeToPath: (path: string, callback: (data: any) => void) => {
    try {
      const dbRef = ref(db, path);
      return onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
          // If stored as object/map in Firebase, convert to array if expected
          const dataArray = Array.isArray(val) ? val : Object.values(val);
          callback(dataArray);
        }
      });
    } catch (error) {
      console.warn(`Firebase subscribe error at ${path}:`, error);
    }
  },

  // One-time fetch from Firebase
  fetchRecord: async (path: string) => {
    try {
      const dbRef = ref(db, path);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        return Array.isArray(val) ? val : Object.values(val);
      }
      return null;
    } catch (error) {
      console.warn(`Firebase fetch error at ${path}:`, error);
      return null;
    }
  },

  // Save/Set Record under Firebase path
  saveRecord: async (path: string, data: any) => {
    try {
      const dbRef = ref(db, path);
      await set(dbRef, data);
      return { success: true };
    } catch (error) {
      console.warn(`Firebase set at ${path} fallback to local store:`, error);
      return { success: false, error };
    }
  },

  // Push new item into collection
  pushRecord: async (path: string, data: any) => {
    try {
      const collectionRef = ref(db, path);
      const newRef = push(collectionRef);
      await set(newRef, { ...data, id: newRef.key });
      return { success: true, key: newRef.key };
    } catch (error) {
      console.warn(`Firebase push at ${path} fallback to local store:`, error);
      return { success: false, error };
    }
  },

  // Update existing record
  updateRecord: async (path: string, data: any) => {
    try {
      const dbRef = ref(db, path);
      await update(dbRef, data);
      return { success: true };
    } catch (error) {
      console.warn(`Firebase update at ${path} fallback:`, error);
      return { success: false, error };
    }
  },

  // Remove record
  removeRecord: async (path: string) => {
    try {
      const dbRef = ref(db, path);
      await remove(dbRef);
      return { success: true };
    } catch (error) {
      console.warn(`Firebase remove at ${path} fallback:`, error);
      return { success: false, error };
    }
  }
};
