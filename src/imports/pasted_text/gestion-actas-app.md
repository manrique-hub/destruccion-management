ACTÚA COMO UN ARQUITECTO DE SOFTWARE SENIOR, ANALISTA FUNCIONAL, DISEÑADOR UX/UI Y DESARROLLADOR FULL STACK.

Necesito que desarrolles una aplicación web empresarial completa llamada:

"Sistema de Gestión de Actas de Destrucción de Productos y Materiales"

OBJETIVO DEL PROYECTO

Migrar un proceso actualmente desarrollado en Power Apps hacia una aplicación web moderna, escalable, rápida y preparada para manejar grandes volúmenes de información.

La aplicación debe permitir gestionar actas de destrucción de productos, registrar múltiples productos dentro de una misma acta, administrar firmas digitales, consultar históricos, generar PDF y exportar información a Excel.

---

## TECNOLOGÍAS REQUERIDAS

Frontend:

* React
* Vite
* JavaScript
* Material UI o Ant Design
* Responsive para escritorio y portátil

Backend:

* Node.js
* Express.js

Base de datos:

* SQL Server

ORM:

* Sequelize

Autenticación:

* JWT

Generación de documentos:

* PDFKit o equivalente

Exportación:

* ExcelJS

---

## ARQUITECTURA

Implementar arquitectura en capas:

Frontend
Backend API REST
Base de Datos SQL Server

Separar:

* Controllers
* Services
* Repositories
* Models
* Routes
* Middleware
* Helpers

---

## ROLES DEL SISTEMA

1. Usuario Operativo

* Crear actas
* Editar borradores
* Registrar productos
* Firmar actas

2. Supervisor

* Revisar actas
* Aprobar
* Rechazar

3. Administrador

* Gestión completa
* Administración de catálogos
* Consultas globales
* Configuración

---

MÓDULO 1
CONSULTA GENERAL DE ACTAS
-------------------------

Crear una pantalla principal tipo SAP Grid.

Debe permitir:

* Buscar actas
* Filtrar información
* Ordenar columnas
* Paginación
* Selección múltiple
* Ver detalle
* Descargar PDF
* Exportar Excel

Filtros:

* Número de Acta
* Fecha Inicial
* Fecha Final
* Área
* CECO
* Responsable
* Estado
* Código SAP
* Producto
* Lote

La tabla debe soportar miles de registros sin degradación de rendimiento.

Implementar:

* búsqueda rápida global
* filtros avanzados
* paginación del servidor
* ordenamiento dinámico

---

MÓDULO 2
CREACIÓN DE ACTAS
-----------------

Crear formulario maestro-detalle.

SECCIÓN DATOS GENERALES

Campos:

* Número de Acta (autogenerado)
* Fecha Solicitud
* Área Generadora
* CECO
* Responsable
* Observaciones Generales
* Estado

SECCIÓN PRODUCTOS

Una misma acta puede contener múltiples productos.

Crear grid editable para agregar, editar o eliminar productos.

Campos:

* Empresa Responsable
* Descripción Producto
* Código SAP
* Número de Lote
* Orden de Producción
* Tipo de Controlado
* Clasificación
* Fecha de Vencimiento
* Causal de Destrucción
* Cantidad Kg
* Cantidad Unidades
* Costo COP
* Registro INVIMA
* Observaciones

Funcionalidades:

* Agregar producto
* Editar producto
* Eliminar producto
* Guardado automático opcional
* Validaciones obligatorias

---

MÓDULO 3
GESTIÓN DE FIRMAS
-----------------

Permitir captura de firma digital.

Opciones:

* Firma dibujada con mouse
* Firma táctil
* Almacenamiento como imagen

Cada firma debe quedar asociada a una acta específica.

Guardar:

* Usuario
* Fecha
* Hora
* Dirección IP
* Firma digital

---

MÓDULO 4
APROBACIONES
------------

Estados:

* Borrador
* Pendiente Aprobación
* Aprobada
* Rechazada
* Finalizada

Flujo:

Borrador
→ Pendiente
→ Aprobada/Rechazada
→ Finalizada

Una acta finalizada no puede modificarse.

Registrar trazabilidad completa.

---

MÓDULO 5
ADMINISTRACIÓN DE CATÁLOGOS
---------------------------

Solo administradores.

Catálogos:

* Empresas Responsables
* Áreas
* CECO
* Clasificaciones
* Causales de Destrucción
* Tipos de Controlado
* Estados del Acta

Operaciones:

* Crear
* Editar
* Activar
* Desactivar

Los registros inactivos no deben aparecer en nuevos formularios.

---

MÓDULO 6
GENERACIÓN DE PDF
-----------------

Generar automáticamente un PDF profesional.

El PDF debe incluir:

Encabezado:

* Logo empresa
* Número Acta
* Fecha

Información General:

* Área
* CECO
* Responsable
* Observaciones

Detalle:
Tabla completa de productos

Firmas:

* Operativo
* Supervisor

Pie:

* Fecha generación
* Consecutivo

Diseño corporativo profesional.

---

MÓDULO 7
EXPORTACIÓN EXCEL
-----------------

Exportar:

* Consulta completa
* Resultados filtrados
* Detalle de actas

Respetar siempre los filtros aplicados.

---

## REGLAS DE NEGOCIO

RN001:
Número de acta autogenerado y único.

Formato sugerido:

ACT-YYYY-000001

RN002:
No se puede finalizar una acta sin productos.

RN003:
Todo producto debe tener causal de destrucción.

RN004:
Acta finalizada no puede modificarse.

RN005:
Toda firma debe estar asociada a una acta.

RN006:
Exportaciones respetan filtros.

RN007:
Catálogos inactivos no pueden utilizarse.

---

## REQUISITOS NO FUNCIONALES

* Tiempo de respuesta menor a 3 segundos.
* Soportar grandes volúmenes de información.
* Interfaz moderna.
* Responsive.
* Auditoría completa.
* Seguridad basada en roles.
* Escalabilidad futura.
* Integridad de datos.
* Validaciones backend y frontend.

---

## BASE DE DATOS SQL SERVER

Crear el modelo relacional completo.

TABLA ACTAS_DESTRUCCION

* IdActa PK
* NumeroActa UNIQUE
* FechaRegistro
* AreaGeneradora
* CECO
* Responsable
* Observaciones
* Estado
* FechaCreacion
* FechaModificacion

Campos futuros:

* FutureVarchar1
* FutureVarchar2
* FutureNumber1
* FutureNumber2
* FutureChar1
* FutureChar2
* FutureDate1
* FutureDate2

TABLA DETALLE_ACTA

* IdDetalle PK

* IdActa FK

* EmpresaResponsable

* DescripcionProducto

* CodigoSAP

* Lote

* OrdenProduccion

* TipoControlado

* Clasificacion

* FechaVencimiento

* CausalDestruccion

* CantidadKg

* CantidadUnidades

* CostoCOP

* RegistroINVIMA

* Observaciones

Campos futuros:

* FutureVarchar1
* FutureVarchar2
* FutureNumber1
* FutureNumber2
* FutureChar1
* FutureChar2
* FutureDate1
* FutureDate2

TABLA FIRMAS

* IdFirma
* IdActa
* Usuario
* FirmaBase64
* FechaFirma

Campos futuros

TABLA CATALOGOS

* IdCatalogo
* TipoCatalogo
* Valor
* Estado

Campos futuros

TABLA USUARIOS

* IdUsuario
* Nombre
* Correo
* PasswordHash
* Rol
* Estado

---

## API REST

Generar endpoints completos:

Auth
Actas
Detalle Actas
Firmas
Catálogos
Usuarios
Reportes

Implementar:

GET
POST
PUT
DELETE

Documentar con Swagger.

---

## INTERFAZ

Diseño moderno empresarial.

Inspirado en:

* SAP Fiori
* Microsoft Dynamics
* Power Apps moderno

Utilizar:

* Dashboard principal
* Sidebar
* Breadcrumbs
* Tablas avanzadas
* Modales
* Formularios dinámicos

---

## ENTREGABLES

Generar:

1. Arquitectura completa.
2. Modelo entidad-relación.
3. Script SQL Server.
4. Backend Express.
5. Frontend React.
6. Autenticación JWT.
7. CRUD completo.
8. Gestión de firmas.
9. Generación PDF.
10. Exportación Excel.
11. Control de roles.
12. Auditoría.
13. Manual técnico.
14. Manual de usuario.

El código debe ser empresarial, escalable, modular, limpio, documentado y listo para producción.
