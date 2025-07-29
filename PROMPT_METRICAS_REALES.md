# PROMPT PARA IA - IMPLEMENTAR MÉTRICAS REALES EN API NODE.JS

## Contexto
Tengo una API de Node.js + TypeScript que actualmente devuelve métricas del sistema con algunos datos simulados usando Math.random(). Necesito reemplazar TODOS los datos ficticios con métricas reales del sistema.

## Estructura actual del proyecto
- **Backend**: Node.js + TypeScript + Express
- **Archivo principal**: `src/middlewares/performance.ts`
- **Endpoint**: `GET /metrics/system`
- **Plataforma objetivo**: macOS (pero debe ser multiplataforma)

## Datos que necesito implementar REALES

### FASE 1 - Básicos (prioridad alta)
1. **Espacio en disco real** - Ya implementado parcialmente, necesita completarse
2. **Procesos del sistema** - Actualmente: `Math.floor(Math.random() * 200) + 100`
3. **Conexiones de red activas** - Actualmente: `Math.floor(Math.random() * 50) + 10`

### FASE 2 - Intermedios  
4. **Usuarios activos reales** - Definir como usuarios con sesiones JWT válidas en los últimos 5 minutos
5. **Tráfico de red (bytes in/out)** - Actualmente: `Math.floor(Math.random() * 1000000)`
6. **Uso de disco en porcentaje** - Actualmente: `Math.floor(Math.random() * 50) + 20`

### FASE 3 - Avanzados
7. **Conexiones de base de datos activas** (si aplica)
8. **Jobs en cola de background** (si aplica)
9. **Caché hits/misses** (si aplica)

## Código actual (fragmento relevante)
```typescript
// En src/middlewares/performance.ts línea ~300
return {
  system_load: apiData.cpu?.system?.loadAverage?.[0] || 0, // ✅ YA REAL
  disk_space: {
    total: Math.floor(Math.random() * 1000000000000), // ❌ FICTICIO
    used: Math.floor(Math.random() * 500000000000),   // ❌ FICTICIO  
    free: Math.floor(Math.random() * 500000000000)    // ❌ FICTICIO
  },
  memory: {
    total: totalMemory,  // ✅ YA REAL
    used: usedMemory,    // ✅ YA REAL  
    free: freeMemory     // ✅ YA REAL
  },
  processes: Math.floor(Math.random() * 200) + 100,    // ❌ FICTICIO
  connections: Math.floor(Math.random() * 50) + 10     // ❌ FICTICIO
};
```

## Requerimientos técnicos
- **Multiplataforma**: Debe funcionar en macOS, Linux, Windows
- **Manejo de errores**: Si un comando falla, devolver valor por defecto o 'N/A'
- **Performance**: Los comandos no deben bloquear más de 2 segundos
- **TypeScript**: Código con tipos correctos
- **Async/await**: Usar promesas para comandos del sistema

## Comandos del sistema sugeridos
```bash
# Procesos (macOS/Linux)
ps aux | wc -l

# Conexiones activas (macOS)  
netstat -an | grep ESTABLISHED | wc -l

# Uso de disco (macOS/Linux)
df -h /

# Tráfico de red (macOS)
netstat -ib
```

## Información adicional del sistema
- **OS**: macOS (Darwin 24.5.0)
- **CPU**: Apple M1, 8 cores
- **RAM**: 8 GB
- **Node.js**: v20.18.0
- **Arquitectura**: x64

## Ejemplo de respuesta actual de la API
```json
{
  "success": true,
  "data": {
    "memory": {
      "system": {
        "total": "8 GB",
        "free": "0 GB", 
        "used": "8 GB"
      }
    },
    "cpu": {
      "system": {
        "cores": 8,
        "model": "Apple M1",
        "loadAverage": [1.25, 1.95, 2.64]
      }
    }
  }
}
```

## Pregunta específica
Proporciona el código TypeScript completo para reemplazar las líneas ficticias con datos reales del sistema. Incluye:

1. **Funciones helper** para ejecutar comandos del sistema de forma segura
2. **Implementación multiplataforma** con detección de OS
3. **Manejo robusto de errores** 
4. **Código optimizado** que no impacte performance
5. **Documentación** clara de qué hace cada función

## Formato de respuesta esperado
- Código TypeScript listo para usar
- Explicación de cada métrica implementada
- Lista de comandos del sistema utilizados
- Instrucciones de testing/validación

## Prioridad
Implementar en este orden:
1. Procesos del sistema
2. Conexiones de red  
3. Espacio en disco (completar)
4. Tráfico de red
5. Usuarios activos
6. Resto de métricas avanzadas

## Resultado esperado
Que todos los valores `Math.random()` sean reemplazados por datos reales del sistema operativo y que el dashboard muestre información verídica del servidor.
