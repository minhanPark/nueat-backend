# NuEat backend

우선 세팅은 nestjs의 documentation에서 GRAPHQL을 따라했다.

```bash
npm i @nestjs/graphql @nestjs/apollo graphql apollo-server-express
```

위의 4개를 다운로드한다.  
예전과 다르게 driver를 추가해줘야한다.

```ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
```

## Code first

접근 방법이 2개 있는데 Code first와 Schema first가 있다.  
코드 퍼스트는 데코레이터와 타입스크립트를 이용해서 resolver롤 만들면 graphql scheme를 만들어 준다.

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
```

autoSchemaFile에 저렇게 파일 위치를 넣어주면 schema.gql이 자동으로 만들어진다.

```ts
// src/restaurants/restaurants.resolver.ts

import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class RestaurantResolver {
  // 쿼리는 첫번째 매개변수로 자기가 반환해야할 타입을 리턴하는 함수를 받는다.
  // () => Boolean을 해도 되지만 모양이 더 예쁘도록 returns => Boolean 형태로 사용함
  @Query((returns) => Boolean)
  // 위의 리턴 타입은 GRAPHQL을 위한 타입이고
  // 아래의 리턴타입은 타입스크립트를 위한 타입이다.
  isPizzaGood(): Boolean {
    return true;
  }
```

예시로 레스토랑 resolver를 만들면 src/schema.gql 파일 안에 스키마를 자동으로 만들어준다.

```gql
# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Query {
  isPizzaGood: Boolean!
}
```

파일이 만들어지는 것이 아니고 메모리상에서만 만들어지게 하려면 autoSchemaFile에 true만 적으면 된다. 해당 강의에서는 true만 주었음

## entity 작성

엔티티는 데이터베이스에 들어가는 형태라고 생각하면 된다.

```ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean, { nullable: true })
  isGood?: boolean;
}
```

ObjectType과 Field 모두 첫번째로는 자기의 타입을 반환하는 함수를 가진다.  
기본적으로 타입스크립트에서는 타입을 소문자로 쓰지만 graphql의 데코레이터는 타입을 파스칼 케이스로 받는다.  
또한 GraphQL 스키마의 대부분의 정의는 object types이다. 정의하는 각 object type은 응용 프로그램 클라이언트가 상호 작용해야하는 도메인 객체를 나타내야 합니다.

## Arguments

쿼리에는 arguments를 쓸 수 있다.

```graphql
{
  restaurant(vaganOnly: true) {
    name
  }
}
```

위에처럼 쿼리를 사용할 때 argument(여기선 vaganOnly)를 보낼 수 있는데, 해당 쿼리를 사용하려면 코드상에서 @Args 데코레이터를 사용해야한다.

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Query((returns) => [Restaurant])
  restaurant(@Args('vaganOnly') veganOnly: boolean) {
    return [];
  }
}
```

## InputTypes과 ArgumentType

```ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean)
  isVegan: boolean;

  @Field((type) => String)
  address: string;

  @Field((type) => String)
  ownerName: string;
}
```

위와 같은 entity가 있다.  
만약 createRestaurant라는 mutation을 만든다고 했을 떄 아래처럼 보내게 될 것이다.

```graphql
mutation {
  createRestaurant(
    name: "RW"
    isVegan: false
    address: "부산"
    ownerName: "사장"
  )
}
```

resolver에서 받는 일반적인 형태는 무엇이 될까?

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args('name') name: string,
    @Args('isVegan') isVegan: boolean,
    @Args('address') address: string,
    @Args('ownerName') ownerName: string,
  ): boolean {
    return true;
  }
}
```

위와 같은 형태가 될 것이다.  
객체로 한번에 받을 수 있도록 사용할 수 있는 것이 InputType이다.(Mutation이 객체를 argument로 취해야 하는 경우 사용 가능, InputType은 argument로 전달할 수 있는 특수한 유형의 객체)

```ts
// src/restaurants/dto/create-restaurant.dto.ts

import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRestaurantDto {
  @Field((type) => String)
  name: string;
  @Field((type) => Boolean)
  isVegan: boolean;
  @Field((type) => String)
  address: string;
  @Field((type) => String)
  ownersName: string;
}
```

이렇게 InputType을 사용하면 객체로 받아서 사용할 수 있다.  
그리고 Input 타입으로 작성했다면 resolver 안에 mutation은 아래처럼 변경되어야 한다.

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args('createRestaurantInput') createRestaurantInput: CreateRestaurantDto,
  ): boolean {
    return true;
  }
}
```

그리고 mutation을 보낼 때는 아래처럼 보내야한다.

```graphql
mutation {
  createRestaurant(
    createRestaurantInput: {
      name: "RW"
      isVegan: false
      address: "부산"
      ownersName: "사장"
    }
  )
}
```

> 보내는건 Args 타입으로 따로 보내고, 받는건 객체로 한번에 받는 방법은 무엇이 있을까?

dto의 타입을 ArgsType만들고, Args로 전체 매개변수를 받으면 된다.

```ts
// dto의 타입을 ArgsType
@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  name: string;
  @Field((type) => Boolean)
  isVegan: boolean;
  @Field((type) => String)
  address: string;
  @Field((type) => String)
  ownersName: string;
}
```

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args() createRestaurantInput: CreateRestaurantDto,
  ): boolean {
    console.log(createRestaurantInput);
    return true;
  }
}
```

@Args로 저렇게 전체를 받으면 createRestaurantInput에는 매개변수가 객체로 담길 것이다.

```graphql
mutation {
  createRestaurant(
    name: "RW"
    isVegan: false
    address: "부산"
    ownersName: "사장"
  )
}
```

기존처럼 mutation도 위와 같이 보낼 수 있게된다.

## Validating ArgsType

ArgsType에 유효성 검사를 해줄 수 있다.

```cmd
npm i class-transformer class-validator
```

설치 이후에 app에 설정을 바꿔준다.

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

```ts
import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  @Length(2, 10)
  @IsString()
  name: string;

  @Field((type) => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  address: string;

  @Field((type) => String)
  @IsString()
  ownersName: string;
}
```

class-validator를 필수값에 대한 에러뿐만 아니라 타입, 길이 등 좀 더 다양한 유효성 검사를 추가할 수 있다.

## 도커 컨테이너 맵핑 시 위치

-p 라고 속성을 줄 때 host-port : container-port 순서로 주게된다.

## typeorm하고 연결하기

```bash
npm install --save @nestjs/typeorm typeorm pg
```

typeorm은 typeorm 모듈, pg는 postgres를 사용하기 위한 드라이버다. @nestjs/typeorm은 nest에서 타입orm을 사용하기 위한 드라이버다

```ts
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'host ip',
      port: host port,
      username: 'username',
      password: 'user password',
      database: 'database name',
      synchronize: true,
      logging: true,
    }),
  ],
  controllers: [],
  providers: [],
})
```

위와 같이 typeOrmModule에 값을 전달해주면 된다.

## dotenv

기본적으로 nest에서는 @nestjs/config를 사용해서 dotenv를 활용할 수 있다.

```bash
npm i --save @nestjs/config
```

위와 같이 설치하고 아래처럼 설정하면 된다.

```ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
  ignoreEnvFile: process.env.NODE_ENV === 'prod',
});
```

isGlobal을 true로 설정해서 어떤 모듈 안에서도 사용할 수 있도록 했고, 환경변수에 따라서 적용시킬 env를 변경할 수 있다.

ignoreEnvFile: process.env.NODE_ENV === 'prod'을 적용시켜주면 prod 환경일 때는 env파일을 무시하게 된다. 다른 방법으로 주입시켜주면 됨. (호스팅 사이트 등에서 주입)

마지막으로 env 파일을 작성한 후 typeorm 모듈에 넣어주면 된다.

```ts
TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      logging: true,
    }),
```

또한 config의 유효성 검사도 할 수 있다.

```bash
npm i joi
```

joi는 자바스크립트용 강력한 스키마 설명 언어 및 데이터 유효성 검사기다.

```ts
import * as Joi from 'joi';
// Joi가 자바스크립트로 만들어져 있기 때문에 위와같은 형태로 import

ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
      }),
    }),
```

그 후 ConfigModule에 validationSchema을 Joi로 만들어 전달해주면 된다.

## entity

엔티티는 데이터베이스에 저장되는 데이터의 형태로 보여주는 모델

```graphql
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean)
  isVegan: boolean;

  @Field((type) => String)
  address: string;

  @Field((type) => String)
  ownerName: string;
}
```

기존에 entity라고 이름 붙여준 것은 graphql에서 사용하는 형태(graphql에서 사용하는 schema)다.

```ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;
}
```

타입orm에서 엔티티를 만드는 방법은 위와 같다. 매우 비슷해서 돌려쓸 수 있다.

```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @Field((type) => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field((type) => String)
  @Column()
  name: string;

  @Field((type) => Boolean)
  @Column()
  isVegan: boolean;

  @Field((type) => String)
  @Column()
  address: string;

  @Field((type) => String)
  @Column()
  ownerName: string;
}
```

위와 같이 Graphql schema와 typeorm의 entity를 한번에 정의가 가능하다.

## db에 추가하기

위에서 정의한 것을 어떻게 디비에 추가할 수 있을까?

```ts
TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging: true,
      entities: [Restaurant],
    }),
```

typeorm 모듈에 entities에 엔티티를 추가해주면(synchronize: true로 해서 알아서 싱크를 맞춰줌) 디비에 추가된 것을 알 수 있다.

## Active Record vs Data Mapper

typeorm이 db와 상호작용 하는 방법으론 2가지 패턴이 있다. 하나는 Active Record 패턴이다.  
Active Record 패턴은 정의한 모델을 통해서 데이터베이스에 접근할 수 있다.

```ts
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;
}
```

위처럼 BaseEntity를 가져와서 상속받은 후 아래처럼 사용한다.

```ts
const user = new User();
user.firstName = 'Timber';
user.lastName = 'Saw';
user.isActive = true;
await user.save();

// example how to remove AR entity
await user.remove();

// example how to load AR entities
const users = await User.find({ skip: 2, take: 5 });
const newUsers = await User.findBy({ isActive: true });
const timber = await User.findOneBy({ firstName: 'Timber', lastName: 'Saw' });
```

find, save 등은 다 BaseEntity를 상속받았기 때문에 사용 가능한 것이다.

```ts
export class User extends BaseEntity {
    (...)
    static findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany()
    }
}
```

만약 findByName이라는 메소드를 만들고 싶다면 User 클래스 안에서 정의하면 된다.

Data Mapper는 repository 라는 분리된 클래스에서 모든 쿼리 메소드를 정의해 사용하는 것이다. 즉 레포지토리를 이용해서 db와 상호작용 한다.  
데이터 맵퍼에서 엔티티들은 매우 멍청해서, 속성을 그냥 정의하고, 쓸데없는 메소드들이 있을 수 있습니다.

```ts
const userRepository = dataSource.getRepository(User);

// example how to save DM entity
const user = new User();
user.firstName = 'Timber';
user.lastName = 'Saw';
user.isActive = true;
await userRepository.save(user);

// example how to remove DM entity
await userRepository.remove(user);

// example how to load DM entities
const users = await userRepository.find({ skip: 2, take: 5 });
const newUsers = await userRepository.findBy({ isActive: true });
const timber = await userRepository.findOneBy({
  firstName: 'Timber',
  lastName: 'Saw',
});
```

위처럼 repository를 불러와서 사용합니다.
Data Mapper는 대규모 앱에서 더 효과적인 유지 관리에 도움되고, Active Record 방식은 작은 앱에서 잘 작동해 작업을 단순하게 유지하는데 도움이 된다.  
강의에서 DataMapper를 사용하려는 이유는 Repository를 사용하는 모듈을 쓸 수 있기 때문이다. 그래서 해당 모듈로 어디서든 접근 가능해진다.(서비스나 테스트 등에서도)

## Repository 삽입하기

```ts
const userRepository = dataSource.getRepository(User);
```

위와 같이 repository를 갖고 오는 방법을 정의했었는데, 각 모듈에 넣는 삽입하는 방식은 어떻게 될까?

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurants.entity';
import { RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant])],
  providers: [RestaurantResolver, RestaurantService],
})
export class RestaurantsModule {}
```

TypeOrmModule.forFeature에 배열로 entity 들을 전달해주면 repository로 삽입이 된다.

```ts
@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}
  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }
}
```

그리고 서비스에서 InjectRepository(Restaurant)을 통해 repository를 가지고 오면 된다.
