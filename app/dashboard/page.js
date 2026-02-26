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

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        fetchData();
      }
    };

    getSession();
  }, []);

  // =========================
  // FETCH DATA
  // =========================
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    if (!error) {
      setData(data);
      setFilteredData(data);
    }
  };

  // =========================
  // FILTER
  // =========================
  useEffect(() => {
    let filtered = [...data];

    if (selectedField) {
      filtered = filtered.filter((item) => item.field === selectedField);
    }

    if (selectedJenis) {
      filtered = filtered.filter(
        (item) => item.jenis_pekerjaan === selectedJenis
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (item) => new Date(item.tanggal) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (item) => new Date(item.tanggal) <= new Date(endDate)
      );
    }

    setFilteredData(filtered);
  }, [selectedField, selectedJenis, startDate, endDate, data]);

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // =========================
  // EXPORT
  // =========================
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "Monitoring_Replanting.xlsx");
  };

  // =========================
  // CALCULATIONS
  // =========================
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mtd = filteredData
    .filter((item) => {
      const d = new Date(item.tanggal);
      return (
        d.getMonth() === currentMonth && d.getFullYear() === currentYear
      );
    })
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  const ytd = filteredData
    .filter((item) => new Date(item.tanggal).getFullYear() === currentYear)
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  const uniqueFields = [...new Set(data.map((item) => item.field))];
  const uniqueJenis = [...new Set(data.map((item) => item.jenis_pekerjaan))];

  const outputPerJenis = uniqueJenis.map((jenis) => {
    const total = filteredData
      .filter((item) => item.jenis_pekerjaan === jenis)
      .reduce((sum, item) => sum + Number(item.output_kerja), 0);
    return { jenis, total };
  });

  const outputPerField = uniqueFields.map((field) => {
    const total = filteredData
      .filter((item) => item.field === field)
      .reduce((sum, item) => sum + Number(item.output_kerja), 0);
    return { field, total };
  });

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">

      {/* ===== MOBILE STICKY HEADER ===== */}
      <div className="sm:hidden sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-800 p-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">
            Monitoring Replanting
          </h1>
          <p className="text-xs text-zinc-400">
            {session?.user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-400 text-sm"
        >
          Logout
        </button>
      </div>

      {/* ===== DESKTOP HEADER (TIDAK BERUBAH) ===== */}
      <div className="hidden sm:flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Monitoring Replanting
          </h1>
          <p className="text-zinc-400 text-sm">
            {session?.user?.email}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/input")}
            className="bg-white text-black px-4 py-2 rounded"
          >
            + Input Data
          </button>

          <button
            onClick={handleExport}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Export Excel
          </button>

          <button
            onClick={handleLogout}
            className="border border-red-500 text-red-500 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== MOBILE FILTER BUTTON ===== */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowMobileFilter(!showMobileFilter)}
          className="w-full bg-zinc-900 border border-zinc-800 py-3 rounded-xl"
        >
          {showMobileFilter ? "Tutup Filter" : "Filter Data"}
        </button>
      </div>

      {/* ===== FILTER ===== */}
      <div className={`mb-6 space-y-3 sm:space-y-0 sm:flex gap-3 ${showMobileFilter ? "block" : "hidden"} sm:!flex`}>

        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded"
        >
          <option value="">All Field</option>
          {uniqueFields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>

        <select
          value={selectedJenis}
          onChange={(e) => setSelectedJenis(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded"
        >
          <option value="">All Jenis</option>
          {uniqueJenis.map((jenis) => (
            <option key={jenis} value={jenis}>
              {jenis}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded"
        />
      </div>

      {/* ===== MTD & YTD ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl shadow-md transition hover:scale-[1.02] duration-300">
          <p className="text-zinc-400 text-sm">MTD</p>
          <h2 className="text-3xl font-bold mt-2">{mtd}</h2>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl shadow-md transition hover:scale-[1.02] duration-300">
          <p className="text-zinc-400 text-sm">YTD</p>
          <h2 className="text-3xl font-bold mt-2">{ytd}</h2>
        </div>
      </div>

      {/* ===== MOBILE CARD VIEW ===== */}
      <div className="sm:hidden space-y-4">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md transition duration-300 hover:scale-[1.02]"
          >
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tanggal</span>
              <span>{item.tanggal}</span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Jenis</span>
              <span>{item.jenis_pekerjaan}</span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-400">Field</span>
              <span>{item.field}</span>
            </div>

            <div className="flex justify-between text-sm mt-2 font-semibold">
              <span>Output</span>
              <span>{item.output_kerja}</span>
            </div>

            <div className="flex justify-end gap-4 mt-3 text-sm">
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-400"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== DESKTOP TABLE ===== */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm border border-zinc-800">
          <thead>
            <tr className="bg-zinc-900 text-left">
              <th className="p-3">Tanggal</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Field</th>
              <th className="p-3">Output</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800 hover:bg-zinc-900"
              >
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.field}</td>
                <td className="p-3">{item.output_kerja}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== FLOATING INPUT BUTTON (MOBILE ONLY) ===== */}
      <button
        onClick={() => router.push("/input")}
        className="sm:hidden fixed bottom-6 right-6 bg-green-600 w-14 h-14 rounded-full text-2xl shadow-lg flex items-center justify-center transition hover:scale-110"
      >
        +
      </button>
    </div>
  );
}