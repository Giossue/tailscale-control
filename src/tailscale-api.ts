export type CommandName =
  | "status"
  | "ip"
  | "version"
  | "netcheck"
  | "dnsStatus"
  | "resolvedStatus"
  | "login"
  | "logout"
  | "start"
  | "stop"
  | "repairDns"
  | "ping"
  | "ssh"
  | "sshTerminal";

export interface CommandResult {
  ok: boolean;
  command: string;
  message: string;
  stdout: string;
  stderr: string;
  code: number | null;
}

export interface ToolAvailability {
  name: string;
  path: string | null;
  required: boolean;
}

export interface LinuxEnvironment {
  distro: {
    id: string;
    name: string;
    version: string;
    prettyName: string;
  };
  tools: ToolAvailability[];
  systemd: boolean;
  terminal: {
    available: boolean;
    name: string | null;
  };
  install: {
    command: string;
    note: string;
  };
}

export interface TailscaleApi {
  run: (command: CommandName, args?: string[]) => Promise<CommandResult>;
  environment: () => Promise<LinuxEnvironment>;
  openExternal: (url: string) => Promise<void>;
}
