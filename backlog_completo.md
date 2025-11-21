#📋 Product Backlog: Backend - Plataforma de Videoconferencia
---
## Propósito
API RESTful y Servidor de WebSockets para gestión de usuarios, salas de reunión y señalización multimedia.
Stack: Node.js (TypeScript), Express, Socket.io, Peer.js, Firebase Admin, Firestore.

## 🔧 Quality Standards (Global)
Estos estándares aplican transversalmente a todas las historias del Sprint 1 (rúbrica) y siguientes:
- Código en inglés (nombres de variables, métodos, clases, carpetas).
- Convenciones: camelCase para variables y funciones, PascalCase para clases, kebab-case para nombres de archivos cuando proceda.
- ESLint (strict + TypeScript rules) sin errores; Prettier formateando antes de cada commit (`npm run lint`, `npm run format`).
- JSDoc en inglés para: controllers, services, models, middlewares y utilidades (mínimo descripción + tipos importantes).
- Uso de variables de entorno (.env) para credenciales de Firebase, puertos, configuración STUN, claves externas.
- Tests unitarios (Jest) para lógica pura y unit tests básicos de middleware de auth; tests de integración para endpoints críticos.
- Definiciones de done incluyen verificación de despliegue en Render y salud del endpoint `/health`.
  
#🚀 Sprint 1: Infraestructura, Identidad y Gestión de Usuarios
Enfoque: Cimientos del servidor, seguridad y persistencia de usuarios.
---
##US-BE-01: Configuración de Arquitectura y CI/CD
Tipo: Infraestructura | Prioridad: Alta
"Como desarrollador, quiero configurar el proyecto base con TypeScript y herramientas de calidad para asegurar un código escalable."
###Criterios de Aceptación:
- [x] Estructura de carpetas implementada: `src/{controllers, services, routes, models, config, middlewares, utils}`.
- [ ] Configuración de `tsconfig.json` (Strict Mode), ESLint y Prettier estandarizada; scripts: `build`, `start`, `lint`, `format`.
- [ ] Variables de entorno (dotenv) configuradas para secretos (Firebase credentials, Ports, STUN config, AI keys opcionales).
- [ ] Script de despliegue configurado para Render (`npm run build` & `npm start`).
- [ ] Integración Jest + script `test` inicial con prueba trivial `/health`.
- [x] Documentado en README (inglés) arquitectura inicial y cómo ejecutar localmente.
- ###Definición de Hecho (DoD):
- [ ] Repositorio en GitHub con ramas main y develop.
- [x] Endpoint GET /health retorna status 200.
- [ ] Despliegue inicial exitoso en producción.
- [ ] Linter y formatter sin errores; pipeline CI ejecuta build + lint + tests.
- [ ] README y comentarios JSDoc presentes en componentes clave (config, server bootstrap).
---
##US-BE-02: Middleware de Autenticación (Auth Guard)
Tipo: Seguridad | Prioridad: Crítica
"Como sistema, quiero validar los tokens JWT enviados por el cliente para proteger los recursos privados."
###Criterios de Aceptación:
 [x] Integración de Firebase Admin SDK.
 [x] Middleware que intercepte el header Authorization: Bearer <token>.
 [x] Validación de firma y expiración del token contra Firebase Auth.
 [x] Inyección del objeto user (uid, email) en la Request de Express.
 [x] Respuestas de error estandarizadas: 401 (Unauthorized) y 403 (Forbidden).
 [x] JSDoc en inglés describiendo parámetros y retorno del middleware.
 [x] Manejo de errores centralizado con estructura `{errorCode, message}`.
 [ ] Tests unitarios con mocks de Firebase para casos válido, inválido, expirado y ausencia de header.
Definición de Hecho (DoD):
Tests unitarios cubriendo casos de token válido, inválido y expirado.
Rutas protegidas inaccesibles sin token válido.
 Código formateado y sin warnings de ESLint.
---
##US-BE-03: Gestión y Sincronización de Perfil (CRUD Usuario)
Tipo: Gestión de Usuarios | Prioridad: Alta
"Como usuario, quiero gestionar mi perfil (crear/sincronizar, leer, actualizar y eliminar) para mantener mi información al día."
###Criterios de Aceptación:
[x] Endpoint POST /api/users/sync: Upsert (crea si no existe, actualiza si existe) documento en Firestore usando UID.
[x] Endpoint GET /api/users/me: Retorna información del perfil autenticado.
[x] Endpoint PUT /api/users/me: Actualiza campos editables (displayName, avatarUrl, status).
[x] Endpoint DELETE /api/users/me: Soft delete (marca flag `deletedAt`) sin eliminar del Auth.
[x] Modelo User (TypeScript) definido con interfaz + esquema de validación (Zod o similar).
[x] Validaciones: tamaño máximo displayName, formato URL avatar, restricción de roles (solo 'host' | 'participant').
[x] Respuestas uniformes: `{data, error}`.
[x] Todos los endpoints requieren token válido (middleware US-BE-02).

- ###Extensiones funcionales solicitadas (Registro, Auth multi-proveedor y recuperación de contraseña):
- [x] Registro de usuario (manual): Endpoint `POST /api/auth/register` que recibe `firstName`, `lastName`, `age`, `email`, `password` y crea cuenta en Auth + documento en `users`.
logout` para cierre de sesión (revocar sesión/token cuando proceda).
- [x] Autenticación (login/logout): Soporte para login con tres proveedores — `manual` (email/password), `google`, `facebook` (u otros). Endpoints: `POST /api/auth/login` (manual), mecanismos/OAuth flows para proveedores externos; `POST /api/auth/logout` para cierre de sesión (revocar sesión/token cuando proceda).
- [x] Recuperación de contraseña: `POST /api/auth/forgot-password` para enviar email de recuperación y `POST /api/auth/reset-password` para aplicar nueva contraseña mediante token seguro.
- [x] Edición de perfil extendida: `PUT /api/users/me` permite editar `firstName`, `lastName`, `age`, `email`, `password` (cuando aplique) con validaciones y flujos de revalidación cuando cambia el email/contraseña.
- [x] Eliminación de cuenta: `DELETE /api/users/me` que elimina o desactiva la cuenta del usuario tanto en Auth como en Firestore (soft delete o eliminación completa, según configuración).
- [ ] Manejo de registros por proveedor: Cuando el usuario se registra con proveedor externo, crear un perfil enriquecido en `users` con todos los datos disponibles del proveedor (email, nombre, avatar, locale, phone, `providerId`, `providerUid`) y permitir completar/editar datos posteriormente. Nota: endpoint `POST /api/auth/provider-sync` y lógica de upsert implementados; queda documentar ejemplos y actualizar Postman local collection.
- [ ] Manejo de registros por proveedor: Cuando el usuario se registra con proveedor externo, crear un perfil enriquecido en `users` con todos los datos disponibles del proveedor (email, nombre, avatar, locale, phone, `providerId`, `providerUid`) y permitir completar/editar datos posteriormente. Nota: endpoint `POST /api/auth/provider-sync` y lógica de upsert implementados; documentación y ejemplos añadidos.

Ejemplo: Client-side recommended flow (Firebase SDK)

1) Enable provider in Firebase Console (Authentication -> Sign-in method).

2) Client signs in with Firebase SDK (Google example):

```js
// client-side (web) example using Firebase JS SDK
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
const auth = getAuth();
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();
```

3) Client calls backend to sync profile:

```
POST /api/auth/provider-sync
Headers: Authorization: Bearer <ID_TOKEN>
Body (optional): { "displayName": "Ana Perez", "avatarUrl": "https://..." }
```

Response example:

```json
{
	"data": {
		"uid": "firebase-uid",
		"displayName": "Ana Perez",
		"firstName": "Ana",
		"lastName": "Perez",
		"email": "ana@example.com",
		"avatarUrl": "https://...",
		"provider": "google.com",
		"providerUid": "google-12345",
		"profileCompleted": false,
		"createdAt": "2025-11-20T12:00:00.000Z",
		"updatedAt": "2025-11-20T12:00:00.000Z"
	}
}
```
- [ ] Edición de perfil extendida: `PUT /api/users/me` permite editar `firstName`, `lastName`, `age`, `email`, `password` (cuando aplique) con validaciones y flujos de revalidación cuando cambia el email/contraseña.
- [ ] Eliminación de cuenta: `DELETE /api/users/me` que elimina o desactiva la cuenta del usuario tanto en Auth como en Firestore (soft delete o eliminación completa, según configuración).
- [ ] Manejo de registros por proveedor: Cuando el usuario se registra con proveedor externo, crear perfil mínimo en `users` y permitir completar/editar datos posteriormente.

###Definición de Hecho (DoD):
 CRUD (POST/GET/PUT/DELETE) operativo y cubierto con tests de integración básicos.
 Datos persistidos correctamente en colección `users` de Firestore (incluye timestamps `createdAt`, `updatedAt`).
 [x] JSDoc en inglés en controller y service `UserService`.
 Código pasa ESLint/Prettier y pruebas (`npm test`).
 Manejo de errores consistente (400 validation error, 404 not found, 409 conflict si UID duplicado en creación directa distinta a sync).
---
#💬 Sprint 2: Chat en Tiempo Real y Gestión de Salas
Enfoque: Lógica de negocio para reuniones y comunicación por texto (WebSockets).
---
##US-BE-04: Gestión de Reuniones (Salas)
Tipo: Core Feature | Prioridad: Crítica
"Como anfitrión, quiero generar identificadores únicos de reunión para invitar a otros participantes."
###Criterios de Aceptación:
[ ] Endpoint POST /api/meetings: Genera ID único (UUID/NanoID) y crea registro en Firestore.
[ ] Endpoint GET /api/meetings/:id: Valida existencia de la sala y disponibilidad (max 10 usuarios).
[ ] Persistencia de campos: hostId, createdAt, status (active/finished).
[ ] Endpoint PUT /api/meetings/:id: Permite marcar status finished manualmente (solo host).
[ ] Endpoint DELETE /api/meetings/:id: Soft delete (solo host) si status finished.
###Definición de Hecho (DoD):
Colección meetings operativa en Firestore.
Tests de integración verificando la creación y lectura de salas.
 JSDoc en inglés para MeetingController/Service.
---
##US-BE-05: Infraestructura Socket.io y Salas
Tipo: Comunicación Real-time | Prioridad: Crítica
"Como sistema, quiero gestionar conexiones WebSocket y agrupar usuarios en salas virtuales para aislar las conversaciones."
###Criterios de Aceptación:
[ ] Servidor Socket.io configurado con CORS habilitado.
[ ] Middleware de autenticación para Socket (validar JWT en handshake).
[ ] Eventos join-room: Agrega el socket a una room específica del meeting ID.
[ ] Control de concurrencia: Rechazar conexión si sockets.size > 10 en la sala.
[ ] Evento leave-room y limpieza de estado.
[ ] Estructura tipada de eventos (TypeScript interfaces) y JSDoc en handlers.
###Definición de Hecho (DoD):
Logs del servidor muestran usuarios uniéndose y saliendo correctamente.
Manejo de evento disconnect limpiando referencias.
 Tests de unidad para lógica de conteo y rechazo de exceso de usuarios (simulación). 
---
##US-BE-06: Chat Persistente
Tipo: Funcionalidad | Prioridad: Alta
"Como participante, quiero enviar y recibir mensajes de texto instantáneos durante la reunión."
###Criterios de Aceptación:
[ ] Evento send-message: Servidor recibe y hace broadcast a la sala (room.emit).
[ ] Persistencia asíncrona: Guardar mensaje en subcolección meetings/{id}/chat en Firestore.
[ ] Estructura de mensaje: id, senderId, text, timestamp.
[ ] Endpoint GET /api/meetings/:id/chat: Retorna mensajes paginados (limit, cursor).
[ ] Validación anti-spam (rate limit por usuario: p.ej. 5 msgs / 10s).
###Definición de Hecho (DoD):
Chat funcional entre al menos 2 clientes con latencia imperceptible.
Datos almacenados en Firestore verificables.
 JSDoc en inglés en ChatService y tipos de mensajes.
🎙️ Sprint 3: Transmisión de Voz y Señalización
Enfoque: Señalización WebRTC para audio y valor agregado con IA.
---
##US-BE-07: Señalización P2P (Signaling Logic)
Tipo: Comunicación Real-time | Prioridad: Alta
"Como sistema, quiero intercambiar PeerIDs entre clientes para permitir conexiones Peer-to-Peer de audio."
###Criterios de Aceptación:
[ ] Evento user-connected: Notificar a la sala cuando un usuario nuevo se conecta a PeerJS.
[ ] Manejo de intercambio de IDs para establecer malla (Mesh topology).
[ ] Evento user-disconnected: Notificar a los pares para cerrar flujos de medios.
[ ] Tipado de payloads de señalización y documentación JSDoc.
###Definición de Hecho (DoD):
Flujo de señalización probado: Cliente A recibe ID de Cliente B.
Código limpio y modularizado en socket/handlers.
 Tests de unidad para función de broadcast de peer IDs.
---
##US-BE-08: Servidor STUN Propio
Tipo: Infraestructura | Prioridad: Media
"Como desarrollador, quiero proveer un servidor STUN para resolver conexiones a través de NAT."
###Criterios de Aceptación:
[ ] Implementación/Configuración de servicio STUN en el backend (o contenedor dedicado).
[ ] Endpoint GET /api/config/ice-servers: Retorna la configuración ICE (stun:url:port).
[ ] Uso de variables de entorno para listar servidores y puertos.
###Definición de Hecho (DoD):
Servidor STUN responde a peticiones de binding.
URL inyectada vía variables de entorno.
 Documentado en README sección ICE config.
---
##US-BE-09: Resumen de Chat con IA
Tipo: IA / Backend | Prioridad: Media
"Como usuario, quiero obtener un resumen automático del chat al finalizar la reunión."
###Criterios de Aceptación:
[ ] Endpoint POST /api/meetings/:id/close: Marca reunión como finalizada y dispara trigger.
[ ] Servicio que consulta historial de chat de Firestore.
[ ] Integración con API externa de IA (ej. OpenAI) para procesar el texto.
[ ] Guardado del resumen en colección summaries.
[ ] Manejo de cuotas (controlar tamaño máximo del prompt) y fallback si API falla.
###Definición de Hecho (DoD):
Prompt del sistema optimizado para resúmenes concisos.
Manejo de errores (API IA timeout) implementado.
 JSDoc en inglés del SummaryService.
---
#📹 Sprint 4: Video y Robustez
Enfoque: Señalización de video y estabilidad del sistema.
---
##US-BE-10: Sincronización de Estado Multimedia
Tipo: Comunicación Real-time | Prioridad: Media
"Como participante, quiero que el estado de mi cámara/micrófono se refleje en las pantallas de los demás."
###Criterios de Aceptación:
[ ] Eventos de socket para toggle-audio y toggle-video.
[ ] Broadcast de estado a todos los participantes de la sala.
[ ] Optimización: No retransmitir stream si el video está apagado (gestión lógica).
[ ] Tipado y documentación de eventos multimedia (JSDoc + interfaces TS).
###Definición de Hecho (DoD):
El estado (Mute/Video Off) se sincroniza en < 200ms entre clientes.
 Tests de estrés manual documentados (10 usuarios).
---
##US-BE-11: Robustez y Múltiples STUN Servers
Tipo: Infraestructura | Prioridad: Baja (Refinamiento)
"Como sistema, quiero redundancia en servidores STUN para asegurar conectividad en redes complejas."
###Criterios de Aceptación:
[ ] Ampliación del endpoint de configuración ICE para retornar array de servidores.
[ ] Implementación de Health Checks básicos para servicios externos.
[ ] Logging estructurado (pino/winston) con correlación de requestId.
###Definición de Hecho (DoD):
Documentación de API finalizada (Markdown o Swagger).
Informe final de pruebas de carga (simulación 10 usuarios).
 JSDoc en inglés actualizado para endpoints ICE y health.
---
##US-BE-12: Limpieza Automática (Job Programado)
Tipo: Mantenimiento | Prioridad: Baja
"Como sistema, quiero archivar o limpiar reuniones antiguas para optimizar la base de datos."
##Criterios de Aceptación:
[ ] Script o Cron Job (si Render lo permite, o endpoint llamado externamente) que verifique reuniones "activas" con > 24 horas.
[ ] Marcar dichas reuniones como finalizadas automáticamente.
[ ] Uso de índice temporal en Firestore para consultas eficientes.
##Definición de Hecho (DoD):
Base de datos consistente sin reuniones "zombies".
 Registro en logs estructurados de cada limpieza.
