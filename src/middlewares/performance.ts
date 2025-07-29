import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
const MAX_COMMAND_TIMEOUT_MS = 1800; // 1.8 seconds

interface DiskInfo {
  total: number;
  used: number;
  free: number;
}

interface NetworkTraffic {
  bytesIn: number | 'N/A';
  bytesOut: number | 'N/A';
}

interface SystemMetrics {
  system_load: number;
  disk_space: {
    total: number | 'N/A';
    used: number | 'N/A';
    free: number | 'N/A';
    usagePercent: number | 'N/A';
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
  processes: number | 'N/A';
  connections: number | 'N/A';
  network_traffic: NetworkTraffic;
  users_active: number | 'N/A';
}

// Interface para métricas de performance
interface PerformanceMetrics {
  requestId: string;
  correlationId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
  timestamp: string;
  userAgent?: string;
  ip: string;
  userId?: string;
}

// Store para métricas en memoria (en producción usar Redis o base de datos)
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Mantener solo las últimas 1000 métricas
  private slowRequestThreshold = 1000; // 1 segundo
  private cpuStartUsage?: NodeJS.CpuUsage;

  startCpuMeasurement() {
    this.cpuStartUsage = process.cpuUsage();
  }

  getCpuUsage() {
    if (!this.cpuStartUsage) return undefined;
    return process.cpuUsage(this.cpuStartUsage);
  }

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Mantener solo las últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log para requests lentos
    if (metric.duration > this.slowRequestThreshold) {
      console.warn(`🐌 SLOW REQUEST: ${metric.method} ${metric.url} - ${metric.duration}ms`, {
        requestId: metric.requestId,
        correlationId: metric.correlationId,
        duration: metric.duration,
        memoryUsage: metric.memoryUsage,
        cpuUsage: metric.cpuUsage
      });
    }
  }

  getMetrics(limit: number = 100) {
    return this.metrics.slice(-limit);
  }

  getAverageResponseTime(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );

    if (recentMetrics.length === 0) return 0;

    const total = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return Math.round(total / recentMetrics.length);
  }

  getSlowRequests(threshold: number = 1000, limit: number = 10) {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getErrorRate(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );

    if (recentMetrics.length === 0) return 0;

    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
    return Math.round((errors / recentMetrics.length) * 100);
  }

  getStats(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
        currentMemory: process.memoryUsage()
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = this.getAverageResponseTime(minutes);
    const errorRate = this.getErrorRate(minutes);
    const slowRequests = recentMetrics.filter(m => m.duration > this.slowRequestThreshold).length;

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowRequests,
      currentMemory: process.memoryUsage(),
      timeWindow: `${minutes} minutes`
    };
  }
}

/**
 * Ejecuta un comando shell con timeout y devuelve stdout como string.
 * En caso de error o timeout, retorna null.
 */
async function runCmdSafe(command: string): Promise<string | null> {
  try {
    const execPromise = execAsync(command);
    const timeout = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Command timeout')), MAX_COMMAND_TIMEOUT_MS)
    );

    const { stdout } = await Promise.race([execPromise, timeout]) as { stdout: string };
    if (typeof stdout === 'string') return stdout.trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene número de procesos corriendo (macOS, Linux, Windows)
 */
async function getProcessCount(): Promise<number | 'N/A'> {
  const platform = os.platform();
  let cmd = '';
  if (platform === 'win32') {
    // Windows: wmic process get /value
    cmd = 'wmic process get ProcessId | find /c /v ""';
  } else {
    // unix-like: ps aux | wc -l
    cmd = 'ps aux | wc -l';
  }
  const result = await runCmdSafe(cmd);
  if (result === null) return 'N/A';
  const count = parseInt(result);
  return isNaN(count) ? 'N/A' : Math.max(0, count - 1); // -1 to exclude header
}

/**
 * Obtiene cantidad de conexiones activas establecidas (multiplataforma)
 */
async function getActiveConnections(): Promise<number | 'N/A'> {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: netstat -an | find /c ESTABLISHED
    const cmd = 'netstat -an | find /c "ESTABLISHED"';
    const result = await runCmdSafe(cmd);
    if (result === null) return 'N/A';
    const count = parseInt(result);
    return isNaN(count) ? 'N/A' : count;
  } else {
    // unix-like: netstat -an | grep ESTABLISHED | wc -l
    const cmd = 'netstat -an | grep ESTABLISHED | wc -l';
    const result = await runCmdSafe(cmd);
    if (result === null) return 'N/A';
    const count = parseInt(result);
    return isNaN(count) ? 'N/A' : count;
  }
}

/**
 * Obtiene info de disco para la partición raíz (multiplataforma)
 */
async function getDiskInfo(): Promise<DiskInfo | null> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows: Usar wmic logicaldisk
      const cmd = 'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:value';
      const output = await runCmdSafe(cmd);
      if (!output) return null;

      const sizeMatch = output.match(/Size=(\d+)/);
      const freeMatch = output.match(/FreeSpace=(\d+)/);
      if (!sizeMatch || !freeMatch) return null;

      const total = parseInt(sizeMatch[1]);
      const free = parseInt(freeMatch[1]);
      if (isNaN(total) || isNaN(free)) return null;

      const used = total - free;
      return { total, used, free };
    } else {
      // Unix-like: df --block-size=1 / para bytes exactos
      const cmd = 'df --block-size=1 / | tail -1';
      const output = await runCmdSafe(cmd);
      if (!output) return null;

      const parts = output.split(/\s+/);
      if (parts.length < 6) return null;

      // parts: Filesystem Size Used Avail Use% Mounted_on
      const total = parseInt(parts[1]); // Size total bytes
      const used = parseInt(parts[2]);  // Used bytes
      const free = parseInt(parts[3]);  // Available bytes

      if ([total, used, free].some(isNaN)) return null;
      return { total, used, free };
    }
  } catch {
    return null;
  }
}

/**
 * Obtiene tráfico de red total bytes (in/out) desde interfaces físicas activas (multiplataforma)
 */
async function getNetworkTraffic(): Promise<NetworkTraffic> {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: no acceso nativo fácil a bytes recibido/enviado directamente sin módulos
    return { bytesIn: 'N/A', bytesOut: 'N/A' };
  } else {
    // Unix-like: usar netstat -ib o ifconfig
    // Acumulamos info de bytes recibidos y enviados de interfaces no loopback
    try {
      const output = await runCmdSafe('netstat -ib');
      if (!output) return { bytesIn: 'N/A', bytesOut: 'N/A' };

      const lines = output.split('\n');
      let bytesInTotal = 0;
      let bytesOutTotal = 0;

      for (const line of lines) {
        const cols = line.trim().split(/\s+/);
        if (cols.length < 10) continue;

        const iface = cols[0];
        if (iface === 'lo0' || iface.startsWith('lo')) continue; // ignorar loopback

        // columnas con bytes recibidos y enviados dependen del SO, en macOS netstat -ib
        // Rx bytes está en 6a columna o 5a según versión, Tx bytes 9a o 8a
        // Asumiendo columnas 6 y 9 (base cero 5 y 8)
        const bytesInStr = cols[6];
        const bytesOutStr = cols[9];
        const bytesIn = parseInt(bytesInStr, 10);
        const bytesOut = parseInt(bytesOutStr, 10);

        if (!isNaN(bytesIn)) bytesInTotal += bytesIn;
        if (!isNaN(bytesOut)) bytesOutTotal += bytesOut;
      }

      return { bytesIn: bytesInTotal, bytesOut: bytesOutTotal };
    } catch {
      return { bytesIn: 'N/A', bytesOut: 'N/A' };
    }
  }
}

/**
 * Obtiene usuarios activos con sesiones JWT válidas en últimos 5 minutos.
 * Esta función requiere acceso al sistema de sesiones o base de datos.
 */
async function getActiveUsers(): Promise<number | 'N/A'> {
  // TODO: Implementar conteo de usuarios con sesiones JWT activas
  // Ejemplo: consultar base de datos o caché redis con sesiones activas
  // const activeSessionsCount = await redis.zcount('active_sessions', Date.now() - 300000, Date.now());
  // return activeSessionsCount;
  return 'N/A';
}

/**
 * Obtener métricas del sistema combinando todas las anteriores
 */
export async function getRealSystemMetrics(): Promise<SystemMetrics> {
  // Métricas básicas
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const loadAvg = os.loadavg()[0] || 0;

  // Ejecutar tareas en paralelo para no bloquear event loop
  const [diskInfo, processCount, activeConnections, netTraffic, activeUsers] = await Promise.all([
    getDiskInfo(),
    getProcessCount(),
    getActiveConnections(),
    getNetworkTraffic(),
    getActiveUsers()
  ]);

  return {
    system_load: loadAvg,
    disk_space: diskInfo
      ? {
          total: diskInfo.total,
          used: diskInfo.used,
          free: diskInfo.free,
          usagePercent: Math.round((diskInfo.used / diskInfo.total) * 100),
        }
      : {
          total: 'N/A',
          used: 'N/A',
          free: 'N/A',
          usagePercent: 'N/A',
        },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
    },
    processes: processCount,
    connections: activeConnections,
    network_traffic: netTraffic,
    users_active: activeUsers,
  };
}

// Instancia global del monitor
export const performanceMonitor = new PerformanceMonitor();

// Middleware para capturar métricas de performance
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  performanceMonitor.startCpuMeasurement();

  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // Validar y sanitizar valores para evitar undefined/NaN
    const memUsage = process.memoryUsage();
    const cpuUsage = performanceMonitor.getCpuUsage();
    
    const metric: PerformanceMetrics = {
      requestId: req.requestId || 'unknown',
      correlationId: req.correlationId || 'unknown',
      method: req.method || 'UNKNOWN',
      url: req.originalUrl || req.url || '/unknown',
      statusCode: res.statusCode || 0,
      duration: isNaN(duration) ? 0 : Math.max(0, duration),
      memoryUsage: {
        rss: memUsage.rss || 0,
        heapUsed: memUsage.heapUsed || 0,
        heapTotal: memUsage.heapTotal || 0,
        external: memUsage.external || 0
      },
      cpuUsage: cpuUsage ? {
        user: cpuUsage.user || 0,
        system: cpuUsage.system || 0
      } : undefined,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userId: (req as any).user?.id
    };

    performanceMonitor.addMetric(metric);
    
    return originalSend.call(this, data);
  };

  next();
};

// Middleware para endpoints de métricas (solo para admins)
export const metricsEndpoints = {
  // GET /metrics - estadísticas generales
  getStats: async (req: Request, res: Response) => {
    const minutes = parseInt(req.query.minutes as string) || 5;
    const stats = performanceMonitor.getStats(minutes);
    
    res.json({
      success: true,
      message: 'Performance statistics retrieved',
      data: stats,
      meta: {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  },

  // GET /metrics/performance - performance detallada
  getPerformanceDetails: async (req: Request, res: Response) => {
    const minutes = parseInt(req.query.minutes as string) || 5;
    const stats = performanceMonitor.getStats(minutes);
    const recentMetrics = performanceMonitor.getMetrics(100);
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calcular estadísticas por método HTTP
    const methodStats: { [key: string]: { count: number; avgTime: number } } = {};
    recentMetrics.forEach(metric => {
      if (!methodStats[metric.method]) {
        methodStats[metric.method] = { count: 0, avgTime: 0 };
      }
      methodStats[metric.method].count++;
      methodStats[metric.method].avgTime += metric.duration;
    });
    
    // Calcular promedios (evitar división por cero)
    Object.keys(methodStats).forEach(method => {
      if (methodStats[method].count > 0) {
        methodStats[method].avgTime = Math.round(
          methodStats[method].avgTime / methodStats[method].count
        );
      } else {
        methodStats[method].avgTime = 0;
      }
    });
    
    // Top endpoints más lentos
    const endpointStats: { [key: string]: { count: number; avgTime: number; maxTime: number } } = {};
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.url}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { count: 0, avgTime: 0, maxTime: 0 };
      }
      endpointStats[key].count++;
      endpointStats[key].avgTime += metric.duration;
      endpointStats[key].maxTime = Math.max(endpointStats[key].maxTime, metric.duration);
    });
    
    // Calcular promedios y ordenar por tiempo de respuesta (evitar división por cero)
    const topSlowEndpoints = Object.entries(endpointStats)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgTime: data.count > 0 ? Math.round(data.avgTime / data.count) : 0,
        maxTime: data.maxTime
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
    
    const detailedStats = {
      overview: {
        totalRequests: stats.totalRequests,
        averageResponseTime: stats.averageResponseTime,
        errorRate: stats.errorRate,
        slowRequests: stats.slowRequests,
        timeWindow: `${minutes} minutes`
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        arrayBuffers: memUsage.arrayBuffers ? Math.round(memUsage.arrayBuffers / 1024 / 1024) : 0
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
        system: Math.round(cpuUsage.system / 1000)
      },
      methodStats,
      topSlowEndpoints,
      thresholds: {
        slowRequestThreshold: '1000ms',
        errorRateWarning: '10%',
        errorRateCritical: '25%'
      }
    };
    
    res.json({
      success: true,
      message: 'Detailed performance metrics retrieved',
      data: detailedStats,
      meta: {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        version: req.apiVersion
      }
    });
  },

  // GET /metrics/system - información detallada del sistema
  getSystemInfo: async (req: Request, res: Response) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Formatear uptime de manera legible
    const formatUptime = (seconds: number) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      let formatted = '';
      if (days > 0) formatted += `${days}d `;
      if (hours > 0) formatted += `${hours}h `;
      if (minutes > 0) formatted += `${minutes}m `;
      formatted += `${secs}s`;
      
      return formatted.trim();
    };
    
    // Información del sistema operativo
    const os = require('os');
    const fs = require('fs');
    const { promisify } = require('util');
    
    // Función para obtener información del disco
    const getDiskInfo = async () => {
      try {
        if (process.platform === 'win32') {
          // Windows: usar wmic o powershell
          const { exec } = require('child_process');
          const execAsync = promisify(exec);
          const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
          // Parsear resultado de Windows
          return { total: 0, free: 0, used: 0 }; // Simplificado para el ejemplo
        } else {
          // Unix/Linux/macOS: usar df command
          const { exec } = require('child_process');
          const execAsync = promisify(exec);
          const { stdout } = await execAsync('df -h / | tail -1');
          const parts = stdout.trim().split(/\s+/);
          
          const parseSize = (sizeStr: string): number => {
            const match = sizeStr.match(/(\d+(?:\.\d+)?)([KMGT]?)i?/);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2] || '';
            const multipliers: { [key: string]: number } = { '': 1, 'K': 1024, 'M': 1024**2, 'G': 1024**3, 'T': 1024**4 };
            return value * (multipliers[unit] || 1);
          };
          
          const total = parseSize(parts[1]);
          const used = parseSize(parts[2]);
          const free = parseSize(parts[3]);
          
          return { total, used, free };
        }
      } catch (error) {
        console.warn('Could not get disk info:', error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    };
    
    // Obtener información del disco
    const diskInfo = await getDiskInfo();
    
    const systemInfo = {
      runtime: {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          uptime: formatUptime(uptime),
          uptimeSeconds: Math.floor(uptime)
        },
        environment: process.env.NODE_ENV || 'development',
        execPath: process.execPath
      },
      memory: {
        process: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
          arrayBuffers: memUsage.arrayBuffers ? `${Math.round(memUsage.arrayBuffers / 1024 / 1024)} MB` : '0 MB'
        },
        system: {
          total: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
          free: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
          used: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024)} GB`,
          usagePercent: `${Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`
        }
      },
      cpu: {
        process: {
          user: `${Math.round(cpuUsage.user / 1000)}ms`,
          system: `${Math.round(cpuUsage.system / 1000)}ms`
        },
        system: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown',
          speed: `${os.cpus()[0]?.speed || 0} MHz`,
          loadAverage: os.loadavg().map((load: number) => Math.round(load * 100) / 100)
        }
      },
      disk: diskInfo ? {
        total: `${Math.round(diskInfo.total / 1024 / 1024 / 1024)} GB`,
        used: `${Math.round(diskInfo.used / 1024 / 1024 / 1024)} GB`,
        free: `${Math.round(diskInfo.free / 1024 / 1024 / 1024)} GB`,
        usagePercent: `${Math.round((diskInfo.used / diskInfo.total) * 100)}%`
      } : {
        total: 'N/A',
        used: 'N/A',
        free: 'N/A',
        usagePercent: 'N/A',
        error: 'Disk information not available'
      },
      os: {
        type: os.type(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: formatUptime(os.uptime()),
        networkInterfaces: Object.keys(os.networkInterfaces() || {})
      },
      limits: {
        maxMemory: process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
          ? process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] + ' MB'
          : 'Default (~1.4GB)',
        fileDescriptors: 'N/A' // Podría implementarse en sistemas Unix
      },
      versions: {
        node: process.version,
        v8: process.versions.v8,
        uv: process.versions.uv,
        zlib: process.versions.zlib,
        openssl: process.versions.openssl,
        modules: process.versions.modules
      }
    };
    
    res.json({
      success: true,
      message: 'Detailed system information retrieved',
      data: systemInfo,
      meta: {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        version: req.apiVersion
      }
    });
  },

  // GET /metrics/slow - requests más lentos
  getSlowRequests: async (req: Request, res: Response) => {
    const threshold = parseInt(req.query.threshold as string) || 1000;
    const limit = parseInt(req.query.limit as string) || 10;
    const slowRequests = performanceMonitor.getSlowRequests(threshold, limit);
    
    res.json({
      success: true,
      message: 'Slow requests retrieved',
      data: slowRequests,
      meta: {
        correlationId: req.correlationId,
        threshold: `${threshold}ms`,
        limit,
        timestamp: new Date().toISOString()
      }
    });
  },

  // GET /metrics/recent - métricas recientes
  getRecentMetrics: async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const metrics = performanceMonitor.getMetrics(limit);
    
    res.json({
      success: true,
      message: 'Recent metrics retrieved',
      data: metrics,
      meta: {
        correlationId: req.correlationId,
        limit,
        total: metrics.length,
        timestamp: new Date().toISOString()
      }
    });
  },

  // GET /metrics/health - health check con métricas
  getHealthWithMetrics: async (req: Request, res: Response) => {
    const stats = performanceMonitor.getStats(5);
    const uptime = process.uptime();
    
    const health = {
      status: 'healthy',
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: process.memoryUsage(),
      performance: stats,
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    // Determinar estado de salud basado en métricas
    if (stats.errorRate > 10) {
      health.status = 'degraded';
    }
    if (stats.errorRate > 25 || stats.averageResponseTime > 5000) {
      health.status = 'unhealthy';
    }

    res.json({
      success: true,
      message: 'Health check with performance metrics',
      data: health,
      meta: {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }
};
