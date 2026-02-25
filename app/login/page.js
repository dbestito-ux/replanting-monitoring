"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {

  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert("Login gagal: " + error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Login Monitoring Replanting</h2>

      <input
        placeholder="Email"
        onChange={(e)=>setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        {loading ? "Loading..." : "Login"}
      </button>
    </div>
  )
}