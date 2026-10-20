import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // Enruta CUALQUIER método/ruta (GET/POST/PATCH/DELETE) hacia el
  // microservicio correspondiente. La seguridad real (JWT + roles) se valida
  // dentro de cada microservicio, no aquí (ver Fase 1, sección 5).
  @All('*')
  handle(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
}
