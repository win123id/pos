import { getRange } from "@/lib/api/pagination";
import { createClient } from "@/lib/supabase/server";

export interface CrudListResult<TRecord> {
  data: TRecord[];
  totalCount: number;
}

export interface CrudService<TRecord, TCreate = Partial<TRecord>, TUpdate = Partial<TRecord>> {
  list(page: number, perPage: number): Promise<CrudListResult<TRecord>>;
  create(data: TCreate): Promise<TRecord[]>;
  update(id: number, data: TUpdate): Promise<TRecord[]>;
  delete(id: number): Promise<TRecord[]>;
}

export function createCrudService<
  TRecord extends { id: number },
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
>(tableName: string, entityName: string): CrudService<TRecord, TCreate, TUpdate> {
  return {
    async list(page, perPage) {
      const supabase = await createClient();
      const { from, to } = getRange(page, perPage);

      const { count, error: countError } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw new Error(countError.message || `Failed to fetch ${entityName}`);
      }

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(error.message || `Failed to fetch ${entityName}`);
      }

      return { data: (data as TRecord[]) || [], totalCount: count || 0 };
    },

    async create(data) {
      const supabase = await createClient();

      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        throw new Error(error.message || `Failed to create ${entityName}`);
      }

      return (created as TRecord[]) || [];
    },

    async update(id, data) {
      const supabase = await createClient();

      const { data: updated, error } = await supabase
        .from(tableName)
        .update(data)
        .eq("id", id)
        .select();

      if (error) {
        throw new Error(error.message || `Failed to update ${entityName}`);
      }

      return (updated as TRecord[]) || [];
    },

    async delete(id) {
      const supabase = await createClient();

      const { data: deleted, error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        throw new Error(error.message || `Failed to delete ${entityName}`);
      }

      return (deleted as TRecord[]) || [];
    },
  };
}
