"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [fieldFilter, setFieldFilter] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [mtd, setMtd] = useState(0);
  const [ytd, setYtd] = useState(0);

  // ================= FETCH DATA =================
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

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FILTER =================
  useEffect(() => {
    let temp = [...data];

    if (fieldFilter)
      temp = temp.filter((item) => item.field === fieldFilter);

    if (jenisFilter)
      temp = temp.filter((item) => item.jenis_pekerjaan === jenisFilter);

    if (startDate)
      temp = temp.filter((item) => item.tanggal >= startDate);

    if (endDate)
      temp = temp.filter((item) => item.tanggal <= endDate);

    setFilteredData(temp);

    calculateMTDYTD(temp);
  }, [fieldFilter, jenisFilter, startDate, endDate, data]);

  // ================= MTD & YTD =================
  const calculateMTDYTD = (dataset) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let mtdTotal = 0;
    let ytdTotal = 0;

    dataset.forEach((item) => {
      const itemDate = new Date(item.tanggal);

      if (
        itemDate.getMonth() === month &&
        itemDate.getFullYear() === year
      ) {
        mtdTotal += Number(item.output_kerja);
      }

      if (itemDate.getFullYear() === year) {
        ytdTotal += Number(item.output_kerja);
      }
    });

    setMtd(mtdTotal);
    setYtd(ytdTotal);
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  // ================= EXPORT =================
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(fileData, "Monitoring_Replanting.xlsx");
  };

  // ================= SUMMARY =================
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

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Dashboard Monitoring Replanting
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/input")}
            className="px-4 py-2 bg-white text-black rounded-lg"
          >
            + Input Data
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 rounded-lg"
          >
            Export Excel
          </button>

          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter Field"
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        />

        <input
          type="text"
          placeholder="Filter Jenis"
          value={jenisFilter}
          onChange={(e) => setJenisFilter(e.target.value)}
          className="bg-zinc-800 px-4 py-2 rounded-lg"
        />

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

      {/* MTD YTD */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-zinc-400">MTD</p>
          <h2 className="text-3xl font-bold">{mtd}</h2>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-zinc-400">YTD</p>
          <h2 className="text-3xl font-bold">{ytd}</h2>
        </div>
      </div>

      {/* OUTPUT PER JENIS */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="mb-4 font-semibold">📊 Output per Jenis</h2>
        {Object.entries(outputPerJenis).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* OUTPUT PER FIELD */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="mb-4 font-semibold">🗺 Output per Field</h2>
        {Object.entries(outputPerField).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-zinc-800 py-2">
            <span>{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800">
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
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="p-3">{item.tanggal}</td>
                <td className="p-3">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.field}</td>
                <td className="p-3">{item.output_kerja}</td>
                <td className="p-3">{item.satuan_output}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => router.push(`/edit/${item.id}`)}
                    className="text-blue-400 mr-3"
                  >
                    Edit
                  </button>
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