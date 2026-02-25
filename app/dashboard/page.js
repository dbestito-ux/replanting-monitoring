"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard() {

  const router = useRouter()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [data, setData] = useState([])

  const [filterJenis, setFilterJenis] = useState("")
  const [filterField, setFilterField] = useState("")

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
    loadUser()
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [filterJenis, filterField, user])

  useEffect(() => {
    const channel = supabase
      .channel("realtime-replanting")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "replanting_records",
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadUser = async () => {
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      router.push("/login")
      return
    }

    setUser(authData.user)

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single()

    if (profile) setRole(profile.role)
  }

  const loadData = async () => {
    let query = supabase.from("replanting_records").select("*")

    if (filterJenis) query = query.eq("jenis_pekerjaan", filterJenis)
    if (filterField) query = query.eq("field", filterField)

    const { data } = await query.order("tanggal", { ascending: false })
    setData(data || [])
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const exportExcel = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    const formattedData = data.map((item) => ({
      Tanggal: item.tanggal,
      Jenis_Pekerjaan: item.jenis_pekerjaan,
      Field: item.field,
      Output: item.output_kerja
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Replanting")

    XLSX.writeFile(workbook, "Rekap_Replanting.xlsx")
  }

  const now = new Date()
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayYear = new Date(now.getFullYear(), 0, 1)

  const totalMTD = data
    .filter(d => new Date(d.tanggal) >= firstDayMonth)
    .reduce((sum, d) => sum + Number(d.output_kerja), 0)

  const totalYTD = data
    .filter(d => new Date(d.tanggal) >= firstDayYear)
    .reduce((sum, d) => sum + Number(d.output_kerja), 0)

  const groupedData = {}

  data.forEach((item) => {
    if (!groupedData[item.jenis_pekerjaan]) {
      groupedData[item.jenis_pekerjaan] = 0
    }
    groupedData[item.jenis_pekerjaan] += Number(item.output_kerja)
  })

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: "Total Output",
        data: Object.values(groupedData),
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }
    ]
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Dashboard Monitoring Replanting</h1>

      {user && (
        <>
          <p>Email: {user.email}</p>
          <p>Role: {role}</p>

          <br />

          <a href="/input">
            <button>Input Monitoring</button>
          </a>

          <button onClick={logout}>Logout</button>
          <button onClick={exportExcel}>Export Excel</button>

          <hr />

          <h3>Filter</h3>

          <select onChange={(e)=>setFilterJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            {jenisPekerjaan.map((j,i)=>(
              <option key={i}>{j}</option>
            ))}
          </select>

          <select onChange={(e)=>setFilterField(e.target.value)}>
            <option value="">Semua Field</option>
            {fields.map((f,i)=>(
              <option key={i}>{f}</option>
            ))}
          </select>

          <hr />

          <h3>Rekap</h3>
          <p>MTD: {totalMTD}</p>
          <p>YTD: {totalYTD}</p>

          <hr />

          <h3>Grafik Output per Jenis Pekerjaan</h3>
          <div style={{ width: "600px", height: "400px" }}>
            <Bar data={chartData} />
          </div>

          <hr />

          <h3>Data Monitoring</h3>

          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Field</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d,i)=>(
                <tr key={i}>
                  <td>{d.tanggal}</td>
                  <td>{d.jenis_pekerjaan}</td>
                  <td>{d.field}</td>
                  <td>{d.output_kerja}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </>
      )}

    </div>
  )
}