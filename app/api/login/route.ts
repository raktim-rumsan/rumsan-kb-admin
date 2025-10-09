import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null

    if (!email) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()

    // Check minimal allowlist table (id, email, created_at) for existence using service role client
    const { data: allowRow, error: allowError } = await admin
      .from("user_allowlist")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (allowError) {
      console.error("Allowlist query error:", allowError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!allowRow) {
      return NextResponse.json({ error: "Email is not authorized to sign in" }, { status: 403 })
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
