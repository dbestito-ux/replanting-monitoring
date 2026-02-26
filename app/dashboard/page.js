"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [fieldFilter, setFieldFilter] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const today = new Date();
  const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayYear = new Date(today.getFullYear(), 0, 1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [data, fieldFilter, jenisFilter, datePreset, startDate, endDate]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    setData(data || []);
  };

  const applyFilter = () => {
    let temp = [...data];

    if (fieldFilter) {
      temp = temp.filter((item) => item.field === fieldFilter);
    }

    if (jenisFilter) {
      temp = temp.filter((item) => item.jenis_pekerjaan === jenisFilter);
    }

    if (datePreset !== "all") {
      temp = temp.filter((item) => {
        const itemDate = new Date(item.tanggal);

        if (datePreset === "today") {
          return itemDate.toDateString() === today.toDateString();
        }

        if (datePreset === "month") {
          return itemDate >= firstDayMonth;
        }

        if (datePreset === "year") {
          return itemDate >= firstDayYear;
        }

        if (datePreset === "week") {
          const firstDayWeek = new Date();
          firstDayWeek.setDate(today.getDate() - today.getDay());
          return itemDate >= firstDayWeek;
        }

        return true;
      });
    }

    if (startDate && endDate) {
      temp = temp.filter((item) => {
        const itemDate = new Date(item.tanggal);
        return (
          itemDate >= new Date(startDate) &&
          itemDate <= new Date(endDate)
        );
      });
    }

    setFilteredData(temp);
  };

  // ===== SUMMARY =====

  const totalMTD = filteredData
    .filter((item) => new Date(item.tanggal) >= firstDayMonth)
    .reduce((acc, curr) => acc + Number(curr.output_kerja), 0);

  const totalYTD = filteredData
    .filter((item) => new Date(item.tanggal) >= firstDayYear)
    .reduce((acc, curr) => acc + Number(curr.output_kerja), 0);

  // ===== REKAP PER JENIS =====

  const rekapJenis = Object.values(
    filteredData.reduce((acc, item) => {
      if (!acc[item.jenis_pekerjaan]) {
        acc[item.jenis_pekerjaan] = {
          jenis: item.jenis_pekerjaan,
          total: 0,
        };
      }
      acc[item.jenis_pekerjaan].total += Number(item.output_kerja);
      return acc;
    }, {})
  );

  // ===== REKAP PER FIELD =====

  const rekapField = Object.values(
    filteredData.reduce((acc, item) => {
      if (!acc[item.field]) {
        acc[item.field] = {
          field: item.field,
          total: 0,
        };
      }
      acc[item.field].total += Number(item.output_kerja);
      return acc;
    }, {})
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async (id) => {
    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="p-8 text-white bg-black min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Monitoring Replanting</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/input")}
            className="bg-white text-black px-4 py-2 rounded"
          >
            + Input Data
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
      <div className="grid grid-cols-5 gap-4 mb-6">

        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="bg-zinc-800 p-2 rounded"
        >
          <option value="">Semua Field</option>
          {[...new Set(data.map((d) => d.field))].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>

        <select
          value={jenisFilter}
          onChange={(e) => setJenisFilter(e.target.value)}
          className="bg-zinc-800 p-2 rounded"
        >
          <option value="">Semua Jenis</option>
          {[...new Set(data.map((d) => d.jenis_pekerjaan))].map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>

        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="bg-zinc-800 p-2 rounded"
        >
          <option value="all">Semua Tanggal</option>
          <option value="today">Today</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini (MTD)</option>
          <option value="year">Tahun Ini (YTD)</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-zinc-800 p-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-zinc-800 p-2 rounded"
        />
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 p-6 rounded">
          <p className="text-zinc-400">MTD</p>
          <h2 className="text-3xl font-bold">{totalMTD}</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded">
          <p className="text-zinc-400">YTD</p>
          <h2 className="text-3xl font-bold">{totalYTD}</h2>
        </div>
      </div>

      {/* REKAP PER JENIS */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Rekap per Jenis</h2>
        <div className="grid grid-cols-3 gap-4">
          {rekapJenis.map((item) => (
            <div key={item.jenis} className="bg-zinc-900 p-4 rounded">
              <p className="text-zinc-400">{item.jenis}</p>
              <h3 className="text-xl font-bold">{item.total}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* REKAP PER FIELD */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Rekap per Field</h2>
        <div className="grid grid-cols-3 gap-4">
          {rekapField.map((item) => (
            <div key={item.field} className="bg-zinc-900 p-4 rounded">
              <p className="text-zinc-400">{item.field}</p>
              <h3 className="text-xl font-bold">{item.total}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border border-zinc-800">
        <thead className="bg-zinc-900">
          <tr>
            <th className="p-3 text-left">Tanggal</th>
            <th className="p-3 text-left">Jenis</th>
            <th className="p-3 text-left">Field</th>
            <th className="p-3 text-left">Output</th>
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
              <td className="p-3 text-right">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 hover:underline"
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