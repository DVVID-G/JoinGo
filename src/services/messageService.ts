import { firebaseDb } from '../config/firebase';

const COLLECTION = 'meetings';

export interface OutgoingMessage {
  id: string;
  meetingId: string;
  senderUid: string;
  /** Optional display name of the sender */
  userName?: string;
  text: string;
  createdAt: string;
}

export async function saveMessage(meetingId: string, msg: OutgoingMessage) {
  const db = firebaseDb();
  if (!db) throw new Error('Firestore unavailable');
  await db.collection(COLLECTION).doc(meetingId).collection('messages').doc(msg.id).set(msg);
}

export async function getRecentMessages(meetingId: string, limit = 50) {
  const db = firebaseDb();
  if (!db) return [];
  const q = await db.collection(COLLECTION).doc(meetingId).collection('messages').orderBy('createdAt', 'desc').limit(limit).get();
  const items: OutgoingMessage[] = [];
  q.forEach(s => items.push(s.data() as OutgoingMessage));
  return items.reverse();
}
