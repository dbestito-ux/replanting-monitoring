"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InputMonitoring() {
  const router = useRouter();

  const [tanggal, setTanggal] = useState("");
  const [jenis, setJenis] = useState("");
  const [field, setField] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("replanting_records").insert([
      {
        tanggal,
        jenis_pekerjaan: jenis,
        field,
        output_kerja: Number(output),
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Gagal menyimpan data");
      console.error(error);
    } else {
      alert("Data berhasil disimpan");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Input Monitoring Replanting</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TANGGAL */}
          <div>
            <label className="block text-sm mb-2 text-zinc-400">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* GRID 2 KOLOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm mb-2 text-zinc-400">
                Jenis Pekerjaan
              </label>
              <input
                type="text"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                required
                placeholder="Contoh: Cambering"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-zinc-400">
                Field
              </label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
                placeholder="Contoh: H004"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

          </div>

          {/* OUTPUT */}
          <div>
            <label className="block text-sm mb-2 text-zinc-400">
              Output Kerja
            </label>
            <input
              type="number"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              required
              placeholder="Masukkan jumlah output"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* BUTTON */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 border border-zinc-600 rounded-lg hover:bg-zinc-800"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}