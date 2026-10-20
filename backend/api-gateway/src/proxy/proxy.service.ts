import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

// Tabla de enrutamiento: primer segmento de la URL -> variable de entorno
// del microservicio destino. Ver Fase 1, sección 10: Angular solo conoce
// esta URL del Gateway; nunca llama directamente a un microservicio.
const ROUTE_TABLE: Record<string, string> = {
  auth: 'AUTH_SERVICE_URL',
  users: 'AUTH_SERVICE_URL',
  roles: 'AUTH_SERVICE_URL',
  permissions: 'AUTH_SERVICE_URL',
  products: 'PRODUCT_SERVICE_URL',
  categories: 'PRODUCT_SERVICE_URL',
  inventory: 'INVENTORY_SERVICE_URL',
  alerts: 'INVENTORY_SERVICE_URL',
  sales: 'SALES_SERVICE_URL',
  customers: 'CUSTOMER_SERVICE_URL',
  dashboard: 'REPORTING_SERVICE_URL',
  reports: 'REPORTING_SERVICE_URL',
  agent: 'AI_SERVICE_URL',
  ai: 'AI_SERVICE_URL',
};

@Injectable()
export class ProxyService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  resolveTarget(firstSegment: string): string | null {
    const envKey = ROUTE_TABLE[firstSegment];
    if (!envKey) return null;
    return this.config.get<string>(envKey) ?? null;
  }

  async forward(req: Request, res: Response): Promise<void> {
    const [, firstSegment] = req.path.split('/');
    const target = this.resolveTarget(firstSegment);

    if (!target) {
      res.status(404).json({ statusCode: 404, message: 'Ruta no reconocida por el Gateway' });
      return;
    }

    const url = `${target}${req.originalUrl}`;

    try {
      const response = await firstValueFrom(
        this.http.request({
          url,
          method: req.method as any,
          data: req.body,
          headers: {
            ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
            'Content-Type': 'application/json',
          },
          validateStatus: () => true, // dejamos que el microservicio decida el código HTTP
          // Importante para el login con Google (HU02): sin esto, axios
          // seguiría la redirección hacia Google POR SU CUENTA, del lado
          // del servidor, y el navegador del usuario nunca llegaría a la
          // pantalla de consentimiento. El Gateway debe limitarse a avisarle
          // al navegador "ve tú a esta URL", no visitarla él mismo.
          maxRedirects: 0,
        }),
      );

      // 3xx con Location -> es una redirección (login con Google, por
      // ejemplo). Se reenvía tal cual al navegador en vez de tratarla
      // como una respuesta JSON normal.
      const location = response.headers?.location;
      if (response.status >= 300 && response.status < 400 && location) {
        res.redirect(response.status, location);
        return;
      }

      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      // El microservicio destino no respondió (caído, red, etc.) -> 503, sin exponer detalles internos.
      res.status(503).json({
        statusCode: 503,
        message: `El servicio "${firstSegment}" no está disponible en este momento`,
        error: 'Service Unavailable',
      });
    }
  }
}
