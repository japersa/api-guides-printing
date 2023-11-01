import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class FiltersDto {
  @ApiProperty({
    type: Array,
    description: 'Guias',
    isArray: true,
    required: false
  })
  @ValidateIf(o => o.fechaInicial === undefined || o.fechaInicial === '' || o.fechaFinal === undefined || o.fechaFinal === '')
  @IsArray()
  @IsNotEmpty({
    message: 'Debe indicar un filtro de búsqueda ( Guias: [números] o Fechas: (Inicial - Final) ).'
  })
  @Transform(value => {
    const guias = [];
    value.value.forEach(element => {
      if (typeof element !== 'number') {
        guias.push(Number(element));
      } else {
        guias.push(element);
      }
    });

    return guias;
  })
  guias: string[];

  @ApiProperty({
    type: String,
    description: 'Fecha inicial',
    example: '2023-10-10',
    required: false,
  })
  @ValidateIf(o => o.guias === undefined || o.guias.length <= 0)
  @IsDateString({
    strict: false,
  })
  @IsNotEmpty({
    message: 'Debe indicar un filtro de búsqueda ( Guias: [números] o Fechas: (Inicial - Final) ).'
  })
  fechaInicial: string;

  @ApiProperty({
    type: String,
    description: 'Fecha inicial',
    example: '2023-10-10',
    required: false,
  })
  @ValidateIf(o => o.guias === undefined || o.guias.length <= 0)
  @IsDateString({
    strict: false,
  })
  @IsNotEmpty({
    message: 'Debe indicar un filtro de búsqueda ( Guias: [números] o Fechas: (Inicial - Final) ).'
  })
  fechaFinal: string;

  @ApiProperty({
    type: Boolean,
    description: 'Retornar base64',
    example: 'true | false',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useBaseEncode: boolean;
}