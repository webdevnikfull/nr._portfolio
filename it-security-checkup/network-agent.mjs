import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const windowsScript = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$interfaces = @()
$connections = @()
$statsAvailable = $false
$connectionsAvailable = $false
try {
  $adapters = @([System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() | Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback' })
  $interfaces = @($adapters | ForEach-Object {
    $adapter = $_
    $stats = $adapter.GetIPStatistics()
    [pscustomobject]@{
      id = [string]$adapter.Id
      name = [string]$adapter.Name
      description = [string]$adapter.Description
      isDefault = [bool]($adapter.GetIPProperties().GatewayAddresses.Count -gt 0)
      receivedBytes = [double]$stats.BytesReceived
      sentBytes = [double]$stats.BytesSent
    }
  })
  $statsAvailable = $true
} catch {}
try {
  $properties = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
  $active = @($properties.GetActiveTcpConnections() | ForEach-Object {
      [pscustomobject]@{ localAddress = [string]$_.LocalEndPoint.Address; localPort = [int]$_.LocalEndPoint.Port; remoteAddress = [string]$_.RemoteEndPoint.Address; remotePort = [int]$_.RemoteEndPoint.Port; state = [string]$_.State }
  })
  $listeners = @($properties.GetActiveTcpListeners() | ForEach-Object {
    [pscustomobject]@{ localAddress = [string]$_.Address; localPort = [int]$_.Port; remoteAddress = ''; remotePort = $null; state = 'Listen' }
  })
  $connections = @($active + $listeners | Select-Object -First 150)
  $connectionsAvailable = $true
} catch {}
[pscustomobject]@{ interfaces = $interfaces; connections = $connections; statsAvailable = $statsAvailable; connectionsAvailable = $connectionsAvailable } | ConvertTo-Json -Depth 5 -Compress
`;

export function calculateRates(current, previous, elapsedSeconds) {
  return current.map(item => {
    const before = previous?.find(entry => entry.id === item.id);
    const valid = before && elapsedSeconds > 0 && item.receivedBytes >= before.receivedBytes && item.sentBytes >= before.sentBytes;
    return { ...item,
      receiveRate: valid ? (item.receivedBytes - before.receivedBytes) / elapsedSeconds : null,
      sendRate: valid ? (item.sentBytes - before.sentBytes) / elapsedSeconds : null,
    };
  });
}

export async function readNetworkSnapshot() {
  if (process.platform !== 'win32') return { interfaces: [], connections: [], statsAvailable: false, connectionsAvailable: false, error: 'unsupportedPlatform' };
  const { stdout } = await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', windowsScript], {
    windowsHide: true, timeout: 15000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8',
  });
  const data = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
  if (!Array.isArray(data.interfaces) || !Array.isArray(data.connections)) throw new Error('Invalid telemetry');
  data.interfaces = data.interfaces.filter(item => typeof item.id === 'string' && typeof item.name === 'string' && Number.isFinite(item.receivedBytes) && item.receivedBytes >= 0 && Number.isFinite(item.sentBytes) && item.sentBytes >= 0);
  return data;
}

export function createNetworkMonitor(reader = readNetworkSnapshot) {
  let snapshot = { status: 'warming', scope: 'local-device', localOnly: true, interfaces: [], connections: [] };
  let previous = null;
  let previousTick = null;
  let timer = null;
  let running = false;
  let lastVisit = 0;
  let stopped = false;

  async function sample() {
    if (running || stopped) return;
    timer = null;
    running = true;
    try {
      const data = await reader();
      const tick = performance.now();
      const elapsed = previousTick === null ? 0 : (tick - previousTick) / 1000;
      const interfaces = calculateRates(data.interfaces, previous, elapsed);
      snapshot = { ...data, interfaces, time: new Date().toISOString(), status: data.statsAvailable ? 'ready' : 'unavailable', scope: 'local-device', localOnly: true };
      previous = data.interfaces;
      previousTick = tick;
    } catch {
      snapshot = { status: 'unavailable', error: 'telemetryUnavailable', scope: 'local-device', localOnly: true, interfaces: [], connections: [], time: new Date().toISOString() };
      previous = null;
      previousTick = null;
    } finally {
      running = false;
      if (!stopped && Date.now() - lastVisit < 15000) timer = setTimeout(sample, 2000);
    }
  }

  return {
    getSnapshot() {
      lastVisit = Date.now();
      if (!running && !timer && !stopped) void sample();
      return snapshot;
    },
    stop() { stopped = true; clearTimeout(timer); timer = null; },
  };
}
