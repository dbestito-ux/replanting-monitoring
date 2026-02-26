"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [session, setSession] = useState(null);

  const [selectedField, setSelectedField] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getSession();
    fetchData();
  }, []);

  const getSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/login");
    } else {
      setSession(data.session);
    }
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    if (!error) setData(data);
  };

  // ==============================
  // FILTER LOGIC
  // ==============================

  const filteredData = data.filter((item) => {
    const matchField = selectedField
      ? item.field === selectedField
      : true;

    const matchJenis = selectedJenis
      ? item.jenis_pekerjaan === selectedJenis
      : true;

    const matchStart = startDate
      ? new Date(item.tanggal) >= new Date(startDate)
      : true;

    const matchEnd = endDate
      ? new Date(item.tanggal) <= new Date(endDate)
      : true;

    return matchField && matchJenis && matchStart && matchEnd;
  });

  // ==============================
  // MTD & YTD
  // ==============================

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mtdTotal = filteredData
    .filter((item) => {
      const date = new Date(item.tanggal);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, item) => sum + Number(item.output_kerja || 0), 0);

  const ytdTotal = filteredData
    .filter((item) => {
      const date = new Date(item.tanggal);
      return date.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + Number(item.output_kerja || 0), 0);

  // ==============================
  // SUMMARY PER JENIS
  // ==============================

  const summaryByJenis = filteredData.reduce((acc, item) => {
    const key = item.jenis_pekerjaan;
    acc[key] = (acc[key] || 0) + Number(item.output_kerja || 0);
    return acc;
  }, {});

  // ==============================
  // SUMMARY PER FIELD
  // ==============================

  const summaryByField = filteredData.reduce((acc, item) => {
    const key = item.field;
    acc[key] = (acc[key] || 0) + Number(item.output_kerja || 0);
    return acc;
  }, {});

  // ==============================
  // EXPORT EXCEL
  // ==============================

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Replanting Data");
    XLSX.writeFile(wb, "replanting-data.xlsx");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Monitoring Replanting
          </h1>
          <p className="text-zinc-400">
            {session?.user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Export Excel
          </button>
          <button
            onClick={handleLogout}
            className="border border-red-500 px-4 py-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="bg-zinc-900 p-2 rounded"
        >
          <option value="">All Field</option>
          {[...new Set(data.map((d) => d.field))].map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>

        <select
          value={selectedJenis}
          onChange={(e) => setSelectedJenis(e.target.value)}
          className="bg-zinc-900 p-2 rounded"
        >
          <option value="">All Jenis</option>
          {[...new Set(data.map((d) => d.jenis_pekerjaan))].map((jenis) => (
            <option key={jenis} value={jenis}>
              {jenis}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-zinc-900 p-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-zinc-900 p-2 rounded"
        />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-sm text-zinc-400">MTD</p>
          <h2 className="text-3xl font-bold">{mtdTotal}</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-sm text-zinc-400">YTD</p>
          <h2 className="text-3xl font-bold">{ytdTotal}</h2>
        </div>
      </div>

      {/* SUMMARY PER JENIS */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h3 className="text-lg font-semibold mb-4">
          📊 Output per Jenis
        </h3>
        {Object.entries(summaryByJenis).map(([jenis, total]) => (
          <div
            key={jenis}
            className="flex justify-between border-b border-zinc-700 py-2"
          >
            <span>{jenis}</span>
            <span>{total}</span>
          </div>
        ))}
      </div>

      {/* SUMMARY PER FIELD */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h3 className="text-lg font-semibold mb-4">
          🗺 Output per Field
        </h3>
        {Object.entries(summaryByField).map(([field, total]) => (
          <div
            key={field}
            className="flex justify-between border-b border-zinc-700 py-2"
          >
            <span>{field}</span>
            <span>{total}</span>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-zinc-800">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Jenis</th>
              <th className="p-3 text-left">Field</th>
              <th className="p-3 text-left">Output</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800"
              >
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.field}</td>
                <td className="p-3">{item.output_kerja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}