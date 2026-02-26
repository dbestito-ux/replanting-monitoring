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

  const [filterField, setFilterField] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ==========================
  // AUTH CHECK
  // ==========================
  useEffect(() => {
    const checkSession = async () => {
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

    checkSession();
  }, []);

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    if (!error) {
      setData(data);
    }
  };

  // ==========================
  // LOGOUT (FIX ERROR BUILD)
  // ==========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async (id) => {
    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  // ==========================
  // FILTER LOGIC
  // ==========================
  const filteredData = data.filter((item) => {
    const matchField = filterField ? item.field === filterField : true;
    const matchJenis = filterJenis
      ? item.jenis_pekerjaan === filterJenis
      : true;

    const matchStart = startDate ? item.tanggal >= startDate : true;
    const matchEnd = endDate ? item.tanggal <= endDate : true;

    return matchField && matchJenis && matchStart && matchEnd;
  });

  // ==========================
  // MTD & YTD
  // ==========================
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const mtd = filteredData
    .filter((item) => {
      const d = new Date(item.tanggal);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  const ytd = filteredData
    .filter((item) => {
      const d = new Date(item.tanggal);
      return d.getFullYear() === year;
    })
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  // ==========================
  // GROUPING
  // ==========================
  const outputPerJenis = {};
  const outputPerField = {};

  filteredData.forEach((item) => {
    outputPerJenis[item.jenis_pekerjaan] =
      (outputPerJenis[item.jenis_pekerjaan] || 0) +
      Number(item.output_kerja);

    outputPerField[item.field] =
      (outputPerField[item.field] || 0) +
      Number(item.output_kerja);
  });

  // ==========================
  // EXPORT EXCEL
  // ==========================
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(fileData, "monitoring.xlsx");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Monitoring Replanting
          </h1>
          <p className="text-gray-400 text-sm">
            {session.user.email}
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

      {/* FILTER */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterField}
          onChange={(e) => setFilterField(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        >
          <option value="">All Field</option>
          {[...new Set(data.map((item) => item.field))].map((field) => (
            <option key={field}>{field}</option>
          ))}
        </select>

        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        >
          <option value="">All Jenis</option>
          {[...new Set(data.map((item) => item.jenis_pekerjaan))].map(
            (jenis) => (
              <option key={jenis}>{jenis}</option>
            )
          )}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded"
        />
      </div>

      {/* MTD YTD */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 p-6 rounded">
          <p className="text-gray-400">MTD</p>
          <h2 className="text-3xl font-bold">{mtd}</h2>
        </div>
        <div className="bg-gray-900 p-6 rounded">
          <p className="text-gray-400">YTD</p>
          <h2 className="text-3xl font-bold">{ytd}</h2>
        </div>
      </div>

      {/* OUTPUT PER JENIS */}
      <div className="bg-gray-900 p-6 rounded mb-6">
        <h2 className="mb-4 font-semibold">📊 Output per Jenis</h2>
        {Object.entries(outputPerJenis).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b py-2">
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* OUTPUT PER FIELD */}
      <div className="bg-gray-900 p-6 rounded mb-6">
        <h2 className="mb-4 font-semibold">🗺 Output per Field</h2>
        {Object.entries(outputPerField).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b py-2">
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
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
              <tr key={item.id} className="border-b border-gray-800">
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.field}</td>
                <td className="p-3">{item.output_kerja}</td>
                <td className="p-3">{item.satuan}</td>
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
    </div>
  );
}