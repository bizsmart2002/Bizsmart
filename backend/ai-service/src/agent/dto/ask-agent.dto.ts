import { IsNotEmpty, MaxLength } from 'class-validator';

export class AskAgentDto {
  @IsNotEmpty()
  @MaxLength(300)
  question: string;
}
