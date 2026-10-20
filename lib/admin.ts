import { redirect } from "next/navigation";
import { cache } from "react";
import { sessionClient } from "./supabase/server";

/** Garante usuário logado E cadastrado em admin_users. O RLS repete a checagem no banco. */
export const requireAdmin = cache(async () => {
  const supabase = await sessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, user, isAdmin: isAdmin === true };
});
