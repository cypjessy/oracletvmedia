import { db } from "./firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, Timestamp,
} from "firebase/firestore";

export interface AlbumEntry {
  id: string;
  albumId: string;
  title: string;
  description: string;
  date: string;
  coverUrl: string;
  sortOrder: number;
  createdAt: Timestamp | null;
  photoCount: number;
}

const entriesCol = collection(db, "album_entries");

export async function getAllAlbumEntries(): Promise<AlbumEntry[]> {
  const snap = await getDocs(entriesCol);
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AlbumEntry));
  return entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export async function getAlbumEntries(albumId: string): Promise<AlbumEntry[]> {
  const q = query(entriesCol, where("albumId", "==", albumId));
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AlbumEntry));
  return entries.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export async function addAlbumEntry(data: Omit<AlbumEntry, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(entriesCol, { ...data, createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateAlbumEntry(id: string, data: Partial<AlbumEntry>): Promise<void> {
  await updateDoc(doc(entriesCol, id), data);
}

export async function deleteAlbumEntry(id: string): Promise<void> {
  await deleteDoc(doc(entriesCol, id));
}
