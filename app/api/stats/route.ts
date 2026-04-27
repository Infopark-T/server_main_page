import { NextResponse } from "next/server";
import os from "os";
import fs from "fs";
import http from "http";

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    setTimeout(() => {
      const cpus2 = os.cpus();
      let idle = 0, total = 0;
      for (let i = 0; i < cpus1.length; i++) {
        const t2 = Object.values(cpus2[i].times).reduce((a, b) => a + b, 0);
        const t1 = Object.values(cpus1[i].times).reduce((a, b) => a + b, 0);
        idle += cpus2[i].times.idle - cpus1[i].times.idle;
        total += t2 - t1;
      }
      resolve(Math.round((1 - idle / total) * 100));
    }, 500);
  });
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total: Math.round(total / 1024 / 1024),
    used: Math.round(used / 1024 / 1024),
    pct: Math.round((used / total) * 100),
  };
}

function getDisk() {
  try {
    const stat = fs.statfsSync("/");
    const total = stat.blocks * stat.bsize;
    const free = stat.bfree * stat.bsize;
    const used = total - free;
    return {
      total: Math.round(total / 1024 / 1024 / 1024),
      used: Math.round(used / 1024 / 1024 / 1024),
      pct: Math.round((used / total) * 100),
    };
  } catch {
    return { total: 0, used: 0, pct: 0 };
  }
}

function getUptime() {
  const s = os.uptime();
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}일 ${h}시간`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

// Docker 소켓으로 컨테이너 상태 조회
const CONTAINER_MAP: Record<string, string> = {
  portal: "class_portal-app-1",
  oj: "hustoj-frontend-1",
  nas: "nextcloud-nextcloud-1",
  aidoc: "k-edufine-assistant-app-1",
};

function getDockerStatus(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const result: Record<string, string> = {
      portal: "unknown",
      oj: "unknown",
      nas: "unknown",
      aidoc: "unknown",
    };

    const req = http.request(
      {
        socketPath: "/var/run/docker.sock",
        path: "/containers/json?all=true",
        method: "GET",
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const containers: { Names: string[]; State: string; Status: string }[] = JSON.parse(data);
            for (const [key, name] of Object.entries(CONTAINER_MAP)) {
              const c = containers.find((c) => c.Names.includes(`/${name}`));
              result[key] = c ? c.State : "not_found";
            }
          } catch {
            // Docker 소켓 없거나 파싱 실패 시 unknown 유지
          }
          resolve(result);
        });
      }
    );
    req.on("error", () => resolve(result));
    req.end();
  });
}

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const [cpu, containers] = await Promise.all([getCpuUsage(), getDockerStatus()]);
          const data = {
            cpu,
            mem: getMemory(),
            disk: getDisk(),
            uptime: getUptime(),
            containers,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          clearInterval(interval);
        }
      };

      await send();
      interval = setInterval(send, 3000);
    },
    cancel() {
      clearInterval(interval);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
