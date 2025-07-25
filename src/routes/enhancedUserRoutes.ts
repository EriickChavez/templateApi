import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { requireRole } from '../middlewares/roleBasedAccess';
import { validateQuery, validateBody, validateParams } from '../middlewares/validation';
import { 
  FilterUsersDto, 
  CreateUserDto, 
  UpdateUserDto, 
  UserParamsDto,
  UserRole 
} from '../dto/UserDto';
import { EnhancedUserController } from '../controllers/EnhancedUserController';

const router = Router();
const userController = new EnhancedUserController();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /users - Listar usuarios con paginación y filtros
// Acceso: Admin y Moderator
router.get('/',
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  validateQuery(FilterUsersDto, { optional: true }),
  userController.getUsers.bind(userController)
);

// GET /users/:id - Obtener usuario específico
// Acceso: Admin puede ver cualquiera, usuarios normales solo el suyo
router.get('/:id',
  validateParams(UserParamsDto),
  userController.getUserById.bind(userController)
);

// POST /users - Crear nuevo usuario
// Acceso: Solo Admin
router.post('/',
  requireRole([UserRole.ADMIN]),
  validateBody(CreateUserDto),
  userController.createUser.bind(userController)
);

// PUT /users/:id - Actualizar usuario
// Acceso: Admin puede actualizar cualquiera, usuarios normales solo el suyo
router.put('/:id',
  validateParams(UserParamsDto),
  validateBody(UpdateUserDto),
  userController.updateUser.bind(userController)
);

export default router;
