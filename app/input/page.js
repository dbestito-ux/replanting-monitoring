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
  const [satuan, setSatuan] = useState("");
  const [loading, setLoading] = useState(false);

  // MASTER DATA (sementara hardcoded, nanti bisa kita tarik dari DB)
  const jenisOptions = [
    "Cambering",
    "Chipping",
    "Debolling",
    "CECT",
    "Fieldrain",
    "Main Drain 1",
    "Main Drain 2",
    "Main Drain 3",
    "Felling",
    "Terrace",
    "New Road",
    "Leveling",
    "Tanam Pokok",
    "Lubang Tanam"
  ];

  const fieldOptions = [
    "H003",
    "H004",
    "H005",
    "J004",
    "I005",
    "F007",
    "G006"
  ];

  const satuanOptions = ["ha", "pokok", "meter", "lubang"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("replanting_records").insert([
      {
        tanggal,
        jenis_pekerjaan: jenis,
        field,
        output_kerja: Number(output),
        satuan_output: satuan, // pastikan kolom ini ada di database
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
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-600 outline-none"
            />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* JENIS */}
            <div>
              <label className="block text-sm mb-2 text-zinc-400">
                Jenis Pekerjaan
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-600 outline-none"
              >
                <option value="">-- Pilih Jenis --</option>
                {jenisOptions.map((item, i) => (
                  <option key={i} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {/* FIELD */}
            <div>
              <label className="block text-sm mb-2 text-zinc-400">
                Field
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-600 outline-none"
              >
                <option value="">-- Pilih Field --</option>
                {fieldOptions.map((item, i) => (
                  <option key={i} value={item}>{item}</option>
                ))}
              </select>
            </div>

          </div>

          {/* OUTPUT + SATUAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-zinc-400">
                Satuan
              </label>
              <select
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-600 outline-none"
              >
                <option value="">-- Pilih Satuan --</option>
                {satuanOptions.map((item, i) => (
                  <option key={i} value={item}>{item}</option>
                ))}
              </select>
            </div>

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