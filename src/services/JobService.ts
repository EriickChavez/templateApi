import Agenda, { Job } from 'agenda';
import { config } from '../config/env';

// Interfaces para jobs
export interface JobData {
  [key: string]: any;
}

export interface JobOptions {
  priority?: string;
  delay?: string | Date;
  repeatInterval?: string;
  repeatAt?: string;
  unique?: boolean;
}

export interface JobResult {
  success: boolean;
  result?: any;
  error?: string;
  executedAt: Date;
  duration: number;
}

// Tipos de jobs disponibles
export enum JobTypes {
  SEND_EMAIL = 'send-email',
  PROCESS_IMAGE = 'process-image',
  CLEANUP_TEMP_FILES = 'cleanup-temp-files',
  GENERATE_REPORT = 'generate-report',
  SYNC_DATABASE = 'sync-database',
  SEND_NOTIFICATION = 'send-notification',
  BACKUP_DATA = 'backup-data'
}

// Job Service para manejar tareas en background
export class JobService {
  private agenda: Agenda;
  private isConnected = false;

  constructor() {
    if (!config.DATABASE_URL) {
      throw new Error('JobService requires DATABASE_URL to be configured');
    }
    
    // Configurar Agenda
    this.agenda = new Agenda({
      db: {
        address: config.DATABASE_URL,
        collection: 'jobs'
      },
      processEvery: '10 seconds', // Procesar jobs cada 10 segundos
      maxConcurrency: 5, // Máximo 5 jobs concurrentes
      defaultConcurrency: 3, // 3 jobs por defecto
      defaultLockLifetime: 10000 // 10 segundos de lock
    });

    this.setupEventListeners();
    this.defineJobs();
  }

  // Inicializar el servicio
  async initialize(): Promise<void> {
    try {
      await this.agenda.start();
      this.isConnected = true;
      console.log('✅ Job Service initialized successfully');
      
      // Programar jobs recurrentes
      await this.scheduleRecurringJobs();
    } catch (error) {
      console.error('❌ Failed to initialize Job Service:', error);
      throw error;
    }
  }

  // Cerrar conexiones
  async shutdown(): Promise<void> {
    if (this.isConnected) {
      await this.agenda.stop();
      this.isConnected = false;
      console.log('🔌 Job Service shut down successfully');
    }
  }

  // Programar un job
  async scheduleJob(
    jobType: JobTypes, 
    data: JobData, 
    options: JobOptions = {}
  ): Promise<string> {
    try {
      const job = this.agenda.create(jobType, data);
      
      // Aplicar opciones
      if (options.priority) {
        job.priority(options.priority);
      }
      
      if (options.delay) {
        job.schedule(options.delay);
      }
      
      if (options.repeatInterval) {
        job.repeatEvery(options.repeatInterval);
      }
      
      if (options.repeatAt) {
        job.repeatAt(options.repeatAt);
      }
      
      if (options.unique) {
        job.unique(data);
      }

      await job.save();
      
      console.log(`📋 Job scheduled: ${jobType}`, {
        jobId: job.attrs._id,
        data,
        options
      });
      
      return job.attrs._id?.toString() || '';
    } catch (error) {
      console.error(`❌ Failed to schedule job ${jobType}:`, error);
      throw error;
    }
  }

  // Cancelar un job
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const numRemoved = await this.agenda.cancel({ _id: jobId });
      return (numRemoved || 0) > 0;
    } catch (error) {
      console.error(`❌ Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  // Obtener estadísticas de jobs
  async getJobStats(): Promise<any> {
    try {
      // Using agenda's internal _collection property to access MongoDB collection
      const collection = (this.agenda as any)._collection;
      if (!collection) {
        throw new Error('Database collection not available');
      }
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: '$name',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$lastFinishedAt', null] }, 0, 1] }
            },
            failed: {
              $sum: { $cond: [{ $ne: ['$failedAt', null] }, 1, 0] }
            },
            running: {
              $sum: { $cond: [{ $ne: ['$lockedAt', null] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      return stats;
    } catch (error) {
      console.error('❌ Failed to get job stats:', error);
      return [];
    }
  }

  // Event listeners
  private setupEventListeners(): void {
    this.agenda.on('ready', () => {
      console.log('📋 Agenda is ready');
    });

    this.agenda.on('start', (job) => {
      console.log(`🚀 Job started: ${job.attrs.name}`, {
        jobId: job.attrs._id,
        data: job.attrs.data
      });
    });

    this.agenda.on('complete', (job) => {
      console.log(`✅ Job completed: ${job.attrs.name}`, {
        jobId: job.attrs._id,
        duration: job.attrs.lastFinishedAt! - job.attrs.lastRunAt!
      });
    });

    this.agenda.on('fail', (error, job) => {
      console.error(`❌ Job failed: ${job.attrs.name}`, {
        jobId: job.attrs._id,
        error: error.message,
        data: job.attrs.data
      });
    });
  }

  // Definir todos los jobs
  private defineJobs(): void {
    // Job para enviar emails
    this.agenda.define(JobTypes.SEND_EMAIL, async (job: Job) => {
      const { to, subject, body, correlationId } = job.attrs.data;
      const startTime = Date.now();
      
      try {
        console.log(`📧 Sending email to: ${to}`, { correlationId });
        
        // Aquí iría la lógica real de envío de email
        // Por ejemplo: await emailService.send(to, subject, body);
        
        // Simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result: JobResult = {
          success: true,
          result: { emailSent: true, recipient: to },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log(`✅ Email sent successfully to: ${to}`);
        return result;
      } catch (error) {
        console.error(`❌ Failed to send email to: ${to}`, error);
        throw error;
      }
    });

    // Job para procesar imágenes
    this.agenda.define(JobTypes.PROCESS_IMAGE, async (job: Job) => {
      const { imageUrl, operations, correlationId } = job.attrs.data;
      const startTime = Date.now();
      
      try {
        console.log(`🖼️ Processing image: ${imageUrl}`, { correlationId });
        
        // Aquí iría la lógica de procesamiento de imagen
        // Por ejemplo: resize, compress, etc.
        
        // Simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const result: JobResult = {
          success: true,
          result: { processedUrl: `${imageUrl}_processed` },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log(`✅ Image processed successfully: ${imageUrl}`);
        return result;
      } catch (error) {
        console.error(`❌ Failed to process image: ${imageUrl}`, error);
        throw error;
      }
    });

    // Job para limpiar archivos temporales
    this.agenda.define(JobTypes.CLEANUP_TEMP_FILES, async (job: Job) => {
      const startTime = Date.now();
      
      try {
        console.log('🧹 Cleaning up temporary files...');
        
        // Aquí iría la lógica de limpieza
        // Por ejemplo: eliminar archivos más antiguos que X días
        
        // Simular limpieza
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result: JobResult = {
          success: true,
          result: { filesDeleted: 42 },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log('✅ Temporary files cleaned up successfully');
        return result;
      } catch (error) {
        console.error('❌ Failed to clean up temporary files:', error);
        throw error;
      }
    });

    // Job para generar reportes
    this.agenda.define(JobTypes.GENERATE_REPORT, async (job: Job) => {
      const { reportType, filters, userId, correlationId } = job.attrs.data;
      const startTime = Date.now();
      
      try {
        console.log(`📊 Generating report: ${reportType}`, { correlationId, userId });
        
        // Aquí iría la lógica de generación de reportes
        
        // Simular generación
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const result: JobResult = {
          success: true,
          result: { 
            reportUrl: `/reports/${reportType}_${Date.now()}.pdf`,
            recordCount: 150
          },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log(`✅ Report generated successfully: ${reportType}`);
        return result;
      } catch (error) {
        console.error(`❌ Failed to generate report: ${reportType}`, error);
        throw error;
      }
    });

    // Job para sincronizar base de datos
    this.agenda.define(JobTypes.SYNC_DATABASE, async (job: Job) => {
      const startTime = Date.now();
      
      try {
        console.log('🔄 Synchronizing database...');
        
        // Aquí iría la lógica de sincronización
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const result: JobResult = {
          success: true,
          result: { recordsSynced: 250 },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log('✅ Database synchronized successfully');
        return result;
      } catch (error) {
        console.error('❌ Failed to synchronize database:', error);
        throw error;
      }
    });

    // Job para enviar notificaciones
    this.agenda.define(JobTypes.SEND_NOTIFICATION, async (job: Job) => {
      const { userId, message, type, correlationId } = job.attrs.data;
      const startTime = Date.now();
      
      try {
        console.log(`🔔 Sending notification to user: ${userId}`, { correlationId });
        
        // Aquí iría la lógica de notificaciones (push, websocket, etc.)
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result: JobResult = {
          success: true,
          result: { notificationId: `notif_${Date.now()}` },
          executedAt: new Date(),
          duration: Date.now() - startTime
        };
        
        console.log(`✅ Notification sent successfully to user: ${userId}`);
        return result;
      } catch (error) {
        console.error(`❌ Failed to send notification to user: ${userId}`, error);
        throw error;
      }
    });
  }

  // Programar jobs recurrentes
  private async scheduleRecurringJobs(): Promise<void> {
    try {
      // Limpiar archivos temporales diariamente a las 2 AM
      await this.agenda.every('0 2 * * *', JobTypes.CLEANUP_TEMP_FILES, {});
      
      // Sincronizar base de datos cada 6 horas
      await this.agenda.every('0 */6 * * *', JobTypes.SYNC_DATABASE, {});
      
      console.log('✅ Recurring jobs scheduled successfully');
    } catch (error) {
      console.error('❌ Failed to schedule recurring jobs:', error);
    }
  }
}

// Instancia global del servicio (lazy initialization)
let _jobService: JobService | null = null;

export const jobService = {
  async initialize() {
    if (!_jobService) {
      _jobService = new JobService();
    }
    return _jobService.initialize();
  },
  
  async shutdown() {
    if (_jobService) {
      return _jobService.shutdown();
    }
  },
  
  async scheduleJob(jobType: JobTypes, data: JobData, options?: JobOptions) {
    if (!_jobService) {
      throw new Error('JobService not initialized');
    }
    return _jobService.scheduleJob(jobType, data, options);
  },
  
  async cancelJob(jobId: string) {
    if (!_jobService) {
      throw new Error('JobService not initialized');
    }
    return _jobService.cancelJob(jobId);
  },
  
  async getJobStats() {
    if (!_jobService) {
      throw new Error('JobService not initialized');
    }
    return _jobService.getJobStats();
  }
};
