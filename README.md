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

## Mapped Types

엔티티에 새로운 필드가 추가되었는데, 관련이 있는 dto들을 한번에 수정할 수는 없을까? 이때 활용할 수 있는 것이 Mapped type이다.

- PartialType: 필드 부분들을 옵셔널하게 바꿔줌
- PickType: 몇가지만 선택해서 새로 만듬
- OmitType: 몇가지만 생략해서 새로만듬

여기서 중요한건 모두 InputType이 되어야 한다는 것이다

```ts
@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}
```

가령 위와 같이 정의했다고 하면 에러가 난다.

> Input Object type CreateRestaurantDto must define one or more fields

이것은 InputType이 아니기 때문에 나타나는 에러다. Input 타입으로 바꿔주려면 2가지 방법이 있다. 하나는 Mapped type의 3번째 매개변수에 InputType을 넣어주는 것이다. 그러면 타입이 변환되서 사용할 수 있게 된다.

```ts
@InputType()
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  InputType,
) {}
```

그게 아니라면 dto에 input type을 붙이고 isAbstract를 추가한다.

```ts
@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @Field((type) => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field((type) => String)
  @Column()
  @Length(2, 10)
  @IsString()
  name: string;

  @Field((type) => Boolean)
  @Column()
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
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
```

맨 위에 InputType을 추가하고 validation 부분을 각 필드에 추가했다.  
"isAbstract: true"을 추가하지 않으면 어떻게 될까 ?  
Schema must contain uniquely named types but contains multiple types named "Restaurant"라고 뜬다.  
InputType과 ObjectType 두가지를 만들어서 다 스키마가 추가되려고 하니 이름이 중복되기 때문이다.

> isAbstract를 지정하면 현재 클래스를 Graphql 스키마에 추가하지 않고, 어딘가에 복사해서 쓰는 용도로만 사용하도록 지정한다.

## 기본값 넣기

```ts
@Field((type) => Boolean, { defaultValue: true })
@Column({ default: true })
@IsOptional()
@IsBoolean()
isVegan: boolean;
```

위와 같은 컬럼이 있다고 하자.  
Field는 graphql을 위해서 설정하는 것이고, column은 typeorm을 위해서 설정하는 것이다. optional을 줘서 값이 안들어가도 되도록 만들었다.

## Update 시 한번에 인수 받기

업데이트를 할 때는 id가 필요하다 그렇다면 인수를 두개 받아야 할까?

```ts
@InputType()
export class UpdateRestaurantInputType extends PartialType(
  CreateRestaurantDto,
) {}

@InputType()
export class UpdateRestaurantDto {
  @Field((type) => Number)
  id: number;

  @Field((type) => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}
```

위와 같이 Partial 타입으로 데이터를 받는 Input 타입을 만들고, dto로 사용할 Input 타입을 하나 더 만들어서 사용하면 하나의 객체로 업데이트할 데이터를 받을 수 있다.

## 업데이트 시 조심할 것

업데이트 때 객체라 생각해서 그냥 전달하면 안된다.

```ts
updateRestaurant({ id, data }: UpdateRestaurantDto) {
    console.log(data);
    return this.restaurants.update(id, data);
  }
// [Object: null prototype] {
// name: 'changed!!',
//  isVegan: true,
//  address: '부산'
}
```

위와 같다면 에러가 날 것이다.
Object: null prototype은 무엇일까? 일반적으로 객체로 만들면 객체에 대한 메소드들을 다 상속받을 것이다. 하지만 그런것들이 필요없다면? 리소스 등을 아끼기 위해서 Object: null prototype으로 만들어 주면된다.

```ts
updateRestaurant({ id, data }: UpdateRestaurantDto) {
    console.log(data);
    return this.restaurants.update(id, {...data});
  }
```

그래서 위처럼 객체로 전달해주어야 한다.

## 공통으로 사용할 Common 모듈 만들기

엔티티에는 공통으로 들어가는 부분이 있다. id, createdAt, updatedAt인데 common 모듈로 이 부분들을 공통으로 처리할 수 있다.

```ts
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class CoreEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

common 모듈을 만들고, 위와 같이 엔티티를 정의한다.
다 상속해서 사용할 것이니 entity타입을 주지는 않았다.

```ts
@Entity()
export class User extends CoreEntity {
  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: UserRole;
}
```

그리고 위에서 처럼 User가 상속해서 사용하면 된다.

## private과 readonly 역할

```ts
constructor(private readonly usersService: UserService) {}
```

위처럼 private과 readonly를 동시에 넣는 이유는 무엇일까?  
private은 다른 클래스에서 접근하지 못하게 하고, readonly를 속성을 readonly 속성을 줘서 실수로라도 오버라이드 하지 않도록 하게 해준다.

## Listeners and Subscribers

> 모든 엔티티는 특정 이벤트를 수신대기하는 메소드를 만들 수가 있습니다. 수신하려는 이벤트에 따라서 특수 데코데리어로 해당 메소드를 표시해야합니다.

비밀번호는 hash가 되어야 하니 삽입되기 전에 hash되어야한다.

```ts
@BeforeInsert()
  async hashPassword(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
```

그래서 위와 같이 정의할 수 있다

## Static 모듈과 Dynamic 모듈

정적 모듈은 기본적으로 설정이 같은 모듈이다. 동적 모듈은 forRoot 등을 통해서 달라지는 설정들을 넣어서 정적 모듈을 만들어준다.

## 미들웨어

미들웨어는 라우트 핸들러 전에 호출되는 함수  
express에서 사용할 때 처럼 req, res, next 등을 사용한다.

```ts
import { NextFunction, Request, Response } from 'express';

export function JwtMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(req.headers);
  // 키를 대문자로 보내도 소문자로 처리되서 온다.
  next();
}
```

위와 같이 미들웨어를 만들었으면, 모듈 전체에 적용되도록 하든 지 아니면 특정 모듈에 적용되도록 할 수 있다.  
전체에 적용하는 방법은 bootstrap에 적용시키면 된다.

```ts
//main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(JwtMiddleware);
  await app.listen(3000);
}
bootstrap();
``;
```

> function으로 한 것들만 app.use를 사용할 수 있다. class 미들웨어를 사용하려면 app.module에서 처리해야한다.

```ts
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    console.log(req.headers);
    next();
  }
}
```

클래스 형태로 바꾸려면 위와 같이 바꿔야함.

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.ALL });
  }
}
```

앱모듈은 위와 같이 사용해서 미들웨어를 특정 path에서 사용할 수 있다

## Context

Context는 함수로 정의되고, 각 request에 대해서 context를 사용할 수 있다

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  context: ({ req }) => ({ user: req['user'] }),
});
```

GraphQLModule에서 context를 위와 같이 설정해 줄 수 있다. req['user']는 이미 미들웨어에서 넣어줬기 때문에 가능하다.

```ts
me(@Context() context) {
    if (!context.user) {
      return;
    } else {
      return context.user;
    }
  }
```

사용할 때는 위와 같이 Context를 불러와서 사용하면 된다.

## AuthGuard

AuthGuard를 만들땐 CanActivate를 활용할 수 있다.

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // 가져오는 context는 http의 context이다. 그래서 graphql에서 사용하려면 graphql context로 바꿔줘야 한다.
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    if (!user) {
      return false;
    }
    return true;
  }
}
```

true면 통과하고, false면 통과하지 못한다.

> 여기서 DI 등이 필요 없어서 App.module에서는 Auth모듈을 import할 필요는 없었다.

```ts
@Query((returns) => User)
  @UseGuards(AuthGuard)
  me() {}
```

사용할 때는 위에처럼 UseGuards를 사용하면 된다.

## 데코레이터 만들기

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    return user;
  },
);
```

위와 같이 간편하게 데코레이터를 만들 수 있다.  
context는 다시 gql껄로 변경 시켰음.

```ts
me(@AuthUser() authUser: User) {
    return authUser;
  }
```

위와 같이 만들었기 때문에 기존에 사용하면 params 데코레이터 처럼 사용하면 된다

## 비밀번호는 왜 해시되지 않았을까?

```ts
@BeforeInsert()
@BeforeUpdate()
  async hashPassword(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
```

위와 같이 listener가 있을 때에 아래 함수를 실행시켰다고 하자.

```ts
async editProfile(userId: number, editProfileInput: EditProfileInput) {
    return this.users.update(userId, { ...editProfileInput });
  }
```

비밀번호는 해싱되서 드가지 않는다. 이유는 모델에서 아무것도 수정하지 않았기 때문이다. 모델에서 변경되어야 리스너들이 작동하는데, update쿼리는 바로 db에 쿼리를 보내기 때문이다.  
그래서 비밀번호 해싱 등의 데이터가 들어가기 전에 수정할 것들이 있다면 아래처럼 해야한다.

```ts
async editProfile(userId: number, { email, password }: EditProfileInput) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }
```

## 관계설정하기(OneToOne)

```ts
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field((type) => String)
  code: string;

  @OneToOne((type) => User)
  @JoinColumn()
  user: User;
}
```

위에 Verification과 User를 OneToOne으로 관계설정했다.  
JoinColumn이 추가된 엔티티쪽에 관계의 id가 생긴다.  
실제로 프리즈마를 사용할 땐 userId 컬럼이 생기지는 않았는데 typeOrm에서는 userId가 생기는 것을 확인할 수 있었다.

## 관계불러오기

```ts
const verification = await this.verifications.findOne({
  where: {
    code,
  },
});
```

위의 verification을 확인해보자.

```
Verification {
  id: 1,
  createdAt: 2022-12-25T16:38:40.928Z,
  updatedAt: 2022-12-25T16:38:40.928Z,
  code: '5e1fc043-26c1-4325-946e-047a98725083'
}
```

위와 같이 나타날 것이다.  
db에는 userId가 있는데 왜 나타나지 않는 것일까?  
관계를 불러오는 것은 기본적으로 리소스가 많이 들기 때문에 따로 추가하지 않으면 불러오지 않는다.

```ts
const verification = await this.verifications.findOne({
  where: {
    code,
  },
  loadRelationIds: true,
});
```

loadRelationIds를 true로 주면 관계가 설정된 entity의 id를 가져온다.

```
Verification {
  id: 1,
  createdAt: 2022-12-25T16:38:40.928Z,
  updatedAt: 2022-12-25T16:38:40.928Z,
  code: '5e1fc043-26c1-4325-946e-047a98725083',
  user: 3
}
```

중요한건 user: 3라는 것이다.(userId아님)  
entity에서 user라고 관계를 맺었기 때문인 것이다.  
만약 id가 아니라 user 객체가 필요하다면 아래처럼 바꿔주면 된다.

```ts
const verification = await this.verifications.findOne({
  where: {
    code,
  },
  relations: ['user'],
});
```

relations를 설정해주면 user에 id가 아니라 user객체가 들어간다.

```ts
if (verification) {
  verification.user.verified = true;
  this.users.save(verification.user);
}
```

그다음에 verified의 값을 위와 같이 고친 후에 save했는데 잘 적용되었다.  
해당 user가 누구인 지 잘 인식하고 있는 것 같다.

## 비밀번호가 변경되는 이슈 해결

```ts
if (verification) {
  verification.user.verified = true;
  this.users.save(verification.user);
  return true;
}
```

해당 코드에 user에는 비밀번호가 담겨있다. 그래서 비밀번호가 바뀌는 이슈가 생김.  
첫번째 방법은 save를 쓰는것이 아니라 update를 쓰는 것이다. 그러면 db에 쿼리를 바로 날리기 때문에 해시가 변화되지 않을 것이다.  
두번째 방법은 비밀번호를 속성 변경해주는 것이다.

```ts
@Column({ select: false })
@Field((type) => String)
password: string;
```

기본적으로 select는 true인데 select를 false로 하면 user를 불러올 때 값을 가져오지 않는다.

```ts
const user = await this.users.findOne({
  where: { email },
  select: ['password', 'id'],
});
```

만약 비밀번호가 필요한 순간이 오면 select로 password를 넣어줘야한다.(다른 필요한 것들도 같이 select에 넣어줘야함)

## 관계 설정하기 (OneToMany)

우버 이츠의 경우 카테고리가 많은 레스토랑을 가진다(카테고리 1 : 레스토랑 N)

```ts
export class Category extends CoreEntity {
  @Field((type) => [Restaurant])
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];
}
```

그래서 OneToMany라고 카테고리에 적어주고, restaurants라는 필드를 만들어 준다.  
| id | createdAt | updatedAt | name | coverImg |  
디비버를 확인하니 위와 같이 생성되는 것을 확인했다.

```ts
export class Restaurant extends CoreEntity {
  @Field((type) => Category)
  @ManyToOne((type) => Category, (category) => category.restaurants)
  category: Category;
}
```

Many 부분에 포함되는 Restaurant는 ManyToOne라고 적어주고, category에 있는 컬럼들을 추가해준다.  
| id | createdAt | updatedAt | name | coverImg | address | categoryId |  
디비버를 확인하니 위와 같이 생성되는 것을 확인했다.

> 즉 디비상으로는 restaurants에서는 one으로 접근할 수 있는 id가 생기고, category에서는 many로 접근하는 것은 생기지 않음.

## APP_GUARD

nest에서는 기본적으로 APP_GUARD라고 가드를 제공한다.

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }
    // 가져오는 context는 http의 context이다. 그래서 graphql에서 사용하려면 graphql context로 바꿔줘야 한다.
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }
    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role);
  }
}
```

만들어둔 가드 클래스이다.

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
```

해당 부분을 useClass에 전달해두고, AppModule에 AuthModule을 추가하고 나면 매 요청마다 가드가 실행된다.

```ts
const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());
```

이 부분이 SetMetadata로 설정했을 때 갖고오는 부분이다.  
reflector의 타입에 배열을 붙이는게 맞는게 아닌가 싶지만 일단 강의따라서 넘어 갔다.

```ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';

export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
```

그래서 사용할 때는 Role(["Any"]) 이런식으로 사용하면 된다.

## 관계 가져올 때 RelationId 이용하기

```ts
@Field((type) => User)
@ManyToOne((type) => User, (user) => user.restaurants, {
  onDelete: 'CASCADE',
})
owner: User;

```

필드를 보면 N:1의 관계가 설정되어있고, owner의 타입은 User다. 하지만 id만 갖고온다면 owner의 타입은 number가 될 것이다.  
owner의 타입을 User | number라고 해야할까?

```ts
@RelationId((restaurant: Restaurant) => restaurant.owner)
ownerId: number;
```

이렇게 설정해주면 계속 ownerId가 오는 것을 확인할 수 있다.

## ResolveField

graphql에서 computed field를 만들 수 있다.  
db에는 존재하지 않고 Graphql 스키마에만 존재하며 매 요청마다 사용자에게 맞게 계산해서 보내준다.

```ts
@Resolver((of) => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField((type) => Number)
  restaurantCount(): number {
    return 70;
  }
}
```

## 페이지네이션

```ts
const restaurants = await this.restaurants.find({
  where: {
    category: {
      id: category.id,
    },
  },
  take: 3,
  skip: (page - 1) * 3,
});
```

take와 skip을 사용하면 pagination을 쉽게 구현할 수 있다.  
관계를 불러올 때도 pagination을 할 수 있을까? 일단 강의에서는 따로 구분해서 사용하도록 했다.

```ts
const category = await this.categories.findOne({
  where: { slug },
});
if (!category) {
  return {
    ok: false,
    error: '카테고리를 찾을 수 없습니다.',
  };
}
const restaurants = await this.restaurants.find({
  where: {
    category: {
      id: category.id,
    },
  },
  take: 3,
  skip: (page - 1) * 3,
});
category.restaurants = restaurants;
```

위처럼 카테고리를 찾고, 해당 카테고리에 맞는 레스토랑을 페이지에 맞게 불러와서 카테고리에 넣어준다.

```ts
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field((type) => Number, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field((type) => Number, { nullable: true })
  totalPages?: number;
}
```

페이지를 구성하는 클래스를 만들어서 필요한 곳에서 상속해서 사용하면 공통적으로 사용할수 있다.

```ts
const [restaurants, totalResults] = await this.restaurants.findAndCount({
  where: {
    name: ILike(`%${query}%`),
  },
  skip: (page - 1) * 3,
  take: 3,
});
```

findAndCount을 사용하면 배열을 리턴하는데, 결과값과 갯수를 둘다 리턴한다.

## Column의 타입

```ts
@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field((type) => String)
  name: string;

  @Field((type) => [String], { nullable: true })
  choices?: string[];

  @Field((type) => Int)
  extra: number;
}
```

위와 같이 Dishoption을 추가했다.  
entities에 추가하지 않았기 때문에 해당 테이블은 생기지 않았음.  
강의에서는 간단한건 json 형태 등으로 받으면 된다고 생각해서 그런것 같다.

제목처럼 column에는 타입을 지정할 수 있는데, 일반적으로 데이터베이스 지원 Column 타입을 모두 지원한다.

```ts
@Field((type) => [DishOption], { nullable: true })
@Column({ type: 'json', nullable: true })
options?: DishOption[];
```

그래서 json 형태로 옵션들을 보낼 생각인것같다.
