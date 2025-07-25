import { config } from '../../config/env';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';

export class DIContainer {
  private static instance: DIContainer;
  private userRepository: UserRepository | null = null;
  private isInitialized = false;

  private constructor() { }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Inicializa el contenedor y las conexiones de base de datos
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📦 Contenedor DI ya inicializado');
      return;
    }

    console.log('🚀 Inicializando contenedor de inyección de dependencias...');

    try {
      // Configurar repositorio basado en la configuración
      await this.setupRepository();

      this.isInitialized = true;
      console.log('✅ Contenedor DI inicializado correctamente');
      console.log(`📋 Repositorio activo: ${this.userRepository?.constructor.name}`);

    } catch (error) {
      console.error('❌ Error al inicializar contenedor DI:', error);
      throw error;
    }
  }

  /**
   * Configura el repositorio de usuarios según el DATABASE_URL
   */
  private async setupRepository(): Promise<void> {
    const databaseUrl = config.DATABASE_URL;
    if (!databaseUrl) {
      console.log('🗄️  Sin DATABASE_URL configurada - usando repositorio en memoria');
      this.userRepository = new InMemoryUserRepository();
      return;
    }

    if (databaseUrl.startsWith('mongodb://') || databaseUrl.startsWith('mongodb+srv://')) {
      console.log('🍃 Configurando MongoDB...');
      try {
        const { connectMongoDB } = await import('../database/mongodb/connection');
        await connectMongoDB();
        
        const { MongoUserRepository } = await import('../repositories/MongoUserRepository');
        this.userRepository = new MongoUserRepository();
        console.log('✅ MongoDB configurado exitosamente');
      } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        console.log('🔄 Fallback a repositorio en memoria');
        this.userRepository = new InMemoryUserRepository();
      }
    }
    else if (databaseUrl.startsWith('mysql://')) {
      console.log('🐬 Configurando MySQL...');
      try {
        const { connectMySQL } = await import('../database/mysql/connection');
        await connectMySQL();
        
        const { MySQLUserRepository } = await import('../repositories/MySQLUserRepository');
        this.userRepository = new MySQLUserRepository();
        console.log('✅ MySQL configurado exitosamente');
      } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
        console.log('🔄 Fallback a repositorio en memoria');
        this.userRepository = new InMemoryUserRepository();
      }
    }
    else {
      console.log('⚠️  DATABASE_URL no reconocida - usando repositorio en memoria');
      this.userRepository = new InMemoryUserRepository();
    }
  }

  /**
   * Obtiene el repositorio de usuarios
   */
  public getUserRepository(): UserRepository {
    if (!this.isInitialized || !this.userRepository) {
      throw new Error('Contenedor DI no ha sido inicializado. Llama a initialize() primero.');
    }
    return this.userRepository;
  }

  /**
   * Obtiene estadísticas de conexión
   */
  public async getConnectionStats() {
    const stats: any = {
      isInitialized: this.isInitialized,
      repository: this.userRepository?.constructor.name || 'None',
      timestamp: new Date().toISOString()
    };

    // Agregar estadísticas específicas de MongoDB
    if (this.userRepository?.constructor.name === 'MongoUserRepository') {
      try {
        const { mongoConnection } = await import('../database/mongodb/connection');
        stats.mongodb = mongoConnection.getConnectionStats();
      } catch (error) {
        stats.mongodb = { error: 'Failed to get MongoDB stats' };
      }
    }

    // Agregar estadísticas específicas de MySQL
    if (this.userRepository?.constructor.name === 'MySQLUserRepository') {
      try {
        const { mysqlConnection } = await import('../database/mysql/connection');
        stats.mysql = mysqlConnection.getConnectionStats();
      } catch (error) {
        stats.mysql = { error: 'Failed to get MySQL stats' };
      }
    }

    return stats;
  }

  /**
   * Realiza un health check de las conexiones
   */
  public async healthCheck(): Promise<boolean> {
    if (!this.isInitialized || !this.userRepository) {
      return false;
    }

    try {
      const repositoryName = this.userRepository.constructor.name;
      
      // Para repositorios en memoria, siempre es saludable
      if (repositoryName === 'InMemoryUserRepository') {
        return true;
      }

      // Para MongoDB
      if (repositoryName === 'MongoUserRepository') {
        const { mongoConnection } = await import('../database/mongodb/connection');
        return await mongoConnection.healthCheck();
      }

      // Para MySQL
      if (repositoryName === 'MySQLUserRepository') {
        const { mysqlConnection } = await import('../database/mysql/connection');
        return await mysqlConnection.healthCheck();
      }

      return true;
    } catch (error) {
      console.error('❌ Error en health check:', error);
      return false;
    }
  }

  /**
   * Limpia y cierra todas las conexiones
   */
  public async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('🧽 Limpiando conexiones...');

    try {
      const repositoryName = this.userRepository?.constructor.name;
      
      // Cerrar MongoDB si está conectado
      if (repositoryName === 'MongoUserRepository') {
        try {
          const { mongoConnection } = await import('../database/mongodb/connection');
          await mongoConnection.disconnect();
        } catch (error) {
          console.warn('⚠️ Error cerrando MongoDB:', error);
        }
      }

      // Cerrar MySQL si está conectado
      if (repositoryName === 'MySQLUserRepository') {
        try {
          const { mysqlConnection } = await import('../database/mysql/connection');
          await mysqlConnection.disconnect();
        } catch (error) {
          console.warn('⚠️ Error cerrando MySQL:', error);
        }
      }

      this.userRepository = null;
      this.isInitialized = false;
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
    }
  }

  /**
   * Reinicia el contenedor (útil para cambios de configuración)
   */
  public async restart(): Promise<void> {
    console.log('🔄 Reiniciando contenedor DI...');
    await this.cleanup();
    await this.initialize();
  }

  /**
   * Cambia dinámicamente el repositorio (útil para testing)
   */
  public setRepository(repository: UserRepository): void {
    if (config.NODE_ENV !== 'test' && config.NODE_ENV !== 'development') {
      throw new Error('setRepository solo está disponible en entornos de test y desarrollo');
    }
    
    this.userRepository = repository;
    console.log(`🔧 Repositorio cambiado a: ${repository.constructor.name}`);
  }

  /**
   * Debug: muestra información del repositorio en memoria
   */
  public debugInMemoryRepository(): any {
    if (this.userRepository?.constructor.name === 'InMemoryUserRepository') {
      const repo = this.userRepository as any;
      return {
        type: 'InMemoryUserRepository',
        totalUsers: repo.size ? repo.size() : 0,
        allUsers: repo.getAllUsers ? repo.getAllUsers().map((user: any) => ({
          id: user.id,
          email: user.email.value,
          name: user.displayName,
          role: user.role
        })) : []
      };
    }
    return { type: this.userRepository?.constructor.name || 'Unknown', message: 'No es InMemory' };
  }
}

// Exportar instancia singleton
export const container = DIContainer.getInstance();
