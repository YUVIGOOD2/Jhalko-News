export type Role = 'none' | 'staff' | 'admin';
export type Status = 'draft' | 'pending' | 'published' | 'rejected';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body?: string;
  cover_url: string | null;
  video_url: string | null;
  category_id: number | null;
  tags: string[];
  author_id?: string;
  author_name: string;
  status: Status;
  is_breaking: boolean;
  is_featured: boolean;
  location: string | null;
  views: number;
  reject_reason?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  created_at: string;
}
