import { db } from "./firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, where, Timestamp,
} from "firebase/firestore";

// ========== TYPES ==========

export interface GalleryPhoto {
  id: string;
  title: string;
  description: string;
  category: string;
  cdnUrl: string;
  fileSize: number;
  width: number;
  height: number;
  isFeatured: boolean;
  altText: string;
  storagePath: string;
  uploadedAt: Timestamp | null;
  albumId?: string;
  entryId?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cdnUrl: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  storagePath?: string;
}

// ========== GALLERY PHOTOS ==========

const photosCol = collection(db, "gallery_photos");

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const q = query(photosCol, orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryPhoto));
}

export async function addGalleryPhoto(data: Omit<GalleryPhoto, "id" | "uploadedAt">): Promise<string> {
  const ref = await addDoc(photosCol, { ...data, uploadedAt: Timestamp.now() });
  return ref.id;
}

export async function updateGalleryPhoto(id: string, data: Partial<GalleryPhoto>): Promise<void> {
  await updateDoc(doc(photosCol, id), data);
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  await deleteDoc(doc(photosCol, id));
}

// ========== BANNERS ==========

const bannersCol = collection(db, "banners");

export async function getBanners(): Promise<Banner[]> {
  const q = query(bannersCol, orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
}

export async function addBanner(data: Omit<Banner, "id">): Promise<string> {
  const ref = await addDoc(bannersCol, data);
  return ref.id;
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<void> {
  await updateDoc(doc(bannersCol, id), data);
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(bannersCol, id));
}


