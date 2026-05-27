import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Kbd,
  Spinner,
  Switch,
  Tab,
  Tabs,
  Tooltip
} from "@heroui/react";
import {
  Activity,
  Cable,
  CheckCircle2,
  Clipboard,
  Github,
  Globe2,
  Hammer,
  LogIn,
  Moon,
  Network,
  Power,
  RefreshCcw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sun,
  Terminal,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CommandName, CommandResult, LinuxEnvironment } from "./tailscale-api";

type Language = "es" | "en";

interface NodeRow {
  ip: string;
  name: string;
  user: string;
  os: string;
  state: string;
}

const quickCommands: Array<{ key: CommandName; labelKey: TranslationKey; icon: React.ReactNode }> = [
  { key: "status", labelKey: "status", icon: <Activity size={18} /> },
  { key: "ip", labelKey: "ip", icon: <Network size={18} /> },
  { key: "netcheck", labelKey: "network", icon: <Cable size={18} /> },
  { key: "dnsStatus", labelKey: "dns", icon: <ShieldCheck size={18} /> },
  { key: "resolvedStatus", labelKey: "resolved", icon: <Server size={18} /> },
  { key: "repairDns", labelKey: "repairDns", icon: <Hammer size={18} /> },
  { key: "version", labelKey: "version", icon: <Terminal size={18} /> }
];

const visibleToolNames = new Set(["tailscale", "tailscaled", "systemctl", "resolvectl", "NetworkManager", "pkexec", "bash"]);

const assetPath = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

function RequirementState({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 className="requirement-ok" size={18} /> : <XCircle className="requirement-missing" size={18} />;
}

const translations = {
  es: {
    linuxLocal: "Linux local",
    missingTailscale: "Falta Tailscale",
    noSession: "Sin sesión",
    checkDns: "Revisar DNS",
    operational: "Conectado",
    refresh: "Actualizar estado",
    localMachine: "Máquina local",
    loginRequired: "Inicio de sesión requerido",
    disconnected: "Sin conexión",
    noIp: "Sin IP",
    nodes: "nodos",
    active: "activos",
    unofficialApp: "App no oficial",
    createdBy: "Creado por",
    login: "Iniciar sesión",
    loginOpening: "Abriendo inicio de sesión de Tailscale...",
    logout: "Cerrar sesión",
    repairDns: "Reparar DNS",
    startService: "Iniciar servicio",
    disconnect: "Desconectar",
    hostOrIp: "Host o IP",
    nodesTab: "Nodos",
    commandsTab: "Comandos",
    systemTab: "Sistema",
    status: "Estado",
    ip: "IP",
    network: "Red",
    dns: "DNS",
    resolved: "Resolvedor",
    version: "Versión",
    distribution: "Distribución",
    system: "Sistema",
    systemd: "systemd",
    available: "Disponible",
    notDetected: "No detectado",
    tools: "Herramientas",
    notFound: "No encontrado",
    required: "requerido",
    optional: "opcional",
    noCommand: "Sin comando ejecutado",
    copy: "Copiar",
    commandOutput: "La salida de los comandos aparecerá aquí.",
    repairDnsTooltip: "Repara MagicDNS con pkexec cuando el sistema lo permita",
    preflightTitle: "Preparación del sistema",
    preflightReady: "Listo para controlar Tailscale",
    preflightBlocked: "Falta Tailscale para usar la app",
    preflightWarning: "Hay funciones que requieren componentes adicionales",
    installCommand: "Comando de instalación",
    installNote: "Nota",
    copyCommand: "Copiar comando",
    requiredDependency: "Dependencia requerida",
    adminActions: "Acciones administrativas",
    terminalIntegration: "Terminal externa",
    ready: "Listo",
    unavailable: "No disponible",
    operatorTip: "Para reducir solicitudes de contraseña, el usuario puede configurar el operador de Tailscale:",
    bridgeUnavailable: "El puente local de Electron no está disponible. Revisa el preload de la app.",
    commandFailed: "No se pudo ejecutar el comando.",
    refreshFailed: "No se pudo actualizar el estado.",
    settings: "Ajustes",
    connected: "conectado",
    nodeActive: "activo",
    nodeIdle: "inactivo",
    offline: "desconectado",
    lastSeen: "visto hace",
    commandOutputTitle: "Salida"
  },
  en: {
    linuxLocal: "Local Linux",
    missingTailscale: "Tailscale missing",
    noSession: "No session",
    checkDns: "Check DNS",
    operational: "Connected",
    refresh: "Refresh status",
    localMachine: "Local machine",
    loginRequired: "Login required",
    disconnected: "Disconnected",
    noIp: "No IP",
    nodes: "nodes",
    active: "active",
    unofficialApp: "Unofficial app",
    createdBy: "Created by",
    login: "Log in",
    loginOpening: "Opening Tailscale login...",
    logout: "Log out",
    repairDns: "Repair DNS",
    startService: "Start service",
    disconnect: "Disconnect",
    hostOrIp: "Host or IP",
    nodesTab: "Nodes",
    commandsTab: "Commands",
    systemTab: "System",
    status: "Status",
    ip: "IP",
    network: "Network",
    dns: "DNS",
    resolved: "Resolved",
    version: "Version",
    distribution: "Distribution",
    system: "System",
    systemd: "systemd",
    available: "Available",
    notDetected: "Not detected",
    tools: "Tools",
    notFound: "Not found",
    required: "required",
    optional: "optional",
    noCommand: "No command run",
    copy: "Copy",
    commandOutput: "Command output will appear here.",
    repairDnsTooltip: "Repairs MagicDNS with pkexec when the system supports it",
    preflightTitle: "System preflight",
    preflightReady: "Ready to control Tailscale",
    preflightBlocked: "Tailscale is required to use the app",
    preflightWarning: "Some features require additional components",
    installCommand: "Install command",
    installNote: "Note",
    copyCommand: "Copy command",
    requiredDependency: "Required dependency",
    adminActions: "Administrative actions",
    terminalIntegration: "External terminal",
    ready: "Ready",
    unavailable: "Unavailable",
    operatorTip: "To reduce password prompts, the user can configure the Tailscale operator:",
    bridgeUnavailable: "The local Electron bridge is unavailable. Check the app preload.",
    commandFailed: "The command could not be executed.",
    refreshFailed: "The status could not be refreshed.",
    settings: "Settings",
    connected: "connected",
    nodeActive: "active",
    nodeIdle: "idle",
    offline: "offline",
    lastSeen: "last seen",
    commandOutputTitle: "Output"
  }
} as const;

type TranslationKey = keyof typeof translations.es;

function parseNodes(output: string): NodeRow[] {
  return output
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        ip: parts[0] ?? "",
        name: parts[1] ?? "",
        user: parts[2] ?? "",
        os: parts[3] ?? "",
        state: parts.slice(4).join(" ") || "online"
      };
    })
    .filter((row) => row.ip.startsWith("100."));
}

function translateResultMessage(message: string, language: Language) {
  if (language === "es" || !message) return message;

  const exact: Record<string, string> = {
    "DNS reparado. Se actualizó la integración con systemd-resolved/NetworkManager y se reiniciaron servicios.": "DNS repaired. The systemd-resolved/NetworkManager integration was updated and services were restarted.",
    "Se abrió una terminal para iniciar sesión con Tailscale. Sigue la URL o instrucciones que aparezcan ahí.": "A terminal was opened to sign in to Tailscale. Follow the URL or instructions shown there.",
    "Sesión de Tailscale cerrada para este equipo.": "Tailscale session closed for this machine.",
    "Tailscale encendido/conectado.": "Tailscale is on and connected.",
    "Tailscale desconectado.": "Tailscale disconnected.",
    "Estado de Tailscale actualizado.": "Tailscale status updated.",
    "IP local de Tailscale obtenida.": "Local Tailscale IP retrieved.",
    "Diagnóstico de red completado.": "Network diagnostics completed.",
    "Diagnóstico DNS de Tailscale completado.": "Tailscale DNS diagnostics completed.",
    "Estado de systemd-resolved obtenido.": "systemd-resolved status retrieved.",
    "Versión de Tailscale obtenida.": "Tailscale version retrieved.",
    "Comando completado.": "Command completed.",
    "No se encontró una herramienta necesaria para ejecutar este comando.": "A required tool was not found for this command.",
    "La autorización fue cancelada. No se aplicaron cambios.": "Authorization was canceled. No changes were applied.",
    "Tailscale está apagado. Usa el botón OFF para intentar encenderlo.": "Tailscale is off. Use the OFF button to try turning it on.",
    "No hay IP de Tailscale porque el servicio está apagado.": "There is no Tailscale IP because the service is off.",
    "Tailscale requiere iniciar sesión antes de continuar.": "Tailscale requires sign-in before continuing.",
    "El comando tardó demasiado y fue detenido por timeout.": "The command took too long and was stopped by timeout.",
    "SSH no pudo verificar la identidad del host. Abre SSH en una terminal y acepta la host key si confías en ese servidor.": "SSH could not verify the host identity. Open SSH in a terminal and accept the host key if you trust that server.",
    "SSH necesita una terminal interactiva. Usa el botón SSH para abrirlo en una terminal externa.": "SSH needs an interactive terminal. Use the SSH button to open it in an external terminal.",
    "El comando falló. Revisa la salida técnica para ver el detalle.": "The command failed. Check the technical output for details."
  };

  if (exact[message]) return exact[message];
  if (message.startsWith("Terminal SSH abierta para ")) {
    return message.replace(/^Terminal SSH abierta para (.+)\. La conexión continúa en esa terminal\.$/, "SSH terminal opened for $1. The connection continues in that terminal.");
  }
  if (message.startsWith("Ping ejecutado contra ")) {
    return message.replace(/^Ping ejecutado contra (.+)\.$/, "Ping executed against $1.");
  }
  if (message.startsWith("No se encontró '")) {
    return message.replace(/^No se encontró '(.+)' en PATH\. Instala el paquete requerido para tu distribución\.$/, "'$1' was not found in PATH. Install the required package for your distribution.");
  }
  return message;
}

function outputText(result: CommandResult | null, language: Language) {
  if (!result) return "";
  const stderr = result.stderr === result.message || result.stderr.startsWith("No se encontró '")
    ? translateResultMessage(result.stderr, language)
    : result.stderr;
  return [translateResultMessage(result.message, language), result.stdout, stderr].filter(Boolean).join("\n\n");
}

function commandTitle(result: CommandResult | null, fallback: string, language: Language) {
  if (!result) return fallback;
  if (result.command.includes("tailscale-control-ssh")) return "tailscale ssh";
  if (result.command.includes("dns-systemd-resolved")) return language === "es" ? "reparar DNS" : "repair DNS";
  return result.command;
}

function isOffline(node: NodeRow) {
  return node.state.includes("offline");
}

function displayNodeState(node: NodeRow, t: (key: TranslationKey) => string) {
  if (node.state === "-" || node.state === "online") return t("connected");
  if (node.state.startsWith("active")) return t("nodeActive");
  if (node.state.startsWith("idle")) return t("nodeIdle");
  if (!isOffline(node)) return node.state;
  if (node.state.includes("last seen")) {
    return node.state.replace("offline", t("offline")).replace("last seen", t("lastSeen"));
  }
  return t("offline");
}

function isLoginRequired(result: CommandResult | null) {
  const text = outputText(result, "en").toLowerCase();
  return (
    !result?.ok &&
    (text.includes("logged out") ||
      text.includes("not logged in") ||
      text.includes("needs login") ||
      text.includes("authenticate") ||
      text.includes("login"))
  );
}

function extractLoginUrl(result: CommandResult | null) {
  return outputText(result, "en").match(/https:\/\/login\.tailscale\.com\/[^\s]+/)?.[0] ?? "";
}

export function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("tailscale-control-theme");
    return saved === "light" ? "light" : "dark";
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("tailscale-control-language");
    return saved === "en" ? "en" : "es";
  });
  const [busy, setBusy] = useState<CommandName | "refresh" | null>(null);
  const [status, setStatus] = useState<CommandResult | null>(null);
  const [ip, setIp] = useState<CommandResult | null>(null);
  const [activeResult, setActiveResult] = useState<CommandResult | null>(null);
  const [environment, setEnvironment] = useState<LinuxEnvironment | null>(null);
  const [target, setTarget] = useState("");
  const t = (key: TranslationKey) => translations[language][key];

  const nodes = useMemo(() => parseNodes(status?.stdout ?? ""), [status]);
  const onlineCount = nodes.filter((node) => !isOffline(node)).length;
  const warning = status?.stdout.includes("Health check") || status?.stderr.includes("Health check");
  const missingRequiredTools = environment?.tools.filter((tool) => tool.required && !tool.path) ?? [];
  const toolByName = useMemo(() => new Map((environment?.tools ?? []).map((tool) => [tool.name, tool])), [environment]);
  const visibleTools = useMemo(
    () =>
      (environment?.tools ?? []).filter((tool) => {
        if (visibleToolNames.has(tool.name)) return true;
        return Boolean(tool.path && tool.name === environment?.terminal.name);
      }),
    [environment]
  );
  const hasTailscale = Boolean(toolByName.get("tailscale")?.path);
  const hasPkexec = Boolean(toolByName.get("pkexec")?.path);
  const hasTerminal = environment?.terminal.available ?? false;
  const preflightTone = !hasTailscale ? "danger" : !hasPkexec || !hasTerminal ? "warning" : "success";
  const preflightMessage = !hasTailscale ? t("preflightBlocked") : !hasPkexec || !hasTerminal ? t("preflightWarning") : t("preflightReady");
  const isConnected = status?.ok === true;
  const localNode = nodes[0];
  const loginRequired = isLoginRequired(status);
  const loginUrl = extractLoginUrl(status);
  const visibleIp = isConnected ? ip?.stdout : "";
  const canRunTargetCommand = isConnected && target.trim().length > 0;
  const headerStatus = missingRequiredTools.length
    ? t("missingTailscale")
    : loginRequired
      ? t("noSession")
      : warning
        ? t("checkDns")
        : isConnected
          ? t("operational")
          : t("disconnected");
  const statusTone = missingRequiredTools.length || warning
    ? "warning"
    : loginRequired || !isConnected
      ? "danger"
      : "success";

  async function run(command: CommandName, args: string[] = []) {
    setBusy(command);
    setActiveResult({
      ok: true,
      command,
      message: command === "login" ? t("loginOpening") : `${t("status")}: ${command}`,
      stdout: "",
      stderr: "",
      code: null
    });
    try {
      if (!window.tailscale) {
        throw new Error(t("bridgeUnavailable"));
      }
      const result = await window.tailscale.run(command, args);
      setActiveResult(result);
      if (command === "status") setStatus(result);
      if (command === "ip") setIp(result);
      return result;
    } catch (error) {
      const result: CommandResult = {
        ok: false,
        command,
        message: t("commandFailed"),
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        code: 1
      };
      setActiveResult(result);
      return result;
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy("refresh");
    try {
      if (!window.tailscale) {
        throw new Error(t("bridgeUnavailable"));
      }
      const [nextEnvironment, nextStatus, nextIp] = await Promise.all([
        window.tailscale.environment(),
        window.tailscale.run("status"),
        window.tailscale.run("ip")
      ]);
      setEnvironment(nextEnvironment);
      setStatus(nextStatus);
      setIp(nextIp);
      setActiveResult(nextStatus);
    } catch (error) {
      setActiveResult({
        ok: false,
        command: "refresh",
        message: t("refreshFailed"),
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        code: 1
      });
    } finally {
      setBusy(null);
    }
  }

  async function toggleConnection() {
    if (loginRequired) {
      await openLogin();
    } else if (isConnected) {
      await run("stop");
    } else {
      await run("start");
    }
    await refresh();
  }

  async function runAndRefresh(command: CommandName, args: string[] = []) {
    await run(command, args);
    await refresh();
  }

  async function openLogin() {
    if (loginUrl && window.tailscale) {
      setActiveResult({
        ok: true,
        command: "tailscale login",
        message: t("loginOpening"),
        stdout: loginUrl,
        stderr: "",
        code: null
      });
      await window.tailscale.openExternal(loginUrl);
      return;
    }
    await run("login");
  }

  async function openGithub() {
    await window.tailscale?.openExternal("https://github.com/giossue");
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tailscale-control-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("tailscale-control-language", language);
  }, [language]);

  useEffect(() => {
    if (!isConnected) {
      setTarget("");
      return;
    }
    if (!target && nodes[1]?.name) {
      setTarget(nodes[1].name);
    }
  }, [isConnected, nodes, target]);

  return (
    <main className="control-shell">
      <header className="control-topbar">
        <div className="brand">
          <span className="brand-mark">
            <img src={assetPath(theme === "dark" ? "tailscale-light.svg" : "tailscale.svg")} alt="" />
          </span>
          <div>
            <h1>Tailscale Control</h1>
            <p>{environment?.distro.prettyName || t("linuxLocal")}</p>
          </div>
        </div>

        <div className="top-controls">
          <Switch
            aria-label="Cambiar tema"
            isSelected={theme === "dark"}
            onValueChange={(selected) => setTheme(selected ? "dark" : "light")}
            thumbIcon={({ isSelected }) => (isSelected ? <Moon size={14} /> : <Sun size={14} />)}
          />
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly aria-label={t("settings")} className="settings-button" variant="light">
                <Settings2 size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t("settings")}>
              <DropdownItem key="language" startContent={<Globe2 size={16} />} onPress={() => setLanguage(language === "es" ? "en" : "es")}>
                {language === "es" ? "English" : "Español"}
              </DropdownItem>
              {isConnected ? (
                <DropdownItem key="logout" startContent={<Power size={16} />} onPress={() => void runAndRefresh("logout")} className="text-danger" color="danger">
                  {t("logout")}
                </DropdownItem>
              ) : (
                <DropdownItem key="login" startContent={<LogIn size={16} />} onPress={() => void openLogin()}>{t("login")}</DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      <section className="command-surface">
        <div className={isConnected ? "status-console connected" : "status-console disconnected"}>
          <button
            className={isConnected ? "status-ring connected" : "status-ring disconnected"}
            disabled={!hasTailscale}
            onClick={() => void toggleConnection()}
            type="button"
          >
            <span>{isConnected ? "ON" : "OFF"}</span>
          </button>
          <div className="status-copy">
            <h2>{loginRequired ? t("loginRequired") : localNode?.name || t("disconnected")}</h2>
            <div className="status-meta">
              <Kbd>{visibleIp || t("noIp")}</Kbd>
              <span>{nodes.length} {t("nodes")}</span>
              <span>{onlineCount} {t("active")}</span>
            </div>
          </div>
          <div className="status-actions">
            <Chip className={`state-chip ${statusTone}`} variant="flat">{headerStatus}</Chip>
            <Button
              isIconOnly
              aria-label={t("refresh")}
              className="status-refresh"
              variant="light"
              onPress={() => void refresh()}
              isLoading={busy === "refresh"}
            >
              <RefreshCcw size={18} />
            </Button>
          </div>
        </div>
      </section>

      <Tabs aria-label="Control" color="primary" variant="underlined" classNames={{ base: "tabs", panel: "tab-panel" }}>
        <Tab key="nodes" title={t("nodesTab")}>
          <section className="target-bar">
            <Input
              value={target}
              onValueChange={setTarget}
              startContent={<Search size={17} />}
              label={t("hostOrIp")}
              size="sm"
              className="target-input"
            />
            <Button startContent={<Activity size={17} />} onPress={() => void run("ping", [target])} isLoading={busy === "ping"} isDisabled={!canRunTargetCommand}>
              Ping
            </Button>
            <Button startContent={<Terminal size={17} />} variant="flat" onPress={() => void run("sshTerminal", [target])} isLoading={busy === "sshTerminal"} isDisabled={!canRunTargetCommand}>
              SSH
            </Button>
          </section>
          <section className="node-grid">
            {busy === "refresh" && !nodes.length ? (
              <div className="loading-panel">
                <Spinner color="current" />
              </div>
            ) : (
              nodes.map((node) => (
                <article className="node-card" key={`${node.ip}-${node.name}`}>
                  <div>
                    <div className="node-head">
                      <span className={isOffline(node) ? "node-dot offline" : "node-dot"} />
                      <strong>{node.name}</strong>
                    </div>
                    <p>{node.user}</p>
                  </div>
                  <Kbd className="node-ip">{node.ip}</Kbd>
                  <div className="node-foot">
                    <span>{node.os}</span>
                    <Chip className={isOffline(node) ? "node-state offline" : "node-state online"} size="sm" variant="flat">
                      {displayNodeState(node, t)}
                    </Chip>
                  </div>
                </article>
              ))
            )}
          </section>
          <section className="console-panel embedded-console">
            <div className="terminal-header">
              <span>{commandTitle(activeResult, t("noCommand"), language)}</span>
              <Button
                size="sm"
                variant="flat"
                startContent={<Clipboard size={15} />}
                onPress={() => void navigator.clipboard.writeText(outputText(activeResult, language))}
              >
                {t("copy")}
              </Button>
            </div>
            <pre className="terminal-output">{outputText(activeResult, language) || t("commandOutput")}</pre>
          </section>
        </Tab>

        <Tab key="commands" title={t("commandsTab")}>
          <section className="command-grid">
            {quickCommands.map((command) => (
              <Tooltip key={command.key} content={command.key === "repairDns" ? t("repairDnsTooltip") : command.key}>
                <Button
                  className="command-tile"
                  startContent={command.icon}
                  onPress={() => void (command.key === "repairDns" ? runAndRefresh(command.key) : run(command.key))}
                  isLoading={busy === command.key}
                  isDisabled={!hasTailscale}
                >
                  {t(command.labelKey)}
                </Button>
              </Tooltip>
            ))}
          </section>
          <section className="console-panel embedded-console">
            <div className="terminal-header">
              <span>{commandTitle(activeResult, t("noCommand"), language)}</span>
              <Button
                size="sm"
                variant="flat"
                startContent={<Clipboard size={15} />}
                onPress={() => void navigator.clipboard.writeText(outputText(activeResult, language))}
              >
                {t("copy")}
              </Button>
            </div>
            <pre className="terminal-output">{outputText(activeResult, language) || t("commandOutput")}</pre>
          </section>
        </Tab>

        <Tab key="system" title={t("systemTab")}>
          <section className={`preflight-panel ${preflightTone}`}>
            <div className="preflight-head">
              <div>
                <span>{t("preflightTitle")}</span>
                <strong>{preflightMessage}</strong>
              </div>
            </div>
            <div className="preflight-grid">
              <div className="preflight-item">
                <RequirementState ok={hasTailscale} />
                <div>
                  <span>{t("requiredDependency")}</span>
                  <strong>Tailscale</strong>
                </div>
                <code>{toolByName.get("tailscale")?.path || t("notFound")}</code>
              </div>
              <div className="preflight-item">
                <RequirementState ok={hasPkexec} />
                <div>
                  <span>{t("adminActions")}</span>
                  <strong>pkexec / Polkit</strong>
                </div>
                <code>{toolByName.get("pkexec")?.path || t("notFound")}</code>
              </div>
              <div className="preflight-item">
                <RequirementState ok={hasTerminal} />
                <div>
                  <span>{t("terminalIntegration")}</span>
                  <strong>{environment?.terminal.name || t("notFound")}</strong>
                </div>
                <code>{hasTerminal ? t("available") : t("notDetected")}</code>
              </div>
            </div>
            {!hasTailscale ? (
              <div className="install-box">
                <span>{t("installCommand")}</span>
                <code>{environment?.install.command}</code>
                <Button size="sm" variant="flat" startContent={<Clipboard size={15} />} onPress={() => void navigator.clipboard.writeText(environment?.install.command ?? "")}>
                  {t("copyCommand")}
                </Button>
                <p>{t("installNote")}: {environment?.install.note}</p>
              </div>
            ) : (
              <div className="install-box compact">
                <span>{t("operatorTip")}</span>
                <code>sudo tailscale set --operator=$USER</code>
              </div>
            )}
          </section>
          <section className="system-grid">
            <div className="system-panel">
              <div className="panel-title">
                <Settings2 size={17} />
                <span>{t("distribution")}</span>
              </div>
              <dl className="system-facts">
                <div>
                  <dt>{t("system")}</dt>
                  <dd>{environment?.distro.prettyName || t("notDetected")}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd>{environment?.distro.id || "-"}</dd>
                </div>
                <div>
                  <dt>systemd</dt>
                  <dd>{environment?.systemd ? t("available") : t("notDetected")}</dd>
                </div>
              </dl>
            </div>

            <div className="system-panel">
              <div className="panel-title">
                <Terminal size={17} />
                <span>{t("tools")}</span>
              </div>
              <div className="tool-list">
                {visibleTools.map((tool) => (
                  <div className="tool-item" key={tool.name}>
                    <div>
                      <strong>{tool.name}</strong>
                      <span>{tool.path || t("notFound")}</span>
                    </div>
                    <Chip className="tool-badge" size="sm" variant="flat">
                      {tool.required ? t("required") : t("optional")}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Tab>
      </Tabs>

      <footer className="app-footer">
        <span>{t("unofficialApp")}</span>
        <button type="button" onClick={() => void openGithub()}>
          <Github size={16} />
          <span>{t("createdBy")} Giossue</span>
        </button>
      </footer>
    </main>
  );
}
