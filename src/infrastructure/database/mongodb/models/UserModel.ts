import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '../../../../domain/entities/User';

// Interface para el documento de MongoDB
export interface IUserDocument extends Document {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  avatar?: string;
  lastLoginAt?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  // Métodos virtuales
  displayName: string;
  initials: string;
  isLocked: boolean;
  incLoginAttempts(): Promise<IUserDocument>;
  resetLoginAttempts(): Promise<IUserDocument>;
}

// Schema de MongoDB
const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
  },
  
  firstName: {
    type: String,
    required: [true, 'Nombre es requerido'],
    trim: true,
    maxlength: [50, 'Nombre no puede tener más de 50 caracteres']
  },
  
  lastName: {
    type: String,
    required: [true, 'Apellido es requerido'],
    trim: true,
    maxlength: [50, 'Apellido no puede tener más de 50 caracteres']
  },
  
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Segundo nombre no puede tener más de 50 caracteres']
  },
  
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
    required: true
  },
  
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    required: true
  },
  
  passwordHash: {
    type: String,
    required: [true, 'Contraseña es requerida'],
    minlength: [60, 'Hash de contraseña inválido'] // bcrypt hash length
  },
  
  avatar: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar debe ser una URL válida'
    }
  },
  
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    default: null
  },
  
  passwordResetToken: {
    type: String,
    default: null
  },
  
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  // Sistema de bloqueo por intentos fallidos
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      // Remover campos sensibles al convertir a JSON
      delete (ret as any).passwordHash;
      delete (ret as any).emailVerificationToken;
      delete (ret as any).passwordResetToken;
      delete (ret as any).loginAttempts;
      delete (ret as any).lockUntil;
      return ret;
    }
  }
});

// Índices para mejorar performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });

// Propiedades virtuales
UserSchema.virtual('displayName').get(function(this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.virtual('initials').get(function(this: IUserDocument) {
  const firstInitial = this.firstName.charAt(0).toUpperCase();
  const lastInitial = this.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
});

UserSchema.virtual('isLocked').get(function(this: IUserDocument) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Métodos de instancia
UserSchema.methods.incLoginAttempts = function(this: IUserDocument) {
  // Si tenemos un bloqueo previo y ya expiró, reiniciar
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Si llegamos al máximo de intentos y no estamos bloqueados, bloquear
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
  
  if ((this.loginAttempts || 0) + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function(this: IUserDocument) {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Middleware pre-save para incrementar versión
UserSchema.pre('save', function(this: IUserDocument, next) {
  if (!this.isNew && this.isModified()) {
    this.version += 1;
  }
  next();
});

// Métodos estáticos del modelo
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role });
};

UserSchema.statics.findActive = function() {
  return this.find({ status: UserStatus.ACTIVE });
};

UserSchema.statics.getAdmins = function() {
  return this.find({ role: UserRole.ADMIN, status: UserStatus.ACTIVE });
};

// Tipos para TypeScript
export interface IUserModel extends mongoose.Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByRole(role: UserRole): Promise<IUserDocument[]>;
  findActive(): Promise<IUserDocument[]>;
  getAdmins(): Promise<IUserDocument[]>;
}

// Crear y exportar el modelo
export const UserModel = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
