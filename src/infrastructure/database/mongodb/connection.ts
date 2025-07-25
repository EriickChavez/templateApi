import mongoose from 'mongoose';
import { config } from '../../../config/env';

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('🍃 MongoDB ya está conectado');
      return;
    }

    try {
      if (!config.DATABASE_URL) {
        throw new Error('DATABASE_URL no está configurada para MongoDB');
      }
      const mongoUri = config.DATABASE_URL;
      
      // Configuraciones de conexión simplificadas
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      };

      console.log('🔄 Conectando a MongoDB...');
      console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales

      await mongoose.connect(mongoUri, options);

      this.isConnected = true;

      // Event listeners para monitoreo
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB conectado exitosamente');
        console.log(`🗄️  Base de datos: ${mongoose.connection.db?.databaseName}`);
        console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      });

      mongoose.connection.on('error', (error) => {
        console.error('❌ Error de conexión MongoDB:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB desconectado');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconectado');
        this.isConnected = true;
      });

      // Configuraciones adicionales de Mongoose
      mongoose.set('strictQuery', false); // Para compatibilidad futura
      
      if (config.NODE_ENV === 'development') {
        mongoose.set('debug', true); // Logs de queries en desarrollo
      }

    } catch (error) {
      console.error('💥 Error al conectar a MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔌 MongoDB desconectado exitosamente');
    } catch (error) {
      console.error('❌ Error al desconectar MongoDB:', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }

  public isConnectionReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Método para estadísticas de conexión
  public getConnectionStats() {
    const conn = mongoose.connection;
    return {
      isConnected: this.isConnected,
      readyState: conn.readyState,
      host: conn.host,
      port: conn.port,
      name: conn.name,
      collections: Object.keys(conn.collections),
      models: Object.keys(mongoose.models)
    };
  }

  // Método para healthcheck
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Ping simple a la base de datos
      await mongoose.connection.db?.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ MongoDB health check falló:', error);
      return false;
    }
  }

  // Método para limpiar la base de datos (solo para testing)
  public async clearDatabase(): Promise<void> {
    if (config.NODE_ENV === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('🧹 Base de datos limpiada');
  }
}

export const mongoConnection = MongoDBConnection.getInstance();

// Helper para uso directo
export const connectMongoDB = () => mongoConnection.connect();
export const disconnectMongoDB = () => mongoConnection.disconnect();
