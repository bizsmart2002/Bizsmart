import { IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'OWNER', 'SELLER', 'VIEWER'])
  roleName?: string;

  @IsOptional()
  active?: boolean;
}
