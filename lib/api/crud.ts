import { createClient } from "@/lib/supabase/server";

export interface CrudService<T> {
  getAll(page: number, perPage: number): Promise<{ data: T[]; totalCount: number }>;
  getById(id: number): Promise<T | null>;
  create(data: Partial<T>): Promise<T[] | null>;
  update(id: number, data: Partial<T>): Promise<T[] | null>;
  delete(id: number): Promise<T[] | null>;
}

export function createCrudService<T extends { id: number }>(tableName: string): CrudService<T> {
  return {
    async getAll(page, perPage) {
      const supabase = await createClient();
      const { from, to } = getRange(page, perPage);

      const { count } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(error.message || `Failed to fetch ${tableName}`);
      }

      return { data: data || [], totalCount: count || 0 };
    },

    async getById(id) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(error.message || `Failed to fetch ${tableName}`);
      }

      return data;
    },

    async create(data) {
      const supabase = await createClient();

      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        throw new Error(error.message || `Failed to create ${tableName}`);
      }

      return created;
    },

    async update(id, data) {
      const supabase = await createClient();

      const { data: updated, error } = await supabase
        .from(tableName)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(error.message || `Failed to update ${tableName}`);
      }

      return updated;
    },

    async delete(id) {
      const supabase = await createClient();

      const { data: deleted, error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(error.message || `Failed to delete ${tableName}`);
      }

      return deleted;
    },
  };
}

function getRange(page: number, perPage: number) {
  return {
    from: (page - 1) * perPage,
    to: page * perPage - 1,
  };
}
