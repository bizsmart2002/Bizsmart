import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  minimumStock: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}