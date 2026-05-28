/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Look, Comment, SupabaseConfig } from '../types';

// Retrieve credentials from environment or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem('school_gallery_supabase_url') || '';
  const localKey = localStorage.getItem('school_gallery_supabase_key') || '';
  
  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;
  
  return {
    url,
    anonKey,
    isCustom: !!(localUrl && localKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (!url || !anonKey) {
    localStorage.removeItem('school_gallery_supabase_url');
    localStorage.removeItem('school_gallery_supabase_key');
  } else {
    localStorage.setItem('school_gallery_supabase_url', url.trim());
    localStorage.setItem('school_gallery_supabase_key', anonKey.trim());
  }
  // Refresh page to re-initialize client
  window.location.reload();
}

const config = getSupabaseConfig();
export const hasRealSupabase = !!(config.url && config.anonKey);

let supabase: SupabaseClient | null = null;
if (hasRealSupabase) {
  try {
    supabase = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// ==========================================
// SEED INITIAL DATA (in case of empty fallback states)
// ==========================================
const DEFAULT_LOOKS: Look[] = [
  {
    id: 'look-1',
    title: 'Look 01 - Cyber Glam Folk',
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'look-2',
    title: 'Look 02 - Reconstrução Urbana',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'look-3',
    title: 'Look 03 - Origami Minimalista',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'look-4',
    title: 'Look 04 - Avant-Garde Reciclado',
    image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    look_id: 'look-1',
    author_name: 'Mariana Silva',
    content: 'O acabamento metálico com bordados tradicionais ficou simplesmente impecável. Representa perfeitamente o choque de gerações!',
    created_at: new Date(Date.now() - 60000 * 20).toISOString(),
  },
  {
    id: 'comm-2',
    look_id: 'look-2',
    author_name: 'Gabriel Costa',
    content: 'Sensacional o uso de retalhos jeans! O conceito de sustentabilidade urbana tá fortíssimo nesse look.',
    created_at: new Date(Date.now() - 60000 * 15).toISOString(),
  },
  {
    id: 'comm-3',
    look_id: 'look-3',
    author_name: 'Carolina Mendes',
    content: 'A estrutura geométrica parece uma escultura em movimento. Parece desfile de Milão!',
    created_at: new Date(Date.now() - 60000 * 8).toISOString(),
  },
  {
    id: 'comm-4',
    look_id: 'look-4',
    author_name: 'Thiago Neves',
    content: 'Criatividade nota mil! Usar fiação desativada e plástico reciclado para criar alta-costura foi uma verdadeira obra de arte.',
    created_at: new Date(Date.now() - 60000 * 2).toISOString(),
  }
];

// Ensure fallback data is initialized in localStorage
if (!localStorage.getItem('fallback_looks')) {
  localStorage.setItem('fallback_looks', JSON.stringify(DEFAULT_LOOKS));
}
if (!localStorage.getItem('fallback_comments')) {
  localStorage.setItem('fallback_comments', JSON.stringify(DEFAULT_COMMENTS));
}

// Fallback logic helpers
const getLocalLooks = (): Look[] => JSON.parse(localStorage.getItem('fallback_looks') || '[]');
const saveLocalLooks = (looks: Look[]) => localStorage.setItem('fallback_looks', JSON.stringify(looks));

const getLocalComments = (): Comment[] => JSON.parse(localStorage.getItem('fallback_comments') || '[]');
const saveLocalComments = (comments: Comment[]) => localStorage.setItem('fallback_comments', JSON.stringify(comments));

// Setup simulated login sessions
if (!localStorage.getItem('fallback_admins')) {
  localStorage.setItem('fallback_admins', JSON.stringify([{ email: 'admin@desfile.com', password: 'admin' }]));
}

// ==========================================
// CORE API EXPORTS
// ==========================================

export const db = {
  // --- LOOKS OPERATION ---
  async getLooks(): Promise<Look[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('looks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching looks from Supabase:', error);
        throw error;
      }
      return data || [];
    } else {
      // Return local sorted looks
      return getLocalLooks().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addLook(title: string, file: File): Promise<Look> {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    if (supabase) {
      // 1. Upload to Supabase Storage Bucket 'gallery-images'
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error('Falha no upload do arquivo para o bucket gallery-images: ' + uploadError.message);
      }

      // 2. Obtain Public URL
      const { data: publicUrlData } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Não foi possível obter a URL pública para o arquivo enviado.');
      }

      const imageUrl = publicUrlData.publicUrl;

      // 3. Add record to 'looks' table
      const { data, error: insertError } = await supabase
        .from('looks')
        .insert({
          id,
          title,
          image_url: imageUrl,
          created_at: timestamp
        })
        .select()
        .single();

      if (insertError) {
        console.error('PostgreSQL Insert Error:', insertError);
        throw new Error('Falha ao registrar look no banco de dados: ' + insertError.message);
      }

      return data;
    } else {
      // Simulated version: convert file to Base64 block or use objectURL for temporary state,
      // or use a nice fashionable placeholder along with metadata.
      // To ensure images are persistent inside localStorage, we will load a gorgeous curated unsplash image related to modeling, or perform a Base64 converter.
      // Base64 storage of big images inside localStorage might exceed quota, so we fallback to a high-quality fashion Unsplash image or convert smaller images if possible.
      const fashionUnsplashImages = [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?auto=format&fit=crop&q=80&w=1200'
      ];
      
      const randomIndex = Math.floor(Math.random() * fashionUnsplashImages.length);
      const chosenUrl = fashionUnsplashImages[randomIndex];

      // Safe Base64 attempt inside fallback
      let imageUrl = chosenUrl;
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64Str = await base64Promise;
        // Only use Base64 if it's reasonably small (under 1.5MB) to avoid localStorage QuotaExceededError
        if (base64Str.length < 1500000) {
          imageUrl = base64Str;
        }
      } catch (e) {
        console.warn('Could not store full base64 file, falling back to fashion placeholder:', e);
      }

      const newLook: Look = {
        id,
        title,
        image_url: imageUrl,
        created_at: timestamp
      };

      const current = getLocalLooks();
      current.push(newLook);
      saveLocalLooks(current);

      // Trigger custom simulated change event
      window.dispatchEvent(new CustomEvent('local_looks_changed'));
      return newLook;
    }
  },

  async deleteLook(id: string): Promise<void> {
    if (supabase) {
      // First find look to get its image file path for cleanup
      const { data: look } = await supabase
        .from('looks')
        .select('image_url')
        .eq('id', id)
        .single();

      // Delete look row
      const { error: dbError } = await supabase
        .from('looks')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw dbError;
      }

      // Cleanup image from storage if it belongs to our bucket
      if (look?.image_url && look.image_url.includes('gallery-images')) {
        try {
          const urlParts = look.image_url.split('/gallery-images/');
          if (urlParts.length > 1) {
            const relativePath = urlParts[1];
            await supabase.storage.from('gallery-images').remove([relativePath]);
          }
        } catch (storageErr) {
          console.warn('Error deleting associated photo from Supabase Storage:', storageErr);
        }
      }
    } else {
      const current = getLocalLooks();
      const filtered = current.filter(l => l.id !== id);
      saveLocalLooks(filtered);
      
      // Also delete associated comments for clean DB cascading
      const comments = getLocalComments();
      const filteredComments = comments.filter(c => c.look_id !== id);
      saveLocalComments(filteredComments);

      window.dispatchEvent(new CustomEvent('local_looks_changed'));
      window.dispatchEvent(new CustomEvent('local_comments_changed'));
    }
  },

  // --- COMMENTS OPERATION ---
  async getComments(lookId?: string): Promise<Comment[]> {
    if (supabase) {
      let query = supabase
        .from('comments')
        .select(`
          id,
          look_id,
          author_name,
          content,
          created_at,
          looks (
            title
          )
        `);

      if (lookId) {
        query = query.eq('look_id', lookId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments from Supabase:', error);
        throw error;
      }

      // Format to support our comment structure
      return (data || []).map((c: any) => ({
        id: c.id,
        look_id: c.look_id,
        author_name: c.author_name,
        content: c.content,
        created_at: c.created_at,
        look_title: c.looks?.title || 'Look Desconhecido'
      }));
    } else {
      const comments = getLocalComments();
      const looks = getLocalLooks();
      const looksMap = new Map(looks.map(l => [l.id, l.title]));

      const filtered = lookId ? comments.filter(c => c.look_id === lookId) : comments;
      
      return filtered
        .map(c => ({
          ...c,
          look_title: looksMap.get(c.look_id) || 'Look Desconhecido'
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addComment(lookId: string, authorName: string, content: string): Promise<Comment> {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          id,
          look_id: lookId,
          author_name: authorName,
          content,
          created_at: timestamp
        })
        .select()
        .single();

      if (error) {
        console.error('Error leaving comment on Supabase:', error);
        throw error;
      }

      return data;
    } else {
      const newComment: Comment = {
        id,
        look_id: lookId,
        author_name: authorName,
        content,
        created_at: timestamp
      };

      const current = getLocalComments();
      current.push(newComment);
      saveLocalComments(current);

      // Distribute a custom synthetic event to emulate REALTIME instantly across any hook listeners
      const looks = getLocalLooks();
      const lookTitle = looks.find(l => l.id === lookId)?.title || 'Look Desconhecido';
      
      const broadcastData: Comment = {
        ...newComment,
        look_title: lookTitle
      };

      window.dispatchEvent(new CustomEvent('mural_comment_added', {
        detail: broadcastData
      }));
      window.dispatchEvent(new CustomEvent('local_comments_changed'));

      return broadcastData;
    }
  },

  // --- REALTIME SUBSCRIPTIONS ---
  subscribeToComments(onNewComment: (comment: Comment) => void): () => void {
    if (supabase) {
      // Real Supabase Realtime channel subscription
      const channel = supabase
        .channel('public:comments_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments'
          },
          async (payload: any) => {
            const newRow = payload.new;
            // Retrieve look title for context
            let lookTitle = 'Look Desconhecido';
            try {
              const { data: look } = await supabase!
                .from('looks')
                .select('title')
                .eq('id', newRow.look_id)
                .single();
              if (look) lookTitle = look.title;
            } catch (err) {
              console.warn('Error fetching look details for Realtime comment update:', err);
            }

            onNewComment({
              id: newRow.id,
              look_id: newRow.look_id,
              author_name: newRow.author_name,
              content: newRow.content,
              created_at: newRow.created_at,
              look_title: lookTitle
            });
          }
        )
        .subscribe();

      // Return unsubscribe closure
      return () => {
        supabase?.removeChannel(channel);
      };
    } else {
      // Graceful local emulation
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<Comment>;
        onNewComment(customEvent.detail);
      };

      window.addEventListener('mural_comment_added', handler);
      return () => {
        window.removeEventListener('mural_comment_added', handler);
      };
    }
  }
};

// ==========================================
// AUTHENTICATION OPERATIONS
// ==========================================
export const authService = {
  async getSessionUser(): Promise<any | null> {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } else {
      const serialized = localStorage.getItem('school_gallery_session_user');
      return serialized ? JSON.parse(serialized) : null;
    }
  },

  async login(emailStr: string, passwordStr: string): Promise<any> {
    const email = emailStr.trim().toLowerCase();
    const password = passwordStr.trim();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data.user;
    } else {
      // Fallback Admin Authenticator
      const adminList = JSON.parse(localStorage.getItem('fallback_admins') || '[]');
      const match = adminList.find((admin: any) => admin.email === email && admin.password === password);
      
      if (!match) {
        throw new Error('E-mail ou senha incorretos em modo de homologação. (Use o Cadastro se quiser registrar um novo administrador!)');
      }

      const userObject = { id: 'fallback-admin-id', email };
      localStorage.setItem('school_gallery_session_user', JSON.stringify(userObject));
      window.dispatchEvent(new CustomEvent('auth_state_changed'));
      return userObject;
    }
  },

  async signUp(emailStr: string, passwordStr: string): Promise<any> {
    const email = emailStr.trim().toLowerCase();
    const password = passwordStr.trim();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data.user;
    } else {
      // Auto register admin if it is fallback mode
      const adminList = JSON.parse(localStorage.getItem('fallback_admins') || '[]');
      const exists = adminList.some((admin: any) => admin.email === email);
      if (exists) {
        throw new Error('E-mail já cadastrado como administrador.');
      }

      adminList.push({ email, password });
      localStorage.setItem('fallback_admins', JSON.stringify(adminList));

      const userObject = { id: 'fallback-admin-id-' + Date.now(), email };
      localStorage.setItem('school_gallery_session_user', JSON.stringify(userObject));
      window.dispatchEvent(new CustomEvent('auth_state_changed'));
      return userObject;
    }
  },

  async logout(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('school_gallery_session_user');
      window.dispatchEvent(new CustomEvent('auth_state_changed'));
    }
  },

  subscribeToAuth(onChange: (user: any | null) => void): () => void {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        onChange(session?.user || null);
      });
      return () => {
        subscription.unsubscribe();
      };
    } else {
      const handler = () => {
        const serialized = localStorage.getItem('school_gallery_session_user');
        onChange(serialized ? JSON.parse(serialized) : null);
      };
      window.addEventListener('auth_state_changed', handler);
      return () => {
        window.removeEventListener('auth_state_changed', handler);
      };
    }
  }
};
