import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CommandName, CommandResult, LinuxEnvironment, ToolAvailability } from "./preload.cjs";

const isDev = !app.isPackaged;

const lookupPaths = [
  "/usr/local/sbin",
  "/usr/local/bin",
  "/usr/sbin",
  "/usr/bin",
  "/sbin",
  "/bin",
  ...process.env.PATH?.split(path.delimiter) ?? []
];

const requiredTools = ["tailscale"];
const optionalTools = ["tailscaled", "systemctl", "resolvectl", "NetworkManager", "pkexec", "bash", "xdg-terminal-exec", "kgx", "gnome-terminal", "konsole", "xfce4-terminal", "alacritty", "kitty", "foot", "xterm"];
const terminalTools = ["xdg-terminal-exec", "kgx", "gnome-terminal", "konsole", "xfce4-terminal", "alacritty", "kitty", "foot", "xterm"];

const commandMap: Record<CommandName, { tool: string; args: string[]; privilege?: "always" | "fallback"; acceptsInput?: boolean; timeoutMs?: number }> = {
  status: { tool: "tailscale", args: ["status"] },
  ip: { tool: "tailscale", args: ["ip", "-4"] },
  version: { tool: "tailscale", args: ["version"] },
  netcheck: { tool: "tailscale", args: ["netcheck"] },
  dnsStatus: { tool: "tailscale", args: ["dns", "status"] },
  resolvedStatus: { tool: "resolvectl", args: ["status"] },
  login: {
    tool: "bash",
    args: [
      "-lc",
      "cmd='tailscale up || pkexec tailscale up'; for term in xdg-terminal-exec kgx gnome-terminal konsole xfce4-terminal alacritty kitty foot xterm; do if command -v \"$term\" >/dev/null 2>&1; then case \"$term\" in xdg-terminal-exec) exec \"$term\" bash -lc \"$cmd\" ;; kgx) exec \"$term\" -- bash -lc \"$cmd\" ;; gnome-terminal) exec \"$term\" -- bash -lc \"$cmd\" ;; konsole) exec \"$term\" -e bash -lc \"$cmd\" ;; xfce4-terminal) exec \"$term\" --command \"bash -lc '$cmd'\" ;; alacritty|kitty|foot|xterm) exec \"$term\" -e bash -lc \"$cmd\" ;; esac; fi; done; echo 'No compatible terminal found' >&2; exit 127"
    ]
  },
  logout: { tool: "tailscale", args: ["logout"], privilege: "fallback" },
  start: { tool: "tailscale", args: ["up", "--timeout=30s"], privilege: "fallback", timeoutMs: 35000 },
  stop: { tool: "tailscale", args: ["down"], privilege: "fallback" },
  repairDns: {
    tool: "bash",
    args: [
      "-lc",
      "set -e; mkdir -p /etc/NetworkManager/conf.d; printf '[main]\\ndns=systemd-resolved\\n' > /etc/NetworkManager/conf.d/dns-systemd-resolved.conf; if [ ! -e /etc/resolv.conf.backup-tailscale-control ]; then cp -a /etc/resolv.conf /etc/resolv.conf.backup-tailscale-control; fi; ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf; systemctl restart systemd-resolved NetworkManager tailscaled"
    ],
    privilege: "always"
  },
  ping: { tool: "tailscale", args: ["ping"], acceptsInput: true },
  ssh: { tool: "tailscale", args: ["ssh"], acceptsInput: true },
  sshTerminal: {
    tool: "bash",
    args: [
      "-lc",
      "host=\"$1\"; shift; for term in xdg-terminal-exec kgx gnome-terminal konsole xfce4-terminal alacritty kitty foot xterm; do if command -v \"$term\" >/dev/null 2>&1; then case \"$term\" in xdg-terminal-exec) exec \"$term\" tailscale ssh \"$host\" ;; kgx) exec \"$term\" -- tailscale ssh \"$host\" ;; gnome-terminal) exec \"$term\" -- tailscale ssh \"$host\" ;; konsole) exec \"$term\" -e tailscale ssh \"$host\" ;; xfce4-terminal) exec \"$term\" --command \"tailscale ssh $host\" ;; alacritty|kitty|foot|xterm) exec \"$term\" -e tailscale ssh \"$host\" ;; esac; fi; done; echo 'No compatible terminal found' >&2; exit 127",
      "tailscale-control-ssh"
    ],
    acceptsInput: true
  }
};

function friendlyMessage(name: CommandName, ok: boolean, stdout: string, stderr: string, code: number, userArgs: string[]) {
  const output = [stdout, stderr].filter(Boolean).join("\n").toLowerCase();
  const target = userArgs[0] || "el host seleccionado";

  if (ok) {
    switch (name) {
      case "sshTerminal":
        return `Terminal SSH abierta para ${target}. La conexión continúa en esa terminal.`;
      case "repairDns":
        return "DNS reparado. Se actualizó la integración con systemd-resolved/NetworkManager y se reiniciaron servicios.";
      case "login":
        return "Se abrió una terminal para iniciar sesión con Tailscale. Sigue la URL o instrucciones que aparezcan ahí.";
      case "logout":
        return "Sesión de Tailscale cerrada para este equipo.";
      case "start":
        return "Tailscale encendido/conectado.";
      case "stop":
        return "Tailscale desconectado.";
      case "ping":
        return `Ping ejecutado contra ${target}.`;
      case "status":
        return "Estado de Tailscale actualizado.";
      case "ip":
        return "IP local de Tailscale obtenida.";
      case "netcheck":
        return "Diagnóstico de red completado.";
      case "dnsStatus":
        return "Diagnóstico DNS de Tailscale completado.";
      case "resolvedStatus":
        return "Estado de systemd-resolved obtenido.";
      case "version":
        return "Versión de Tailscale obtenida.";
      default:
        return "Comando completado.";
    }
  }

  if (code === 126 || code === 127 || output.includes("no compatible terminal found")) {
    return name === "sshTerminal"
      ? "No se encontró una terminal compatible para abrir SSH. Instala una terminal como xterm, konsole, gnome-terminal, kitty, alacritty o foot."
      : "No se encontró una herramienta necesaria para ejecutar este comando.";
  }

  if (output.includes("operation was cancelled") || output.includes("cancelled") || output.includes("dismissed")) {
    return "La autorización fue cancelada. No se aplicaron cambios.";
  }

  if (name === "status" && output.includes("tailscale is stopped")) {
    return "Tailscale está apagado. Usa el botón OFF para intentar encenderlo.";
  }

  if (name === "ip" && output.includes("tailscale is stopped")) {
    return "No hay IP de Tailscale porque el servicio está apagado.";
  }

  if (output.includes("authentication") || output.includes("not logged in") || output.includes("logged out")) {
    return "Tailscale requiere iniciar sesión antes de continuar.";
  }

  if (output.includes("timeout") || output.includes("timed out")) {
    return "El comando tardó demasiado y fue detenido por timeout.";
  }

  if (output.includes("host key verification failed")) {
    return "SSH no pudo verificar la identidad del host. Abre SSH en una terminal y acepta la host key si confías en ese servidor.";
  }

  if (output.includes("pseudo-terminal will not be allocated")) {
    return "SSH necesita una terminal interactiva. Usa el botón SSH para abrirlo en una terminal externa.";
  }

  return "El comando falló. Revisa la salida técnica para ver el detalle.";
}

function findExecutable(name: string) {
  for (const dir of lookupPaths) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Continue searching the next PATH entry.
    }
  }
  return null;
}

function parseOsRelease() {
  const fallback = { id: os.platform(), name: "Linux", version: "", prettyName: "Linux" };

  try {
    const text = fs.readFileSync("/etc/os-release", "utf8");
    const data = Object.fromEntries(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return [key, rest.join("=").replace(/^"|"$/g, "")];
        })
    );

    return {
      id: data.ID || fallback.id,
      name: data.NAME || fallback.name,
      version: data.VERSION_ID || data.VERSION || fallback.version,
      prettyName: data.PRETTY_NAME || data.NAME || fallback.prettyName
    };
  } catch {
    return fallback;
  }
}

function getInstallGuidance(distroId: string) {
  const id = distroId.toLowerCase();

  if (["arch", "cachyos", "manjaro", "endeavouros", "artix"].includes(id)) {
    return {
      command: "sudo pacman -S tailscale polkit",
      note: "Después habilita el servicio con: sudo systemctl enable --now tailscaled"
    };
  }

  if (["fedora", "rhel", "centos", "rocky", "almalinux"].includes(id)) {
    return {
      command: "sudo dnf install tailscale polkit",
      note: "Después habilita el servicio con: sudo systemctl enable --now tailscaled"
    };
  }

  if (["opensuse", "opensuse-tumbleweed", "opensuse-leap", "suse"].includes(id)) {
    return {
      command: "sudo zypper install tailscale polkit",
      note: "Después habilita el servicio con: sudo systemctl enable --now tailscaled"
    };
  }

  if (["debian", "ubuntu", "linuxmint", "pop", "elementary", "zorin"].includes(id)) {
    return {
      command: "curl -fsSL https://tailscale.com/install.sh | sh",
      note: "El instalador oficial configura el repositorio de Tailscale para tu distro."
    };
  }

  return {
    command: "curl -fsSL https://tailscale.com/install.sh | sh",
    note: "Usa el instalador oficial de Tailscale o el paquete nativo de tu distribución."
  };
}

function getToolAvailability(): ToolAvailability[] {
  return [...requiredTools, ...optionalTools].map((name) => ({
    name,
    path: findExecutable(name),
    required: requiredTools.includes(name)
  }));
}

function getEnvironment(): LinuxEnvironment {
  const distro = parseOsRelease();
  const terminal = terminalTools.find((name) => findExecutable(name));

  return {
    distro,
    tools: getToolAvailability(),
    systemd: fs.existsSync("/run/systemd/system"),
    terminal: {
      available: Boolean(terminal),
      name: terminal ?? null
    },
    install: getInstallGuidance(distro.id)
  };
}

function createWindow() {
  const appBasePath = isDev ? process.cwd() : app.getAppPath();
  const icon = path.join(appBasePath, "public", "tailscale-light.png");
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    icon,
    title: "Tailscale Control",
    autoHideMenuBar: true,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    void window.loadURL("http://127.0.0.1:5173");
  } else {
    void window.loadFile(path.join(appBasePath, "dist", "index.html"));
  }
}

function runCommand(name: CommandName, userArgs: string[] = []): Promise<CommandResult> {
  const spec = commandMap[name];
  const toolPath = findExecutable(spec.tool);

  if (!toolPath) {
    return Promise.resolve({
      ok: false,
      command: [spec.tool, ...spec.args].join(" "),
      message: `No se encontró '${spec.tool}' en PATH. Instala el paquete requerido para tu distribución.`,
      stdout: "",
      stderr: `No se encontró '${spec.tool}' en PATH. Instala el paquete requerido para tu distribución.`,
      code: 127
    });
  }

  const pkexecPath = spec.privilege ? findExecutable("pkexec") : null;

  if (spec.privilege === "always" && !pkexecPath) {
    return Promise.resolve({
      ok: false,
      command: [spec.tool, ...spec.args].join(" "),
      message: "No se encontró 'pkexec'. Instala polkit/pkexec para ejecutar acciones administrativas.",
      stdout: "",
      stderr: "No se encontró 'pkexec'. Instala polkit/pkexec para ejecutar acciones administrativas.",
      code: 127
    });
  }

  const safeUserArgs = spec.acceptsInput ? userArgs.filter((arg) => /^[a-zA-Z0-9._:@/-]+$/.test(arg)).slice(0, 2) : [];
  const commandArgs = [...spec.args, ...safeUserArgs];
  const normal = { bin: toolPath, args: commandArgs };
  const privileged = pkexecPath ? { bin: pkexecPath, args: [toolPath, ...commandArgs] } : null;
  const firstAttempt = spec.privilege === "always" && privileged ? privileged : normal;

  return new Promise((resolve) => {
    const finish = (bin: string, args: string[], error: { code?: string | number | null; message?: string } | null, stdout: string, stderr: string) => {
      const code = typeof error?.code === "number" ? error.code : error ? 1 : 0;
      const cleanStdout = stdout.trim();
      const cleanStderr = stderr.trim() || (error?.message ?? "").replace(/^Command failed: .*\n?/m, "").trim();
      resolve({
        ok: !error,
        command: [bin, ...args].join(" "),
        message: friendlyMessage(name, !error, cleanStdout, cleanStderr, code, safeUserArgs),
        stdout: cleanStdout,
        stderr: cleanStderr,
        code
      });
    };

    execFile(firstAttempt.bin, firstAttempt.args, { timeout: spec.timeoutMs ?? 8000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const cleanStdout = stdout.trim();
      const cleanStderr = stderr.trim() || (error?.message ?? "").replace(/^Command failed: .*\n?/m, "").trim();

      if (error && spec.privilege === "fallback" && privileged && isPermissionFailure(cleanStdout, cleanStderr)) {
        execFile(privileged.bin, privileged.args, { timeout: spec.timeoutMs ?? 8000, maxBuffer: 1024 * 1024 }, (nextError, nextStdout, nextStderr) => {
          finish(privileged.bin, privileged.args, nextError, nextStdout, nextStderr);
        });
        return;
      }

      finish(firstAttempt.bin, firstAttempt.args, error, stdout, stderr);
    });
  });
}

ipcMain.handle("tailscale:run", async (_event, name: CommandName, args?: string[]) => runCommand(name, args));
ipcMain.handle("tailscale:environment", async () => getEnvironment());
ipcMain.handle("tailscale:open-external", async (_event, url: string) => {
  const allowedUrl = /^https:\/\/login\.tailscale\.com\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/.test(url) || url === "https://github.com/giossue";
  if (!allowedUrl) {
    throw new Error("URL externa no permitida.");
  }
  await shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function isPermissionFailure(stdout: string, stderr: string) {
  const output = [stdout, stderr].filter(Boolean).join("\n").toLowerCase();
  return (
    output.includes("permission denied") ||
    output.includes("access denied") ||
    output.includes("must be root") ||
    output.includes("requires root") ||
    output.includes("not permitted") ||
    output.includes("operation not permitted") ||
    output.includes("sudo") ||
    output.includes("polkit") ||
    output.includes("permission")
  );
}
