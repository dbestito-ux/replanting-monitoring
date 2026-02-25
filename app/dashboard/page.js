"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [data, setData] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const getSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/login");
      } else {
        setSession(sessionData.session);
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

    setData(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin hapus data ini?")) return;

    await supabase.from("monitoring").delete().eq("id", id);
    fetchData();
  };

  const totalMTD = data.reduce((acc, item) => acc + item.output, 0);
  const totalYTD = totalMTD;

  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Monitoring</h1>
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
            className="border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800"
          >
            Export Excel
          </button>

          <button
            onClick={handleLogout}
            className="border border-red-600 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-600 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* REKAP CARD */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 text-sm">MTD</p>
          <h2 className="text-2xl font-semibold mt-2">{totalMTD}</h2>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 text-sm">YTD</p>
          <h2 className="text-2xl font-semibold mt-2">{totalYTD}</h2>
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
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800 hover:bg-zinc-800/40"
              >
                <td className="p-4">{item.tanggal}</td>
                <td className="p-4">{item.jenis}</td>
                <td className="p-4">{item.field}</td>
                <td className="p-4">{item.output}</td>
                <td className="p-4 text-right space-x-2">
                  <Link
                    href={`/edit/${item.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    Edit
                  </Link>
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