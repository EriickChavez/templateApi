import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

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
    
    const metric: PerformanceMetrics = {
      requestId: req.requestId || 'unknown',
      correlationId: req.correlationId || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      memoryUsage: process.memoryUsage(),
      cpuUsage: performanceMonitor.getCpuUsage(),
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress || 'unknown',
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
    
    // Calcular promedios
    Object.keys(methodStats).forEach(method => {
      methodStats[method].avgTime = Math.round(
        methodStats[method].avgTime / methodStats[method].count
      );
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
    
    // Calcular promedios y ordenar por tiempo de respuesta
    const topSlowEndpoints = Object.entries(endpointStats)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgTime: Math.round(data.avgTime / data.count),
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
