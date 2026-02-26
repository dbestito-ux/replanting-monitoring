"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);

  const [filterField, setFilterField] = useState("all");
  const [filterJenis, setFilterJenis] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getSession();
    fetchData();
  }, []);

  async function getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/login");
    } else {
      setUser(data.session.user);
    }
  }

  async function fetchData() {
    const { data, error } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    if (!error) setData(data);
  }

  async function handleDelete(id) {
    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  }

  function handleExport() {
    const exportData = filteredData.map((item) => ({
      Tanggal: item.tanggal,
      Jenis: item.jenis_pekerjaan,
      Field: item.field,
      Output: item.output_kerja,
      Satuan: item.satuan || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    });

    saveAs(fileData, "Monitoring_Replanting.xlsx");
  }

  /* ================= FILTER ================= */

  const filteredData = data.filter((item) => {
    const matchField =
      filterField === "all" || item.field === filterField;

    const matchJenis =
      filterJenis === "all" || item.jenis_pekerjaan === filterJenis;

    const matchStart =
      !startDate || item.tanggal >= startDate;

    const matchEnd =
      !endDate || item.tanggal <= endDate;

    return matchField && matchJenis && matchStart && matchEnd;
  });

  /* ================= MTD YTD ================= */

  const today = new Date();

  const mtd = filteredData
    .filter((item) => {
      const d = new Date(item.tanggal);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  const ytd = filteredData
    .filter((item) => {
      const d = new Date(item.tanggal);
      return d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, item) => sum + Number(item.output_kerja), 0);

  /* ================= OUTPUT PER JENIS ================= */

  const outputPerJenis = {};
  filteredData.forEach((item) => {
    outputPerJenis[item.jenis_pekerjaan] =
      (outputPerJenis[item.jenis_pekerjaan] || 0) +
      Number(item.output_kerja);
  });

  /* ================= OUTPUT PER FIELD ================= */

  const outputPerField = {};
  filteredData.forEach((item) => {
    outputPerField[item.field] =
      (outputPerField[item.field] || 0) +
      Number(item.output_kerja);
  });

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Monitoring Replanting
          </h1>
          <p className="text-zinc-400 text-sm">
            {user?.email}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/input")}
            className="bg-white text-black px-4 py-2 rounded-lg"
          >
            + Input Data
          </button>

          <button
            onClick={handleExport}
            className="bg-green-600 px-4 py-2 rounded-lg"
          >
            Export Excel
          </button>

          <button
            onClick={() => {
              supabase.auth.signOut();
              router.push("/login");
            }}
            className="border border-red-500 text-red-500 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ================= FILTER ================= */}

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterField}
          onChange={(e) => setFilterField(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        >
          <option value="all">All Field</option>
          {[...new Set(data.map((item) => item.field))].map((field) => (
            <option key={field}>{field}</option>
          ))}
        </select>

        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        >
          <option value="all">All Jenis</option>
          {[...new Set(data.map((item) => item.jenis_pekerjaan))].map((jenis) => (
            <option key={jenis}>{jenis}</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        />
      </div>

      {/* ================= MTD YTD ================= */}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-zinc-400 text-sm">MTD</h2>
          <p className="text-3xl font-bold">{mtd}</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-zinc-400 text-sm">YTD</h2>
          <p className="text-3xl font-bold">{ytd}</p>
        </div>
      </div>

      {/* ================= OUTPUT PER JENIS ================= */}

      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="font-semibold mb-4">📊 Output per Jenis</h2>
        {Object.entries(outputPerJenis).map(([jenis, total]) => (
          <div key={jenis} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{jenis}</span>
            <span>{total}</span>
          </div>
        ))}
      </div>

      {/* ================= OUTPUT PER FIELD ================= */}

      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="font-semibold mb-4">🗺 Output per Field</h2>
        {Object.entries(outputPerField).map(([field, total]) => (
          <div key={field} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{field}</span>
            <span>{total}</span>
          </div>
        ))}
      </div>

      {/* ================= TABLE ================= */}

      <table className="w-full text-sm">
        <thead className="bg-zinc-900">
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
            <tr key={item.id} className="border-b border-zinc-800">
              <td className="p-3">{item.tanggal}</td>
              <td className="p-3">{item.jenis_pekerjaan}</td>
              <td className="p-3">{item.field}</td>
              <td className="p-3">{item.output_kerja}</td>
              <td className="p-3">{item.satuan}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => router.push(`/edit/${item.id}`)}
                  className="text-blue-400 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}