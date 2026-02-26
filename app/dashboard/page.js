"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [selectedField, setSelectedField] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
        fetchData();
      }
    };
    getSession();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    setData(data || []);
    setFilteredData(data || []);
  };

  useEffect(() => {
    let filtered = [...data];

    if (selectedField)
      filtered = filtered.filter((i) => i.field === selectedField);

    if (selectedJenis)
      filtered = filtered.filter(
        (i) => i.jenis_pekerjaan === selectedJenis
      );

    if (startDate)
      filtered = filtered.filter(
        (i) => new Date(i.tanggal) >= new Date(startDate)
      );

    if (endDate)
      filtered = filtered.filter(
        (i) => new Date(i.tanggal) <= new Date(endDate)
      );

    setFilteredData(filtered);
  }, [selectedField, selectedJenis, startDate, endDate, data]);

  const handleDelete = async (id) => {
    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer]);
    saveAs(file, "Monitoring_Replanting.xlsx");
  };

  const now = new Date();
  const mtd = filteredData
    .filter((i) => {
      const d = new Date(i.tanggal);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, i) => sum + Number(i.output_kerja), 0);

  const ytd = filteredData
    .filter((i) => new Date(i.tanggal).getFullYear() === now.getFullYear())
    .reduce((sum, i) => sum + Number(i.output_kerja), 0);

  const uniqueFields = [...new Set(data.map((i) => i.field))];
  const uniqueJenis = [...new Set(data.map((i) => i.jenis_pekerjaan))];

  const outputPerJenis = uniqueJenis.map((jenis) => ({
    jenis,
    total: filteredData
      .filter((i) => i.jenis_pekerjaan === jenis)
      .reduce((sum, i) => sum + Number(i.output_kerja), 0),
  }));

  const outputPerField = uniqueFields.map((field) => ({
    field,
    total: filteredData
      .filter((i) => i.field === field)
      .reduce((sum, i) => sum + Number(i.output_kerja), 0),
  }));

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">

      {/* MOBILE HEADER */}
<div className="sm:hidden mb-4 flex gap-2">

  <button
    onClick={() => router.push("/input")}
    className="flex-1 bg-white text-black py-2 rounded-lg text-sm"
  >
    Input
  </button>

  <button
    onClick={handleExport}
    className="flex-1 bg-green-600 py-2 rounded-lg text-sm"
  >
    Export
  </button>

  <button
    onClick={handleLogout}
    className="flex-1 border border-red-500 text-red-400 py-2 rounded-lg text-sm"
  >
    Logout
  </button>

</div>

      {/* DESKTOP HEADER */}
      <div className="hidden sm:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Monitoring Replanting</h1>
          <p className="text-zinc-400 text-sm">{session?.user?.email}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push("/input")} className="bg-white text-black px-4 py-2 rounded">
            + Input Data
          </button>
          <button onClick={handleExport} className="bg-green-600 px-4 py-2 rounded">
            Export Excel
          </button>
          <button onClick={() => supabase.auth.signOut()} className="border border-red-500 text-red-500 px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="mb-6 space-y-3 sm:flex gap-3">
        <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded">
          <option value="">All Field</option>
          {uniqueFields.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>

        <select value={selectedJenis} onChange={(e) => setSelectedJenis(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded">
          <option value="">All Jenis</option>
          {uniqueJenis.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded" />
      </div>

      {/* MTD YTD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-zinc-400 text-sm">MTD</p>
          <h2 className="text-3xl font-bold">{mtd}</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-zinc-400 text-sm">YTD</p>
          <h2 className="text-3xl font-bold">{ytd}</h2>
        </div>
      </div>

      {/* OUTPUT PER JENIS */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="mb-4 font-semibold">📊 Output per Jenis</h2>
        {outputPerJenis.map((o) => (
          <div key={o.jenis} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{o.jenis}</span>
            <span>{o.total}</span>
          </div>
        ))}
      </div>

      {/* OUTPUT PER FIELD */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="mb-4 font-semibold">🗺 Output per Field</h2>
        {outputPerField.map((o) => (
          <div key={o.field} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{o.field}</span>
            <span>{o.total}</span>
          </div>
        ))}
      </div>

      {/* TABLE DESKTOP */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm border border-zinc-800">
          <thead>
            <tr className="bg-zinc-900">
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Jenis</th>
              <th className="p-3 text-left">Field</th>
              <th className="p-3 text-left">Output</th>
              <th className="p-3 text-left">Satuan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.field}</td>
                <td className="p-3">{item.output_kerja}</td>
                <td className="p-3">{item.satuan_output}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(item.id)} className="text-red-400">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}