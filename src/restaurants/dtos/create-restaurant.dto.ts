import { ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { IsString, IsBoolean, Length } from 'class-validator';
import { Restaurant } from '../entities/restaurants.entity';

// @ArgsType()
// export class CreateRestaurantDto {
//   @Field((type) => String)
//   @Length(2, 10)
//   @IsString()
//   name: string;

//   @Field((type) => Boolean)
//   @IsBoolean()
//   isVegan: boolean;

//   @Field((type) => String)
//   @IsString()
//   address: string;

//   @Field((type) => String)
//   @IsString()
//   ownerName: string;
// }

@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}
