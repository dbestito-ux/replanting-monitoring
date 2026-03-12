"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SupervisorDashboard(){

const router = useRouter()

const [records,setRecords] = useState([])
const [mtd,setMTD] = useState(0)
const [ytd,setYTD] = useState(0)

useEffect(()=>{
checkUser()
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

const {data} = await supabase
.from("replanting_records")
.select("*")
.order("tanggal",{ascending:false})

setRecords(data)

calculateSummary(data)

}

function calculateSummary(data){

const now = new Date()

const firstMonth = new Date(now.getFullYear(),now.getMonth(),1)
const firstYear = new Date(now.getFullYear(),0,1)

let mtdTotal = 0
let ytdTotal = 0

data.forEach(r=>{

const d = new Date(r.tanggal)

if(d >= firstMonth){
mtdTotal += Number(r.output_kerja)
}

if(d >= firstYear){
ytdTotal += Number(r.output_kerja)
}

})

setMTD(mtdTotal)
setYTD(ytdTotal)

}

return(

<div style={{padding:"40px"}}>

<h1>Supervisor Monitoring Dashboard</h1>

<p>Mode: Read Only</p>

<div style={{display:"flex",gap:"20px",marginTop:"20px"}}>

<div style={{
padding:"20px",
border:"1px solid #ddd",
borderRadius:"10px",
width:"200px"
}}>
<h3>MTD Output</h3>
<p>{mtd}</p>
</div>

<div style={{
padding:"20px",
border:"1px solid #ddd",
borderRadius:"10px",
width:"200px"
}}>
<h3>YTD Output</h3>
<p>{ytd}</p>
</div>

</div>

<h2 style={{marginTop:"40px"}}>Monitoring Data</h2>

<table border="1" cellPadding="8" style={{marginTop:"20px"}}>

<thead>
<tr>
<th>Tanggal</th>
<th>Jenis</th>
<th>Field</th>
<th>Output</th>
<th>Satuan</th>
</tr>
</thead>

<tbody>

{records.map((item,i)=>(
<tr key={i}>
<td>{item.tanggal}</td>
<td>{item.jenis_pekerjaan}</td>
<td>{item.field}</td>
<td>{item.output_kerja}</td>
<td>{item.satuan_output}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}