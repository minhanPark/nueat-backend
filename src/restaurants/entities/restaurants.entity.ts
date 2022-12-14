import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  @Column()
  @Length(2, 10)
  @IsString()
  name: string;

  @Field((type) => Boolean, { nullable: true, defaultValue: true })
  @Column({ nullable: true, default: true })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String, { defaultValue: '부산' })
  @Column()
  @IsString()
  address: string;

  @Field((type) => String)
  @Column()
  @IsString()
  ownerName: string;

  @Field((type) => String)
  @Column()
  @IsString()
  categoryName: string;
}
