import { db } from "./firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, Timestamp,
} from "firebase/firestore";

export interface Album {
  id: string;
  title: string;
  description: string;
  category: string;
  coverUrl?: string;
  sortOrder: number;
  createdAt: Timestamp | null;
  photoCount: number;
}

const albumsCol = collection(db, "albums");

export async function getAlbums(): Promise<Album[]> {
  const snap = await getDocs(albumsCol);
  const albums = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Album));
  return albums.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export async function addAlbum(data: Omit<Album, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(albumsCol, { ...data, createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateAlbum(id: string, data: Partial<Album>): Promise<void> {
  await updateDoc(doc(albumsCol, id), data);
}

export async function deleteAlbum(id: string): Promise<void> {
  await deleteDoc(doc(albumsCol, id));
}
