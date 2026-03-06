import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductStatus } from '@/types/product';

interface DbProduct {
  id: string;
  name: string;
  manufacturer: string;
  license_number: string | null;
  batch_number: string | null;
  license_date: string | null;
  trust_score: number | null;
  status: string;
  is_admin_verified: boolean | null;
  verification_source: string | null;
  verified_at: string | null;
  report_count: number | null;
  created_at: string;
  updated_at: string;
}

function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    manufacturer: row.manufacturer,
    licenseNumber: row.license_number || '',
    batchNumber: row.batch_number || '',
    licenseDate: row.license_date || '',
    trustScore: row.trust_score ?? 50,
    status: row.status as ProductStatus,
    isAdminVerified: row.is_admin_verified ?? false,
    verificationSource: (row.verification_source || 'system') as 'system' | 'admin' | 'user',
    verifiedAt: row.verified_at || undefined,
    reportCount: row.report_count ?? 0,
    createdAt: row.created_at,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data as DbProduct[]).map(toProduct);
      // Deduplicate by licenseNumber — keeps the newest row (query is DESC by created_at).
      // This guards against any existing duplicate rows already stored in the database.
      const seen = new Set<string>();
      return rows.filter((p) => {
        const key = p.licenseNumber || p.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Product, 'id' | 'createdAt'>) => {
      const { error } = await supabase.from('products').insert({
        name: p.name,
        manufacturer: p.manufacturer,
        license_number: p.licenseNumber && p.licenseNumber.trim() !== '' ? p.licenseNumber : null,
        batch_number: p.batchNumber && p.batchNumber.trim() !== '' ? p.batchNumber : null,
        license_date: p.licenseDate && p.licenseDate.trim() !== '' ? p.licenseDate : null,
        trust_score: p.trustScore,
        status: p.status,
        is_admin_verified: p.isAdminVerified,
        verification_source: p.verificationSource,
        verified_at: p.verifiedAt && p.verifiedAt.trim() !== '' ? p.verifiedAt : null,
        report_count: p.reportCount,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

interface ProductUpdatePayload {
  id: string;
  name?: string;
  manufacturer?: string;
  license_number?: string | null;
  batch_number?: string | null;
  license_date?: string | null;
  trust_score?: number;
  status?: string;
  is_admin_verified?: boolean;
  verification_source?: string;
  verified_at?: string | null;
  report_count?: number;
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdatePayload) => {
      // Clean empty strings to null for DATE/TIMESTAMPTZ columns
      const cleaned: Record<string, unknown> = { ...updates };
      if ('license_date' in cleaned && (cleaned.license_date === '' || cleaned.license_date === undefined)) cleaned.license_date = null;
      if ('verified_at' in cleaned && (cleaned.verified_at === '' || cleaned.verified_at === undefined)) cleaned.verified_at = null;
      if ('license_number' in cleaned && cleaned.license_number === '') cleaned.license_number = null;
      if ('batch_number' in cleaned && cleaned.batch_number === '') cleaned.batch_number = null;
      const { error } = await supabase.from('products').update(cleaned).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useFssaiLicenses() {
  return useQuery({
    queryKey: ['fssai_licenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fssai_licenses').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useBlacklistedBrands() {
  return useQuery({
    queryKey: ['blacklisted_brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blacklisted_brands').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFssaiLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (license: { license_number: string; company_name: string; address?: string; valid_until?: string; status?: string }) => {
      const { error } = await supabase.from('fssai_licenses').insert(license);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fssai_licenses'] }),
  });
}

export function useDeleteFssaiLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fssai_licenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fssai_licenses'] }),
  });
}

export function useAddBlacklistedBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (brand: { brand_name: string }) => {
      const { error } = await supabase.from('blacklisted_brands').insert(brand);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blacklisted_brands'] }),
  });
}

export function useDeleteBlacklistedBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blacklisted_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blacklisted_brands'] }),
  });
}

// ─── Fake Reports ────────────────────────────────────────────

export interface DbFakeReport {
  id: string;
  product_name: string;
  brand_name: string;
  reason: string;
  evidence: string | null;
  purchase_location: string | null;
  status: 'pending' | 'reviewed' | 'confirmed' | 'rejected';
  reporter_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFakeReports() {
  return useQuery({
    queryKey: ['fake_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fake_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbFakeReport[];
    },
  });
}

export function useSubmitFakeReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: {
      product_name: string;
      brand_name: string;
      reason: string;
      evidence?: string;
      purchase_location?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('fake_reports').insert({
        ...report,
        evidence: report.evidence || null,
        purchase_location: report.purchase_location || null,
        reporter_id: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fake_reports'] }),
  });
}

export function useUpdateFakeReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; admin_notes?: string; reviewed_by?: string; reviewed_at?: string }) => {
      const { error } = await supabase.from('fake_reports').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fake_reports'] }),
  });
}

export function useDeleteFakeReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fake_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fake_reports'] }),
  });
}

