# Carpeta MVP — BizSmart

Esta carpeta reúne, en un solo lugar y fuera del proyecto completo, los archivos que
muestran el patrón **MVP (Model - View - Presenter)** usado en BizSmart, tanto en el
backend (NestJS) como en el frontend (Angular). Cada archivo mantiene su nombre
original pero con un prefijo que dice de qué servicio/feature es y qué rol cumple en
el patrón (`MODEL`, `VIEW` o `PRESENTER`), para poder mostrarlos uno por uno sin tener
que navegar por toda la estructura de carpetas del proyecto.

## Cómo se aplica MVP en el backend (NestJS)

| Rol MVP | Qué es en BizSmart | Dónde vive normalmente |
|---|---|---|
| **Model** | La entidad de TypeORM: la estructura de datos y el acceso a la base de datos. No sabe nada de HTTP. | `src/<dominio>/entities/*.entity.ts` |
| **View** | El Controller: recibe la petición HTTP, la valida con el DTO y llama al Presenter. No tiene lógica de negocio. | `src/<dominio>/*.controller.ts` |
| **Presenter** | El Service: contiene la lógica de negocio real (reglas, validaciones, cálculos) y coordina el Model. | `src/<dominio>/*.service.ts` |

Dos servicios (`reporting-service` y `ai-service`, en parte) no tienen un Model propio
en forma de entidad porque son de solo lectura sobre los esquemas de los demás
dominios (usan SQL crudo en vez de una entidad de TypeORM) — por eso en esta carpeta
solo aparecen su View y su Presenter.

## Cómo se aplica MVP en el frontend (Angular)

| Rol MVP | Qué es en BizSmart | Dónde vive normalmente |
|---|---|---|
| **Model** | La interfaz TypeScript que describe los datos (`*.model.ts` en `src/app/models/`) + el Service que llama a la API (`*.service.ts`). | `src/app/models/` y `src/app/features/<feature>/*.service.ts` |
| **View** | El Component: la plantilla y lo que se ve en pantalla. Delega toda decisión al Presenter. | `src/app/features/<feature>/*.component.ts` |
| **Presenter** | Una clase aparte que contiene la lógica de la pantalla (qué mostrar, cuándo, con qué datos) sin tocar el DOM directamente. | `src/app/features/<feature>/*.presenter.ts` |

Se incluyeron 3 features completas con los tres roles presentes (`products`, `sales`,
`auth`/login) y el caso de `dashboard`, que no tiene un Presenter separado porque su
lógica es simple y vive directamente en el Component.

## Archivos incluidos

### Backend (7 microservicios)

| Servicio | Model | View | Presenter |
|---|---|---|---|
| auth-service | `backend-auth-service-MODEL-user.entity.ts` | `backend-auth-service-VIEW-auth.controller.ts` | `backend-auth-service-PRESENTER-auth.service.ts` |
| product-service | `backend-product-service-MODEL-product.entity.ts` | `backend-product-service-VIEW-products.controller.ts` | `backend-product-service-PRESENTER-products.service.ts` |
| inventory-service | `backend-inventory-service-MODEL-inventory.entity.ts` | `backend-inventory-service-VIEW-inventory.controller.ts` | `backend-inventory-service-PRESENTER-inventory.service.ts` |
| sales-service | `backend-sales-service-MODEL-sale.entity.ts` | `backend-sales-service-VIEW-sales.controller.ts` | `backend-sales-service-PRESENTER-sales.service.ts` |
| customer-service | `backend-customer-service-MODEL-customer.entity.ts` | `backend-customer-service-VIEW-customers.controller.ts` | `backend-customer-service-PRESENTER-customers.service.ts` |
| reporting-service | *(sin entidad propia, solo lectura)* | `backend-reporting-service-VIEW-dashboard.controller.ts` | `backend-reporting-service-PRESENTER-dashboard.service.ts` |
| ai-service | *(sin entidad propia, solo lectura)* | `backend-ai-service-VIEW-recommendations.controller.ts` | `backend-ai-service-PRESENTER-recommendations.service.ts` |

### Frontend (Angular)

| Feature | Model | View | Presenter |
|---|---|---|---|
| auth / login | `frontend-auth-MODEL-auth.model.ts`, `frontend-auth-MODEL-auth.service.ts` | `frontend-auth-VIEW-login.component.ts` | `frontend-auth-PRESENTER-login.presenter.ts` |
| products | `frontend-products-MODEL-product.model.ts`, `frontend-products-MODEL-products.service.ts` | `frontend-products-VIEW-products.component.ts` | `frontend-products-PRESENTER-products.presenter.ts` |
| sales | `frontend-sales-MODEL-sale.model.ts`, `frontend-sales-MODEL-sales.service.ts` | `frontend-sales-VIEW-sales.component.ts` | `frontend-sales-PRESENTER-sales.presenter.ts` |
| dashboard | `frontend-dashboard-MODEL-dashboard.model.ts`, `frontend-dashboard-MODEL-dashboard.service.ts` | `frontend-dashboard-VIEW-dashboard.component.ts` | *(lógica dentro del propio Component)* |

> Nota: estos archivos son copias para consulta/exposición. El proyecto real sigue
> funcionando desde su propia estructura de carpetas (`backend/` y `frontend/`); los
> cambios que se hagan aquí no se reflejan en el sistema que corre con Docker.
