"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SupervisorDashboard(){

const router = useRouter()

const [records,setRecords] = useState([])
const [mtd,setMTD] = useState(0)
const [ytd,setYTD] = useState(0)
const [totalRecords,setTotalRecords] = useState(0)
const [fieldSummary,setFieldSummary] = useState({})
const [jenisSummary,setJenisSummary] = useState({})

useEffect(()=>{
checkUser()
subscribeRealtime()
},[])

async function checkUser(){

const {data:{user}} = await supabase.auth.getUser()

if(!user){
router.push("/login")
return
}

const {data:profile} = await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single()

if(profile.role !== "supervisor"){
router.push("/dashboard")
return
}

loadData()

}

async function loadData(){

const {data,error} = await supabase
.from("replanting_records")
.select("*")
.order("tanggal",{ascending:false})

if(error) return

setRecords(data)
setTotalRecords(data.length)

calculateSummary(data)
calculateAnalytics(data)

}

function calculateSummary(data){

const now = new Date()

const startMonth = new Date(now.getFullYear(),now.getMonth(),1)
const startYear = new Date(now.getFullYear(),0,1)

let mtdTotal = 0
let ytdTotal = 0

data.forEach(r=>{

const d = new Date(r.tanggal)

if(d >= startMonth){
mtdTotal += Number(r.output_kerja)
}

if(d >= startYear){
ytdTotal += Number(r.output_kerja)
}

})

setMTD(mtdTotal)
setYTD(ytdTotal)

}

function calculateAnalytics(data){

const field = {}
const jenis = {}

data.forEach(r=>{

if(!field[r.field]) field[r.field] = 0
field[r.field] += Number(r.output_kerja)

if(!jenis[r.jenis_pekerjaan]) jenis[r.jenis_pekerjaan] = 0
jenis[r.jenis_pekerjaan] += Number(r.output_kerja)

})

setFieldSummary(field)
setJenisSummary(jenis)

}

function subscribeRealtime(){

supabase
.channel("replanting-live")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"replanting_records"
},
(payload)=>{
loadData()
}
)
.subscribe()

}

return(

<div className="min-h-screen bg-black text-white p-8">

<h1 className="text-2xl font-bold mb-2">
Supervisor Monitoring Dashboard
</h1>

<p className="text-zinc-400 mb-8">
Mode: Read Only
</p>

{/* KPI CARDS */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
<p className="text-zinc-400 text-sm">MTD Output</p>
<p className="text-2xl font-bold mt-2">{mtd}</p>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
<p className="text-zinc-400 text-sm">YTD Output</p>
<p className="text-2xl font-bold mt-2">{ytd}</p>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
<p className="text-zinc-400 text-sm">Total Records</p>
<p className="text-2xl font-bold mt-2">{totalRecords}</p>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
<p className="text-zinc-400 text-sm">Total Field</p>
<p className="text-2xl font-bold mt-2">
{Object.keys(fieldSummary).length}
</p>
</div>

</div>

{/* OUTPUT PER JENIS */}

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">

<h2 className="font-semibold mb-4">
📊 Output per Jenis
</h2>

{Object.keys(jenisSummary).map((key)=>(
<div
key={key}
className="flex justify-between border-b border-zinc-800 py-2"
>
<span>{key}</span>
<span>{jenisSummary[key]}</span>
</div>
))}

</div>

{/* OUTPUT PER FIELD */}

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">

<h2 className="font-semibold mb-4">
🗺 Output per Field
</h2>

{Object.keys(fieldSummary).map((key)=>(
<div
key={key}
className="flex justify-between border-b border-zinc-800 py-2"
>
<span>{key}</span>
<span>{fieldSummary[key]}</span>
</div>
))}

</div>

{/* TABLE */}

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

<h2 className="font-semibold mb-4">
Monitoring Data
</h2>

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead className="text-zinc-400 border-b border-zinc-800">

<tr>

<th className="text-left py-3">Tanggal</th>
<th className="text-left py-3">Jenis</th>
<th className="text-left py-3">Field</th>
<th className="text-left py-3">Output</th>
<th className="text-left py-3">Satuan</th>

</tr>

</thead>

<tbody>

{records.map((item)=>(
<tr
key={item.id}
className="border-b border-zinc-800 hover:bg-zinc-800/40"
>

<td className="py-3">
{item.tanggal}
</td>

<td>
{item.jenis_pekerjaan}
</td>

<td>
{item.field}
</td>

<td>
{item.output_kerja}
</td>

<td>
{item.satuan_output}
</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

</div>

)

}