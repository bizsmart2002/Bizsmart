import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

// El registro público (HU01) da de alta al propietario de un nuevo negocio.
// La creación de usuarios con otros roles (SELLER, VIEWER, otro ADMIN) se
// hace desde /users, protegido por RolesGuard (HU03/HU04).
export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
