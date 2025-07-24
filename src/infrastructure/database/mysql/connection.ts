import mysql, { Pool, PoolConnection, FieldPacket, RowDataPacket } from 'mysql2/promise';
import { config } from '../../../config/env';

export interface QueryResult extends RowDataPacket {}

class MySQLConnection {
  private static instance: MySQLConnection;
  private pool: Pool | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MySQLConnection {
    if (!MySQLConnection.instance) {
      MySQLConnection.instance = new MySQLConnection();
    }
    return MySQLConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      console.log('🔗 MySQL ya está conectado');
      return;
    }

    try {
      // Configuración de la base de datos
      const dbConfig = this.parseConnectionString();
      
      console.log('🔄 Conectando a MySQL...');
      console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
      console.log(`🗄️  Database: ${dbConfig.database}`);

      // Crear pool de conexiones
      this.pool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        
        // Configuraciones del pool
        connectionLimit: 10,
        queueLimit: 0,
        
        // Configuraciones básicas
        charset: 'utf8mb4',
        timezone: 'Z',
        
        // SSL si es necesario
        ssl: dbConfig.ssl || false,
        
        // Configuraciones de seguridad
        multipleStatements: false
      });

      // Probar la conexión
      const connection = await this.pool.getConnection();
      
      console.log('✅ MySQL conectado exitosamente');
      console.log(`🏷️  Versión: ${await this.getMySQLVersion(connection)}`);
      console.log(`👤 Usuario: ${dbConfig.user}`);
      
      connection.release();
      this.isConnected = true;

      // Configurar event listeners
      this.setupEventListeners();

      // Crear tablas si no existen
      await this.createTables();

    } catch (error: any) {
      console.error('💥 Error al conectar a MySQL:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  private parseConnectionString() {
    // Usar DATABASE_URL o construir desde variables individuales
    const connectionString = config.DATABASE_URL;
    
    if (connectionString && connectionString.startsWith('mysql://')) {
      // Parsear connection string: mysql://user:password@host:port/database
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remover el '/' inicial
        ssl: url.searchParams.get('ssl') === 'true' ? {} : false
      };
    } else {
      // Usar variables de entorno individuales
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'templateapi',
        ssl: process.env.DB_SSL === 'true' ? {} : false
      };
    }
  }

  private async getMySQLVersion(connection: PoolConnection): Promise<string> {
    try {
      const [rows] = await connection.execute('SELECT VERSION() as version');
      return (rows as any)[0].version;
    } catch (error) {
      return 'Unknown';
    }
  }

  private setupEventListeners(): void {
    if (!this.pool) return;

    // Los event listeners de mysql2 son limitados, solo configuramos error handling básico
    try {
      // Configuración básica sin eventos específicos
      console.log('📊 Pool de conexiones MySQL configurado');
    } catch (error) {
      console.error('❌ Error configurando event listeners:', error);
    }
  }

  private async createTables(): Promise<void> {
    try {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          middle_name VARCHAR(100) NULL,
          role ENUM('admin', 'moderator', 'user', 'guest') NOT NULL DEFAULT 'user',
          status ENUM('active', 'inactive', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
          password_hash VARCHAR(255) NOT NULL,
          avatar VARCHAR(500) NULL,
          last_login_at TIMESTAMP NULL,
          is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          email_verification_token VARCHAR(255) NULL,
          password_reset_token VARCHAR(255) NULL,
          password_reset_expires TIMESTAMP NULL,
          login_attempts INT NOT NULL DEFAULT 0,
          lock_until TIMESTAMP NULL,
          version INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_last_login (last_login_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await this.execute(createUsersTable);
      console.log('📋 Tabla users verificada/creada');

      // Crear otras tablas si las necesitas
      await this.createSessionsTable();
      await this.createAuditTable();

    } catch (error: any) {
      console.error('❌ Error al crear tablas:', error.message);
      throw error;
    }
  }

  private async createSessionsTable(): Promise<void> {
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await this.execute(createSessionsTable);
    console.log('📋 Tabla user_sessions verificada/creada');
  }

  private async createAuditTable(): Promise<void> {
    const createAuditTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id VARCHAR(36) NULL,
        old_values JSON NULL,
        new_values JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_resource (resource),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await this.execute(createAuditTable);
    console.log('📋 Tabla audit_logs verificada/creada');
  }

  public async execute(query: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('MySQL no está conectado');
    }

    try {
      const [rows, fields] = await this.pool.execute(query, params);
      return rows;
    } catch (error: any) {
      console.error('❌ Error ejecutando query MySQL:', {
        query: query.substring(0, 100) + '...',
        error: error.message
      });
      throw error;
    }
  }

  public async query(query: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('MySQL no está conectado');
    }

    try {
      const [rows, fields] = await this.pool.query(query, params);
      return rows;
    } catch (error: any) {
      console.error('❌ Error ejecutando query MySQL:', {
        query: query.substring(0, 100) + '...',
        error: error.message
      });
      throw error;
    }
  }

  public async beginTransaction(): Promise<PoolConnection> {
    if (!this.pool) {
      throw new Error('MySQL no está conectado');
    }

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('🔌 MySQL desconectado exitosamente');
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      await this.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ MySQL health check falló:', error);
      return false;
    }
  }

  public getConnectionStats() {
    if (!this.pool) {
      return { isConnected: false };
    }

    return {
      isConnected: this.isConnected,
      // @ts-ignore - acceder a propiedades privadas para estadísticas
      totalConnections: this.pool._allConnections?.length || 0,
      // @ts-ignore
      freeConnections: this.pool._freeConnections?.length || 0,
      // @ts-ignore
      acquiringConnections: this.pool._acquiringConnections?.length || 0
    };
  }

  // Método para limpiar la base de datos (solo para testing)
  public async clearDatabase(): Promise<void> {
    if (config.NODE_ENV === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }

    const tables = ['audit_logs', 'user_sessions', 'users'];
    
    for (const table of tables) {
      await this.execute(`DELETE FROM ${table}`);
    }
    
    console.log('🧹 Base de datos MySQL limpiada');
  }
}

export const mysqlConnection = MySQLConnection.getInstance();

// Helpers para uso directo
export const connectMySQL = () => mysqlConnection.connect();
export const disconnectMySQL = () => mysqlConnection.disconnect();
