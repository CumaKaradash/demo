import { hash } from "bcryptjs";

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

async function seed() {
  const hashedPassword = await hash("admin123", 12);

  // Use fetch to call the Supabase REST API directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase env vars not set");
    process.exit(1);
  }

  // Update the admin user password with proper hash
  const res = await fetch(
    `${supabaseUrl}/rest/v1/users?email=eq.admin@psikolojiplatform.com`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ password: hashedPassword }),
    }
  );

  if (!res.ok) {
    console.error("Failed to update admin password:", await res.text());
    process.exit(1);
  }

  console.log("Admin password updated successfully with bcrypt hash");
  console.log("Login: admin@psikolojiplatform.com / admin123");
}

seed().catch(console.error);
