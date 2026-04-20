"use client";

import { useEffect, useState } from "react";

interface Stats {
  cpu: number;
  mem: { total: number; used: number; pct: number };
  disk: { total: number; used: number; pct: number };
  uptime: string;
  containers: Record<string, string>;
}

const SERVICES = [
  {
    key: "portal",
    icon: "🏫",
    name: "학급 포털",
    desc: "학생·학부모·교사를 위한 학급 관리 플랫폼. 출결, 성적, 상담, 알림 기능 제공.",
    url: "https://portal.hyosang.cloud",
    label: "portal.hyosang.cloud",
  },
  {
    key: "oj",
    icon: "💻",
    name: "온라인 저지",
    desc: "알고리즘 문제 풀이 및 채점 플랫폼. 다양한 언어로 코드 제출 및 실시간 채점.",
    url: "https://oj.hyosang.cloud",
    label: "oj.hyosang.cloud",
  },
  {
    key: "nas",
    icon: "📁",
    name: "NAS / 클라우드",
    desc: "Nextcloud 기반 개인 클라우드 스토리지. 파일 저장, 공유, 동기화 지원.",
    url: "https://nas.hyosang.cloud",
    label: "nas.hyosang.cloud",
  },
];

function StatusBadge({ state }: { state?: string }) {
  if (!state || state === "unknown") {
    return (
      <span className="flex items-center gap-1 text-[0.7rem] font-medium text-zinc-400 bg-zinc-400/10 border border-zinc-400/20 rounded-full px-2.5 py-0.5">
        <span className="w-1 h-1 rounded-full bg-zinc-400" />
        확인 중
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="flex items-center gap-1 text-[0.7rem] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5">
        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
        운영 중
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[0.7rem] font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2.5 py-0.5">
      <span className="w-1 h-1 rounded-full bg-red-400" />
      {state === "exited" ? "중지됨" : state}
    </span>
  );
}

function GaugeBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#ef4444" : color }}
      />
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/stats");
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => setStats(JSON.parse(e.data));
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f11] text-[#e4e4e7] font-sans flex flex-col">
      <header className="border-b border-zinc-800 bg-[#18181b] h-14 flex items-center justify-between px-8">
        <div className="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
          InfoPark Services
          <span className="text-zinc-600 font-normal">— Personal Infrastructure</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" : "bg-zinc-600"}`} />
          {connected ? "Connected" : "Connecting..."}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-12 space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-zinc-500">운영 중인 서비스 목록입니다.</p>
        </div>

        {/* Server Stats */}
        <section>
          <p className="text-[0.7rem] font-semibold tracking-widest uppercase text-zinc-500 mb-3">Server Stats</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>CPU</span>
                <span className="text-zinc-300 font-mono">{stats ? `${stats.cpu}%` : "—"}</span>
              </div>
              <GaugeBar pct={stats?.cpu ?? 0} color="#6366f1" />
              <p className="text-[0.7rem] text-zinc-600">사용률</p>
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Memory</span>
                <span className="text-zinc-300 font-mono">{stats ? `${stats.mem.pct}%` : "—"}</span>
              </div>
              <GaugeBar pct={stats?.mem.pct ?? 0} color="#8b5cf6" />
              <p className="text-[0.7rem] text-zinc-600">{stats ? `${stats.mem.used} / ${stats.mem.total} MB` : "—"}</p>
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Disk</span>
                <span className="text-zinc-300 font-mono">{stats ? `${stats.disk.pct}%` : "—"}</span>
              </div>
              <GaugeBar pct={stats?.disk.pct ?? 0} color="#06b6d4" />
              <p className="text-[0.7rem] text-zinc-600">{stats ? `${stats.disk.used} / ${stats.disk.total} GB` : "—"}</p>
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-500">Uptime</p>
              <p className="text-lg font-mono font-semibold text-emerald-400">{stats?.uptime ?? "—"}</p>
              <p className="text-[0.7rem] text-zinc-600">서버 가동 시간</p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section>
          <p className="text-[0.7rem] font-semibold tracking-widest uppercase text-zinc-500 mb-3">Active</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#18181b] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 hover:border-indigo-500 hover:bg-[#222226] transition-all duration-150 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#222226] border border-zinc-800 flex items-center justify-center text-xl">
                    {s.icon}
                  </div>
                  <StatusBadge state={stats?.containers?.[s.key]} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm tracking-tight">{s.name}</h2>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[0.72rem] text-zinc-500 font-mono">{s.label}</span>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-5 text-center text-xs text-zinc-600 space-y-1">
        <p>
          <a href="https://hyosang.cloud" className="hover:text-zinc-400 transition-colors">hyosang.cloud</a>
        </p>
        <p className="flex items-center justify-center gap-3">
          <span>© 2026 Hyosang Park</span>
          <span>·</span>
          <a href="https://github.com/Infopark-T" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">github.com/Infopark-T</a>
          <span>·</span>
          <a href="mailto:hsprk22@gmail.com" className="hover:text-zinc-400 transition-colors">hsprk22@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}
