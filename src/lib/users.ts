import { db } from "@/lib/firebase";
import {
  getDocs, collection, query, orderBy, limit, startAfter, where,
  DocumentSnapshot, Timestamp,
} from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  role: string;
  phone?: string;
  is_verified?: boolean;
  created_at: number | Timestamp;
  last_seen?: number | Timestamp;
}

const usersCol = () => collection(db, "users");

export async function getUsersPage(
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{ users: UserProfile[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(usersCol(), orderBy("created_at", "desc"), limit(pageSize));
  if (lastDoc) q = query(usersCol(), orderBy("created_at", "desc"), startAfter(lastDoc), limit(pageSize));
  const snap = await getDocs(q);
  const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  const newLastDoc = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;
  return { users, lastDoc: newLastDoc };
}

export async function getAdminUsers(): Promise<UserProfile[]> {
  const q = query(usersCol(), where("role", "==", "admin"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}
