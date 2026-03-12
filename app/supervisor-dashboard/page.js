"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SupervisorDashboard(){

const router = useRouter()

const [records,setRecords] = useState([])
const [filteredData,setFilteredData] = useState([])

const [fields,setFields] = useState([])
const [jenisList,setJenisList] = useState([])

const [selectedField,setSelectedField] = useState("")
const [selectedJenis,setSelectedJenis] = useState("")
const [startDate,setStartDate] = useState("")
const [endDate,setEndDate] = useState("")

const [mtd,setMTD] = useState(0)
const [ytd,setYTD] = useState(0)
const [totalRecords,setTotalRecords] = useState(0)

const [analytics,setAnalytics] = useState({})

useEffect(()=>{
init()
subscribeRealtime()
},[])

async function init(){

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

const fieldSet = [...new Set(data.map(d=>d.field))]
const jenisSet = [...new Set(data.map(d=>d.jenis_pekerjaan))]

setFields(fieldSet)
setJenisList(jenisSet)

applyFilters(data)

}

function applyFilters(sourceData){

let data = sourceData ? [...sourceData] : [...records]

if(selectedField){
data = data.filter(d=>d.field === selectedField)
}

if(selectedJenis){
data = data.filter(d=>d.jenis_pekerjaan === selectedJenis)
}

if(startDate){
data = data.filter(d=>d.tanggal >= startDate)
}

if(endDate){
data = data.filter(d=>d.tanggal <= endDate)
}

setFilteredData(data)

calculateSummary(data)
calculateAnalytics(data)

}

useEffect(()=>{
applyFilters()
},[selectedField,selectedJenis,startDate,endDate])

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
setTotalRecords(data.length)

}

function calculateAnalytics(data){

const today = new Date().toISOString().split("T")[0]
const now = new Date()

const startMonth = new Date(now.getFullYear(),now.getMonth(),1)
const startYear = new Date(now.getFullYear(),0,1)

const result = {}

data.forEach(r=>{

if(!result[r.field]) result[r.field] = {}

if(!result[r.field][r.jenis_pekerjaan]){
result[r.field][r.jenis_pekerjaan] = {
hi:0,
mtd:0,
ytd:0
}
}

const date = new Date(r.tanggal)

if(r.tanggal === today){
result[r.field][r.jenis_pekerjaan].hi += Number(r.output_kerja)
}

if(date >= startMonth){
result[r.field][r.jenis_pekerjaan].mtd += Number(r.output_kerja)
}

if(date >= startYear){
result[r.field][r.jenis_pekerjaan].ytd += Number(r.output_kerja)
}

})

setAnalytics(result)

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
()=>{
loadData()
}
)
.subscribe()

}

async function handleLogout(){

await supabase.auth.signOut()
router.push("/login")

}

return(

<div className="min-h-screen bg-black text-white p-4 md:p-8">

{/* HEADER */}

<div className="flex justify-between items-center mb-6">

<div>
<h1 className="text-xl md:text-2xl font-bold">
Supervisor Monitoring Dashboard
</h1>

<p className="text-zinc-400 text-sm">
Mode: Read Only
</p>
</div>

<button
onClick={handleLogout}
className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
>
Logout
</button>

</div>

{/* FILTER */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">

<select
value={selectedField}
onChange={(e)=>setSelectedField(e.target.value)}
className="bg-zinc-900 border border-zinc-700 p-2 rounded"
>
<option value="">All Field</option>
{fields.map(f=>(
<option key={f}>{f}</option>
))}
</select>

<select
value={selectedJenis}
onChange={(e)=>setSelectedJenis(e.target.value)}
className="bg-zinc-900 border border-zinc-700 p-2 rounded"
>
<option value="">All Jenis</option>
{jenisList.map(j=>(
<option key={j}>{j}</option>
))}
</select>

<input
type="date"
value={startDate}
onChange={(e)=>setStartDate(e.target.value)}
className="bg-zinc-900 border border-zinc-700 p-2 rounded"
/>

<input
type="date"
value={endDate}
onChange={(e)=>setEndDate(e.target.value)}
className="bg-zinc-900 border border-zinc-700 p-2 rounded"
/>

</div>

{/* KPI */}

<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
<p className="text-xs text-zinc-400">MTD Output</p>
<p className="text-xl font-bold mt-1">{mtd}</p>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
<p className="text-xs text-zinc-400">YTD Output</p>
<p className="text-xl font-bold mt-1">{ytd}</p>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center col-span-2 md:col-span-1">
<p className="text-xs text-zinc-400">Total Records</p>
<p className="text-xl font-bold mt-1">{totalRecords}</p>
</div>

</div>

{/* OUTPUT ANALYTICS */}

<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">

<h2 className="font-semibold mb-4">
Output Monitoring
</h2>

{Object.keys(analytics).map(field=>(
<div key={field} className="mb-5">

<h3 className="font-bold text-green-400 mb-2">
{field}
</h3>

{Object.keys(analytics[field]).map(jenis=>{

const data = analytics[field][jenis]

return(

<div
key={jenis}
className="bg-zinc-800/40 rounded-lg p-3 mb-2"
>

<div className="font-medium mb-2">
{jenis}
</div>

<div className="flex gap-2 text-xs">

<span className="bg-zinc-700 px-2 py-1 rounded">
HI : {data.hi}
</span>

<span className="bg-zinc-700 px-2 py-1 rounded">
MTD : {data.mtd}
</span>

<span className="bg-zinc-700 px-2 py-1 rounded">
YTD : {data.ytd}
</span>

</div>

</div>

)

})}

</div>
))}

</div>

{/* MOBILE CARD LIST */}

<div className="block md:hidden">

<h2 className="font-semibold mb-3">
Monitoring Data
</h2>

{filteredData.map(item=>(

<div
key={item.id}
className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-3"
>

<div className="flex justify-between text-sm mb-2">
<span className="text-zinc-400">Tanggal</span>
<span>{item.tanggal}</span>
</div>

<div className="flex justify-between text-sm mb-2">
<span className="text-zinc-400">Jenis</span>
<span>{item.jenis_pekerjaan}</span>
</div>

<div className="flex justify-between text-sm mb-2">
<span className="text-zinc-400">Field</span>
<span className="font-semibold">{item.field}</span>
</div>

<div className="flex justify-between text-sm mb-2">
<span className="text-zinc-400">Output</span>
<span className="font-bold">{item.output_kerja}</span>
</div>

<div className="flex justify-between text-sm">
<span className="text-zinc-400">Satuan</span>
<span>{item.satuan_output}</span>
</div>

</div>

))}

</div>

{/* DESKTOP TABLE */}

<div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl p-6">

<h2 className="font-semibold mb-4 text-center">
Monitoring Data
</h2>

<table className="w-full text-sm text-center">

<thead className="border-b border-zinc-800 text-zinc-400">

<tr>

<th className="py-3">Tanggal</th>
<th>Jenis</th>
<th>Field</th>
<th>Output</th>
<th>Satuan</th>

</tr>

</thead>

<tbody>

{filteredData.map(item=>(
<tr
key={item.id}
className="border-b border-zinc-800 hover:bg-zinc-800/40"
>

<td className="py-3">{item.tanggal}</td>
<td>{item.jenis_pekerjaan}</td>
<td className="font-medium">{item.field}</td>
<td className="font-semibold">{item.output_kerja}</td>
<td>{item.satuan_output}</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

)

}