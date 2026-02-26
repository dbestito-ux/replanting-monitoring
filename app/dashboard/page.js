"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [session, setSession] = useState(null);

  const [selectedField, setSelectedField] = useState("all");
  const [selectedJenis, setSelectedJenis] = useState("all");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      router.push("/login");
    } else {
      setSession(sessionData.session);
      fetchData();
    }
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("replanting_records")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setData(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin hapus data ini?")) return;

    await supabase.from("replanting_records").delete().eq("id", id);
    fetchData();
  };

  // ===============================
  // FILTER DATA
  // ===============================
  const filteredData = data.filter((item) => {
    return (
      (selectedField === "all" || item.field === selectedField) &&
      (selectedJenis === "all" || item.jenis_pekerjaan === selectedJenis)
    );
  });

  // ===============================
  // HITUNG MTD & YTD (ANTI NaN)
  // ===============================
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mtd = filteredData.reduce((sum, item) => {
    if (!item.tanggal) return sum;

    const d = new Date(item.tanggal);

    if (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    ) {
      return sum + Number(item.output_kerja || 0);
    }

    return sum;
  }, 0);

  const ytd = filteredData.reduce((sum, item) => {
    if (!item.tanggal) return sum;

    const d = new Date(item.tanggal);

    if (d.getFullYear() === currentYear) {
      return sum + Number(item.output_kerja || 0);
    }

    return sum;
  }, 0);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard Monitoring Replanting
          </h1>
          <p className="text-zinc-400 text-sm">
            {session.user.email}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/input"
            className="bg-white text-black px-4 py-2 rounded-lg text-sm hover:bg-zinc-200"
          >
            + Input Data
          </Link>

          <button
            onClick={handleLogout}
            className="border border-red-600 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-600 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="bg-zinc-800 px-3 py-2 rounded"
        >
          <option value="all">Semua Field</option>
          {[...new Set(data.map((d) => d.field))].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          value={selectedJenis}
          onChange={(e) => setSelectedJenis(e.target.value)}
          className="bg-zinc-800 px-3 py-2 rounded"
        >
          <option value="all">Semua Jenis</option>
          {[...new Set(data.map((d) => d.jenis_pekerjaan))].map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </div>

      {/* REKAP */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 text-sm">MTD</p>
          <h2 className="text-2xl font-semibold mt-2">{mtd}</h2>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 text-sm">YTD</p>
          <h2 className="text-2xl font-semibold mt-2">{ytd}</h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-400">
            <tr>
              <th className="text-left p-4">Tanggal</th>
              <th className="text-left p-4">Jenis</th>
              <th className="text-left p-4">Field</th>
              <th className="text-left p-4">Output</th>
              <th className="text-right p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800 hover:bg-zinc-800/40"
              >
                <td className="p-4">{item.tanggal}</td>
                <td className="p-4">{item.jenis_pekerjaan}</td>
                <td className="p-4">{item.field}</td>
                <td className="p-4">{item.output_kerja}</td>
                <td className="p-4 text-right">
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
    </div>
  );
}
