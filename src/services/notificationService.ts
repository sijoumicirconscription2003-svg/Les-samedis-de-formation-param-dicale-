import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { NotificationItem, NotificationType } from '../types';

export function listenUserNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: NotificationItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NotificationItem, 'id'>),
      }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function sendNotification(
  userId: string,
  titre: string,
  message: string,
  type: NotificationType,
  formationId?: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      titre,
      message,
      type,
      formationId: formationId || '',
      lue: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      lue: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}
