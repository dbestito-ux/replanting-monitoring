"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SupervisorDashboard(){

const router = useRouter()

const [loading,setLoading] = useState(true)

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

setLoading(true)

const {data,error} = await supabase
.from("replanting_records")
.select("*")
.order("tanggal",{ascending:false})

if(error) return

setRecords(data)

const fieldSet=[...new Set(data.map(d=>d.field))]
const jenisSet=[...new Set(data.map(d=>d.jenis_pekerjaan))]

setFields(fieldSet)
setJenisList(jenisSet)

applyFilters(data)

setTimeout(()=>{
setLoading(false)
},500)

}

function applyFilters(source){

let data = source ? [...source] : [...records]

if(selectedField){
data=data.filter(d=>d.field===selectedField)
}

if(selectedJenis){
data=data.filter(d=>d.jenis_pekerjaan===selectedJenis)
}

if(startDate){
data=data.filter(d=>d.tanggal>=startDate)
}

if(endDate){
data=data.filter(d=>d.tanggal<=endDate)
}

setFilteredData(data)

calculateSummary(data)
calculateAnalytics(data)

}

useEffect(()=>{
applyFilters()
},[selectedField,selectedJenis,startDate,endDate])

function calculateSummary(data){

const now=new Date()

const startMonth=new Date(now.getFullYear(),now.getMonth(),1)
const startYear=new Date(now.getFullYear(),0,1)

let m=0
let y=0

data.forEach(r=>{

const d=new Date(r.tanggal)

if(d>=startMonth){
m+=Number(r.output_kerja)
}

if(d>=startYear){
y+=Number(r.output_kerja)
}

})

setMTD(m)
setYTD(y)
setTotalRecords(data.length)

}

function calculateAnalytics(data){

const today=new Date().toISOString().split("T")[0]

const now=new Date()

const startMonth=new Date(now.getFullYear(),now.getMonth(),1)
const startYear=new Date(now.getFullYear(),0,1)

const result={}

data.forEach(r=>{

if(!result[r.field]) result[r.field]={}

if(!result[r.field][r.jenis_pekerjaan]){
result[r.field][r.jenis_pekerjaan]={hi:0,mtd:0,ytd:0}
}

const d=new Date(r.tanggal)

if(r.tanggal===today){
result[r.field][r.jenis_pekerjaan].hi+=Number(r.output_kerja)
}

if(d>=startMonth){
result[r.field][r.jenis_pekerjaan].mtd+=Number(r.output_kerja)
}

if(d>=startYear){
result[r.field][r.jenis_pekerjaan].ytd+=Number(r.output_kerja)
}

})

setAnalytics(result)

}

function subscribeRealtime(){

supabase
.channel("live-replanting")
.on("postgres_changes",
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

<div className="min-h-screen bg-black text-white md:p-8 pb-24">

{/* MOBILE APP BAR */}

<div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex justify-between items-center">

<h1 className="text-sm font-semibold">
Replanting Monitoring
</h1>

<button
onClick={handleLogout}
className="text-red-400 text-sm active:scale-95 transition"
>
Logout
</button>

</div>

<div className="h-14 md:hidden"></div>

{/* DESKTOP HEADER */}

<div className="hidden md:flex justify-between items-center mb-6">

<div>
<h1 className="text-2xl font-bold">
Supervisor Monitoring Dashboard
</h1>
<p className="text-zinc-400">
Mode: Read Only
</p>
</div>

<button
onClick={handleLogout}
className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
>
Logout
</button>

</div>

{/* KPI */}

<div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 md:p-0">

{loading ? (

<>
<div className="h-20 bg-zinc-800 animate-pulse rounded-xl"></div>
<div className="h-20 bg-zinc-800 animate-pulse rounded-xl"></div>
<div className="h-20 bg-zinc-800 animate-pulse rounded-xl col-span-2 md:col-span-1"></div>
</>

) : (

<>
<div className="bg-zinc-900 rounded-xl p-4 transition hover:scale-[1.02]">
<p className="text-xs text-zinc-400">MTD Output</p>
<p className="text-xl font-bold">{mtd}</p>
</div>

<div className="bg-zinc-900 rounded-xl p-4 transition hover:scale-[1.02]">
<p className="text-xs text-zinc-400">YTD Output</p>
<p className="text-xl font-bold">{ytd}</p>
</div>

<div className="bg-zinc-900 rounded-xl p-4 col-span-2 md:col-span-1 transition hover:scale-[1.02]">
<p className="text-xs text-zinc-400">Total Records</p>
<p className="text-xl font-bold">{totalRecords}</p>
</div>
</>

)}

</div>

{/* MOBILE MONITORING */}

<div className="block md:hidden p-4">

{loading ? (

<>
<div className="h-24 bg-zinc-800 animate-pulse rounded-xl mb-3"></div>
<div className="h-24 bg-zinc-800 animate-pulse rounded-xl mb-3"></div>
<div className="h-24 bg-zinc-800 animate-pulse rounded-xl"></div>
</>

) : (

filteredData.map(item=>(

<div
key={item.id}
className="bg-zinc-900 rounded-xl p-4 mb-3 transition active:scale-95"
>

<div className="flex justify-between text-xs text-zinc-400 mb-1">
<span>{item.tanggal}</span>
<span>{item.field}</span>
</div>

<div className="font-semibold mb-2">
{item.jenis_pekerjaan}
</div>

<div className="flex justify-between text-sm">

<div>
<p className="text-xs text-zinc-400">Output</p>
<p className="font-bold">{item.output_kerja}</p>
</div>

<div>
<p className="text-xs text-zinc-400">Satuan</p>
<p>{item.satuan_output}</p>
</div>

</div>

</div>

))

)}

</div>

{/* DESKTOP TABLE */}

<div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">

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
className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
>

<td className="py-3">{item.tanggal}</td>
<td>{item.jenis_pekerjaan}</td>
<td>{item.field}</td>
<td>{item.output_kerja}</td>
<td>{item.satuan_output}</td>

</tr>

))}

</tbody>

</table>

</div>

{/* MOBILE BOTTOM NAV */}

<div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800">

<div className="grid grid-cols-3 text-center text-xs">

<div className="py-3 text-green-400">
Dashboard
</div>

<div className="py-3 text-zinc-400">
Monitoring
</div>

<div className="py-3 text-zinc-400">
Analytics
</div>

</div>

</div>

</div>

)

}