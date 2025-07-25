import 'reflect-metadata';
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { requireAccess, AccessRules } from '../middlewares/roleBasedAccess';
import { validateBody, validateParams } from '../middlewares/validation';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { jobService, JobTypes } from '../services/JobService';
import { BaseResponseDto } from '../dto/BaseDto';

// DTOs para jobs
class ScheduleJobDto {
  @IsEnum(JobTypes, { message: 'Job type must be a valid type' })
  jobType!: JobTypes;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  delay?: string;

  @IsOptional()
  @IsString()
  repeatInterval?: string;
}

class JobParamsDto {
  @IsUUID('4', { message: 'Job ID must be a valid UUID' })
  id!: string;
}

const router = Router();

// Todas las rutas de jobs requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireAccess(AccessRules.adminOnly()));

// POST /jobs/schedule - Programar un job
router.post('/schedule', 
  validateBody(ScheduleJobDto),
  async (req: Request, res: Response) => {
    try {
      const { jobType, data = {}, priority, delay, repeatInterval } = (req as any).validatedBody;
      
      // Agregar información de contexto al job
      const jobData = {
        ...data,
        correlationId: req.correlationId,
        userId: (req as any).user?.id,
        scheduledBy: (req as any).user?.email
      };

      const jobOptions = {
        priority,
        delay: delay ? new Date(delay) : undefined,
        repeatInterval
      };

      const jobId = await jobService.scheduleJob(jobType, jobData, jobOptions);

      const response = new BaseResponseDto(
        true,
        'Job scheduled successfully',
        {
          jobId,
          jobType,
          data: jobData,
          options: jobOptions
        },
        {
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Error scheduling job:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to schedule job',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }
);

// GET /jobs/stats - Estadísticas de jobs
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await jobService.getJobStats();

    const response = new BaseResponseDto(
      true,
      'Job statistics retrieved successfully',
      stats,
      {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        version: req.apiVersion
      }
    );

    res.json(response);
  } catch (error) {
    console.error('Error getting job stats:', error);
    
    const errorResponse = new BaseResponseDto(
      false,
      'Failed to get job statistics',
      null,
      { correlationId: req.correlationId },
      [{ message: error instanceof Error ? error.message : 'Unknown error' }]
    );

    res.status(500).json(errorResponse);
  }
});

// DELETE /jobs/:id - Cancelar un job
router.delete('/:id',
  validateParams(JobParamsDto),
  async (req: Request, res: Response) => {
    try {
      const { id } = (req as any).validatedParams;
      
      const cancelled = await jobService.cancelJob(id);

      if (!cancelled) {
        const notFoundResponse = new BaseResponseDto(
          false,
          'Job not found or could not be cancelled',
          null,
          { correlationId: req.correlationId }
        );

        return res.status(404).json(notFoundResponse);
      }

      const response = new BaseResponseDto(
        true,
        'Job cancelled successfully',
        { jobId: id, cancelled: true },
        {
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      );

      res.json(response);
    } catch (error) {
      console.error('Error cancelling job:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to cancel job',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }
);

// GET /jobs/types - Obtener tipos de jobs disponibles
router.get('/types', (req: Request, res: Response) => {
  const jobTypes = Object.values(JobTypes).map(type => ({
    type,
    description: getJobTypeDescription(type)
  }));

  const response = new BaseResponseDto(
    true,
    'Available job types retrieved',
    jobTypes,
    {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
      version: req.apiVersion
    }
  );

  res.json(response);
});

// Helper para obtener descripción de tipos de jobs
function getJobTypeDescription(type: JobTypes): string {
  const descriptions: Record<JobTypes, string> = {
    [JobTypes.SEND_EMAIL]: 'Send email notifications',
    [JobTypes.PROCESS_IMAGE]: 'Process and transform images',
    [JobTypes.CLEANUP_TEMP_FILES]: 'Clean up temporary files',
    [JobTypes.GENERATE_REPORT]: 'Generate system reports',
    [JobTypes.SYNC_DATABASE]: 'Synchronize database records',
    [JobTypes.SEND_NOTIFICATION]: 'Send push notifications',
    [JobTypes.BACKUP_DATA]: 'Backup system data'
  };

  return descriptions[type] || 'Unknown job type';
}

export default router;
