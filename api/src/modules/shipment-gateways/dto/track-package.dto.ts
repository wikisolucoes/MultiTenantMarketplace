import { IsString, IsOptional } from 'class-validator';

export class TrackPackageDto {
  @IsString()
  trackingCode: string;

  @IsOptional()
  @IsString()
  carrier?: string;
}