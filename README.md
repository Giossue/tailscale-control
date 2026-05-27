# Tailscale Control

Panel de control local para Tailscale en Linux.

Tailscale Control no es una aplicación oficial de Tailscale Inc. Es una interfaz local e independiente para ejecutar comandos oficiales de Tailscale desde Linux.

La app envuelve comandos oficiales de Tailscale en una interfaz gráfica:

- Ver estado actual de Tailscale.
- Encender o desconectar Tailscale con `tailscale up` y `tailscale down`.
- Listar nodos del tailnet desde `tailscale status`.
- Ver IP local con `tailscale ip -4`.
- Ejecutar diagnósticos con `tailscale netcheck`, `tailscale dns status` y `resolvectl status`.
- Abrir SSH con `tailscale ssh` en una terminal externa.
- Reparar configuración DNS común en sistemas con `systemd-resolved` y NetworkManager usando `pkexec`.
- Cambiar idioma entre español e inglés.
- Usar modo claro u oscuro.

## Estado

Primera versión funcional para Linux. Está pensada como una interfaz local para comandos de Tailscale, no como reemplazo del cliente oficial.

## Requisitos

- Linux.
- Tailscale instalado.
- `tailscaled` disponible y habilitado en el sistema.
- `pkexec`/Polkit para acciones administrativas como login, up, down y reparación DNS.
- Opcional: una terminal compatible para SSH (`xdg-terminal-exec`, `konsole`, `gnome-terminal`, `kgx`, `xfce4-terminal`, `alacritty`, `kitty`, `foot` o `xterm`).

## Desarrollo

Este proyecto usa Bun para desarrollo y empaquetado.

```bash
bun install
bun run dev
```

Build local:

```bash
bun run build
```

Generar paquetes Linux:

```bash
bun run dist
```

Los artefactos se generan en `release/`:

- `.AppImage`
- `.deb`
- `.rpm`
- `.pacman`

## Instalación

### AppImage

Opción portable para la mayoría de distribuciones Linux:

```bash
curl -L -o tailscale-control.AppImage https://github.com/Giossue/tailscale-control/releases/download/v0.1.0-beta.1/Tailscale.Control-0.1.0.AppImage
chmod +x tailscale-control.AppImage
./tailscale-control.AppImage
```

### Debian, Ubuntu y derivadas

```bash
curl -L -o tailscale-control.deb https://github.com/Giossue/tailscale-control/releases/download/v0.1.0-beta.1/tailscale-control_0.1.0_amd64.deb
sudo apt install ./tailscale-control.deb
```

### Fedora, RHEL, openSUSE y derivadas RPM

```bash
curl -L -o tailscale-control.rpm https://github.com/Giossue/tailscale-control/releases/download/v0.1.0-beta.1/tailscale-control-0.1.0.x86_64.rpm
sudo dnf install ./tailscale-control.rpm
```

En openSUSE:

```bash
sudo zypper install ./tailscale-control.rpm
```

### Arch Linux, CachyOS, EndeavourOS y derivadas

```bash
curl -L -o tailscale-control.pacman https://github.com/Giossue/tailscale-control/releases/download/v0.1.0-beta.1/tailscale-control-0.1.0.pacman
sudo pacman -U ./tailscale-control.pacman
```

## Desinstalación

```bash
sudo apt remove tailscale-control
sudo dnf remove tailscale-control
sudo pacman -R tailscale-control
```

## Seguridad

La app ejecuta comandos locales de Tailscale. Las acciones que modifican estado usan `pkexec`, por lo que el sistema pedirá autorización antes de aplicar cambios administrativos.

## Licencia

MIT
