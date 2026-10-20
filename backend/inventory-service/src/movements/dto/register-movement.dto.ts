import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class RegisterMovementDto {
  @IsInt()
  productId: number;

  @IsIn(['IN', 'OUT', 'ADJUSTMENT'])
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsNotEmpty()
  reference?: string;
}

// Usado internamente por sales-service para descontar stock tras una venta.
export class RegisterSaleMovementDto {
  @IsInt()
  productId: number;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsInt()
  minimumStock: number;

  @IsNotEmpty()
  reference: string; // ej: "SALE-123"

  @IsInt()
  createdBy: number;
}
