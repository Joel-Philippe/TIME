'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  deleteUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, storage, db } from '../components/firebaseConfig';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// 🔸 Interface du contexte
interface AuthContextType {
  user: User | null;
  signup: (
    email: string,
    password: string,
    displayName: string,
    photoFile?: File
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateProfilePhoto: (photoFile: File) => Promise<void>;
  reauthenticateUser: (password: string) => Promise<void>;
  acceptRequest: (request: { id: string }) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    photoFile?: File
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      let photoURL = '';

      if (photoFile) {
        const storageRef = ref(storage, `profileImages/${userCredential.user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(userCredential.user, {
        displayName,
        photoURL,
      });

      await auth.currentUser?.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        setUser({
          ...updatedUser,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
        });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw new Error('Erreur lors de la création du compte.');
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateDisplayName = async (displayName: string) => {
    try {
      if (!auth.currentUser) throw new Error('Utilisateur non connecté.');
      await updateProfile(auth.currentUser, { displayName });
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw new Error('Erreur lors de la mise à jour du pseudo.');
    }
  };

  const updateProfilePhoto = async (photoFile: File) => {
    try {
      if (!auth.currentUser) throw new Error('Utilisateur non connecté.');
      const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL });
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw new Error('Erreur lors de la mise à jour de la photo de profil.');
    }
  };

  const reauthenticateUser = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Utilisateur non connecté.');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const acceptRequest = async (request: { id: string }) => {
    try {
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, { status: 'accepted' });
    } catch (error) {
      console.error('Error accepting request:', error);
      throw new Error("Erreur lors de l'acceptation de la demande.");
    }
  };

  const deleteUserAccount = async () => {
    if (!auth.currentUser) throw new Error('Aucun utilisateur connecté.');

    const uid = auth.currentUser.uid;

    try {
      await deleteDoc(doc(db, 'users', uid));

      const collections = ['orders', 'messages', 'comments', 'ratings'];
      for (const col of collections) {
        const snapshot = await getDocs(query(collection(db, col), where('userId', '==', uid)));
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, col, docSnap.id));
        }
      }

      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error('Erreur lors de la suppression du compte : ', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        resetPassword,
        updateDisplayName,
        updateProfilePhoto,
        reauthenticateUser,
        acceptRequest,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
