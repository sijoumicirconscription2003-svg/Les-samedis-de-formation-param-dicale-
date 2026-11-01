import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isResponsable: boolean;
  loading: boolean;
  needsProfileCompletion: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (data: Omit<UserProfile, 'uid' | 'email' | 'role' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'sijoumicirconscription2003@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminFromDoc, setIsAdminFromDoc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user profile
  const fetchUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      // Check if user is in admins collection
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnapshot = await getDoc(adminRef);
      const isConfiguredAdmin = adminSnapshot.exists();
      setIsAdminFromDoc(isConfiguredAdmin);

      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // If super admin email or in admins, force role to admin
        if (isSuperAdmin || isConfiguredAdmin) {
          if (data.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin' });
            data.role = 'admin';
          }
        }
        setUserProfile(data);
      } else {
        // User profile does not exist yet
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
        setIsAdminFromDoc(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
    setIsAdminFromDoc(false);
  };

  const saveProfile = async (
    data: Omit<UserProfile, 'uid' | 'email' | 'role' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');

    const isSuperAdmin = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isSuperAdmin || isAdminFromDoc ? 'admin' : (userProfile?.role || 'participant');
    const now = new Date().toISOString();

    const profileData: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      matricule: data.matricule.trim(),
      fonction: data.fonction.trim(),
      etablissement: data.etablissement.trim(),
      telephone: data.telephone?.trim() || '',
      role,
      createdAt: userProfile?.createdAt || now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', currentUser.uid), profileData);
      // If superadmin, also persist in /admins collection
      if (isSuperAdmin) {
        await setDoc(doc(db, 'admins', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'admin',
          addedAt: now,
        });
      }
      setUserProfile(profileData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        updatedAt: new Date().toISOString(),
      });
      if (role === 'admin' || role === 'responsable') {
        await setDoc(doc(db, 'admins', userId), {
          uid: userId,
          role,
          addedAt: new Date().toISOString(),
        });
      } else {
        // Participant
        // Can optionally remove from admins
      }
      if (currentUser?.uid === userId && userProfile) {
        setUserProfile({ ...userProfile, role });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const isSuperAdmin = currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuperAdmin || isAdminFromDoc || userProfile?.role === 'admin';
  const isResponsable = isAdmin || userProfile?.role === 'responsable';

  const needsProfileCompletion = useMemo(() => {
    if (!currentUser) return false;
    if (!userProfile) return true;
    return !userProfile.nom || !userProfile.prenom || !userProfile.matricule || !userProfile.fonction || !userProfile.etablissement;
  }, [currentUser, userProfile]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isResponsable,
        loading,
        needsProfileCompletion,
        signInWithGoogle,
        signOut,
        saveProfile,
        updateUserRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
