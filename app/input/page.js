"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function InputPage() {

  const router = useRouter()
  const [user, setUser] = useState(null)

  const [tanggal, setTanggal] = useState("")
  const [jenis, setJenis] = useState("")
  const [field, setField] = useState("")
  const [output, setOutput] = useState("")
  const [file, setFile] = useState(null)

  const jenisPekerjaan = [
    "Felling","Chipping","Debolling","CECT",
    "Field Drain","Main Drain 1","Main Drain 2","Main Drain 3",
    "Cambering","Leveling","Parit Tengah",
    "Terrace","Lubang Tanam","Tanam Kelapa Sawit"
  ]

  const fields = [
    "F007","G006","H003","H004","H005","I005","J004"
  ]

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async () => {

    if (!tanggal || !jenis || !field || !output) {
      alert("Semua field wajib diisi")
      return
    }

    let fotoUrl = null

    if (file) {
      const fileName = `${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from("replanting-photos")
        .upload(fileName, file)

      if (!error) {
        fotoUrl = data.path
      }
    }

    const { error } = await supabase
      .from("replanting_records")
      .insert([
        {
          tanggal,
          jenis_pekerjaan: jenis,
          field,
          output_kerja: output,
          foto_url: fotoUrl,
          created_by: user.id
        }
      ])

    if (error) {
      alert("Gagal simpan: " + error.message)
    } else {

      // 🔥 KIRIM TELEGRAM
      const message = `
📢 MONITORING REPLANTING

Tanggal: ${tanggal}
Field: ${field}
Pekerjaan: ${jenis}
Output: ${output}
`

      await fetch("https://api.telegram.org/bot8643296694:AAGqMUW0OFx9Dmu8wb-CJBkyaGAQfpYhsRo/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: -5275404504,
          text: message
        })
      })

      alert("Data berhasil disimpan & Telegram terkirim")
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Input Monitoring Replanting</h2>

      <br />

      <input type="date" onChange={(e)=>setTanggal(e.target.value)} />
      <br /><br />

      <select onChange={(e)=>setJenis(e.target.value)}>
        <option value="">Pilih Jenis Pekerjaan</option>
        {jenisPekerjaan.map((j,i)=>(
          <option key={i}>{j}</option>
        ))}
      </select>

      <br /><br />

      <select onChange={(e)=>setField(e.target.value)}>
        <option value="">Pilih Field</option>
        {fields.map((f,i)=>(
          <option key={i}>{f}</option>
        ))}
      </select>

      <br /><br />

      <input
        type="number"
        placeholder="Output Kerja"
        onChange={(e)=>setOutput(e.target.value)}
      />

      <br /><br />

      <input
        type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Simpan
      </button>

    </div>
  )
}