/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Look {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
  qr_code?: string; // Cacheable or calculated QR Code payload
}

export interface Comment {
  id: string;
  look_id: string;
  author_name: string;
  content: string;
  created_at: string;
  look_title?: string; // Optional join field for the Mural view
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}
