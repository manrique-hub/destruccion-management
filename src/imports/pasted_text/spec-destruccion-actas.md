Documento de Especificación Funcional
Sistematización de Actas de Destrucción 
Versión: 1.0
________________________________________
1. Roles del Sistema
1.1 Solicitante (Usuario)
Es el responsable de crear el acta de destrucción.
Puede:
•	Crear actas.
•	Editarlas únicamente mientras estén en estado Borrador.
•	Enviar el acta a aprobación.
•	Consultar el estado del proceso.
•	Recibir notificaciones.
•	Consultar el historial de aprobaciones.
•	Descargar el acta final.
No puede aprobar ni rechazar actas.
________________________________________
1.2 Aprobador de Área
Es el primer responsable del flujo de aprobación.
Puede:
•	Ver las actas pendientes de su aprobación.
•	Revisar toda la información del acta.
•	Aprobar.
•	Rechazar.
•	Decidir si el acta requiere aprobación de Costos.
•	Enviar directamente a HSE&S cuando Costos no sea necesario.
•	Consultar el historial del proceso.
Debe ser informado de todas las decisiones posteriores tomadas por Costos y HSE&S.
________________________________________
1.3 Aprobador de Costos
Puede:
•	Ver únicamente las actas pendientes de Costos.
•	Revisar el acta.
•	Aprobar.
•	Rechazar.
•	Consultar historial.
No puede modificar la información del acta.
________________________________________
1.4 Aprobador HSE&S
Puede:
•	Ver las actas pendientes.
•	Aprobar.
•	Rechazar.
•	Consultar todas las actas.
•	Editar actas (según permisos definidos).
•	Consultar estadísticas.
•	Acceder al Dashboard HSE&S.
________________________________________
1.5 Administrador
Tiene acceso total al sistema.
Puede:

•	Crear usuarios.
•	Editar usuarios.
•	Cambiar roles.
•	Activar o desactivar usuarios.
•	Modificar correos corporativos.
•	Consultar todas las actas.
•	Editar actas.
•	Ver el historial completo.
•	Consultar estadísticas.
•	Administrar notificaciones.
________________________________________
2. Registro de Usuarios
Durante el registro se solicitará:
•	Nombre completo
•	Usuario
•	Contraseña
•	Rol
Si el rol corresponde a:
•	Aprobador de Área
•	Aprobador de Costos
•	Aprobador HSE&S
aparecerá automáticamente un campo obligatorio:
Correo Corporativo
Este correo será utilizado para el envío de notificaciones.
________________________________________
3. Creación del Acta
El solicitante deberá diligenciar:
Datos Generales
•	Nombre del solicitante
•	Área
•	Cargo
•	Correo corporativo
•	Fecha
•	Tipo de destrucción
•	Observaciones
Una vez el acta sea enviada a aprobación:
•	Estos datos quedarán bloqueados.
•	Ningún usuario podrá modificarlos.
________________________________________
4. Flujo del Proceso
Estado Inicial
Borrador
↓
El usuario presiona:
Enviar a aprobación
↓
Estado:
Pendiente aprobación de Área
↓
Notificaciones:
•	Aprobador de Área
•	Solicitante
________________________________________
Decisión del Aprobador de Área
Opciones disponibles:
•	Aprobar y enviar a Costos
•	Aprobar y enviar a HSE&S
•	Rechazar
________________________________________
Si envía a Costos
Estado:
Pendiente aprobación de Costos
Notificaciones:
•	Solicitante
•	Aprobador de Costos
________________________________________
Si envía directamente a HSE&S
Estado:
Pendiente aprobación HSE&S
Notificaciones:
•	Solicitante
•	HSE&S
________________________________________
Si rechaza
Estado:
Rechazada por Área
Notificaciones:
•	Solicitante
•	Administrador
Proceso finalizado.
________________________________________
5. Flujo de Costos
Opciones:
•	Aprobar
•	Rechazar
________________________________________
Si aprueba
Estado:
Pendiente aprobación HSE&S
Notificaciones:
•	Solicitante
•	Aprobador de Área
•	HSE&S
________________________________________
Si rechaza
Estado:
Rechazada por Costos
Notificaciones:
•	Solicitante
•	Aprobador de Área
•	Administrador
Proceso terminado.
________________________________________
6. Flujo HSE&S
Opciones:
•	Aprobar
•	Rechazar
________________________________________
Si aprueba
Estado:
Finalizada
Notificaciones:
•	Solicitante
•	Aprobador de Área
•	Costos (si participó)
•	Administrador
________________________________________
Si rechaza
Estado:
Rechazada por HSE&S
Notificaciones:
•	Solicitante
•	Aprobador de Área
•	Costos (si participó)
•	Administrador
Proceso terminado.
________________________________________
7. Estados del Acta
•	Borrador
•	Pendiente aprobación Área
•	Pendiente aprobación Costos
•	Pendiente aprobación HSE&S
•	Rechazada por Área
•	Rechazada por Costos
•	Rechazada por HSE&S
•	Finalizada
Cada cambio actualizará automáticamente la fecha y el historial.
________________________________________
8. Historial de Aprobaciones
Cada acción será almacenada.
Información registrada:
•	Acta
•	Usuario
•	Rol
•	Acción realizada
•	Observaciones
•	Fecha
•	Hora
•	Estado anterior
•	Estado nuevo
Este historial no podrá ser modificado.
________________________________________
9. Notificaciones
El sistema tendrá dos tipos de notificación.
Dentro de la aplicación
Campana de notificaciones.
Ejemplos:
•	Su acta fue enviada a aprobación.
•	Su acta fue aprobada por Área.
•	Su acta fue enviada a Costos.
•	Costos aprobó su acta.
•	Costos rechazó su acta.
•	HSE&S aprobó su acta.
•	HSE&S rechazó su acta.
•	Su proceso ha finalizado.
________________________________________
Correo Corporativo
Se enviará automáticamente a:
•	Solicitante
•	Aprobador correspondiente
•	Aprobador de Área cuando Costos o HSE&S tomen una decisión
•	Costos cuando HSE&S finalice el proceso
•	Administrador cuando exista un rechazo o finalización
________________________________________
10. Eliminación de Firmas
Las firmas serán reemplazadas por aprobaciones digitales.
Cada aprobación registrará:
•	Usuario
•	Fecha
•	Hora
•	Observaciones
Esto tendrá validez dentro del sistema como evidencia del proceso.
________________________________________
11. Dashboard HSE&S
El Dashboard mostrará indicadores como (se debe elegir):
•	Producto más destruido.
•	Cantidad destruida por producto.
•	Causa más frecuente de destrucción.
•	Tipo de producto más destruido.
•	Área que más genera actas.
•	Actas por mes.
•	Productos destruidos por lote.
Gráficos: (se debe elegir)
•	Barras
•	Pastel
•	Líneas
•	Tarjetas KPI
________________________________________
12. Dashboard Costos
Indicadores:
•	Actas pendientes.
•	Actas aprobadas.
•	Actas rechazadas.
•	Tiempo promedio de respuesta.
•	Destrucciones por centro de costo.
•	Cantidad de procesos atendidos.
•	Participación mensual.
________________________________________
13. Administración de Usuarios
El Administrador podrá:
•	Crear usuarios.
•	Editar usuarios.
•	Eliminar usuarios.
•	Cambiar rol.
•	Activar usuarios.
•	Desactivar usuarios.
•	Actualizar correo corporativo.
•	Restablecer contraseña.
________________________________________
14. Auditoría
El sistema registrará:
•	Inicio de sesión.
•	Creación de actas.
•	Edición.
•	Aprobaciones.
•	Rechazos.
•	Cambio de estado.
•	Envío de notificaciones.
•	Cambios realizados por el administrador.
La auditoría no podrá eliminarse.
________________________________________
15. Base de Datos
Tabla Usuarios
•	id
•	nombre
•	usuario
•	contraseña
•	rol
•	correo_personal
•	correo_corporativo
•	estado
________________________________________
Tabla Actas
•	id
•	consecutivo
•	solicitante
•	correo_solicitante
•	área
•	cargo
•	fecha
•	estado
•	fecha_creación
•	fecha_finalización
________________________________________
Tabla HistorialAprobaciones
•	id
•	acta_id
•	usuario_id
•	rol
•	acción
•	observaciones
•	fecha
•	estado_anterior
•	estado_nuevo
________________________________________
Tabla Notificaciones
•	id
•	usuario_id
•	acta_id
•	mensaje
•	tipo
•	leída
•	fecha
________________________________________
16. Requisitos Funcionales
•	Registro de usuarios.
•	Inicio de sesión.
•	Gestión de roles.
•	Creación de actas.
•	Flujo de aprobaciones.
•	Rechazos.
•	Historial.
•	Dashboard.
•	Estadísticas.
•	Notificaciones internas.
•	Notificaciones por correo.
•	Auditoría.
•	Administración de usuarios.
________________________________________
17. Requisitos No Funcionales
•	Interfaz intuitiva.
•	Sistema responsive.
•	Base de datos segura.
•	Contraseñas cifradas.
•	Registro de auditoría.
•	Alto rendimiento.
•	Escalabilidad.
•	Disponibilidad.
•	Trazabilidad completa.
•	Compatibilidad con navegadores modernos.
