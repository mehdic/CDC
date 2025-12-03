/**
 * TypeORM Mock for Testing
 *
 * Provides mocked DataSource, repositories, and decorators for unit tests
 * This allows services to be tested without requiring a real database connection
 */

// Mock repository class with standard methods
class MockRepository {
  find = jest.fn().mockResolvedValue([]);
  findOne = jest.fn().mockResolvedValue(null);
  findOneBy = jest.fn().mockResolvedValue(null);
  findBy = jest.fn().mockResolvedValue([]);
  save = jest.fn().mockImplementation(entity =>
    Promise.resolve({ ...entity, id: 'mock-id' })
  );
  update = jest.fn().mockResolvedValue({ affected: 1 });
  delete = jest.fn().mockResolvedValue({ affected: 1 });
  create = jest.fn().mockImplementation(entity => entity);
  increment = jest.fn().mockResolvedValue({ affected: 1 });
  decrement = jest.fn().mockResolvedValue({ affected: 1 });

  // QueryBuilder pattern
  createQueryBuilder = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(0),
  });
}

// Mock DataSource class
class MockDataSource {
  isInitialized = true;

  initialize = jest.fn().mockResolvedValue(this);

  destroy = jest.fn().mockResolvedValue(undefined);

  getRepository = jest.fn().mockReturnValue(new MockRepository());

  getTreeRepository = jest.fn().mockReturnValue(new MockRepository());

  getMongoRepository = jest.fn().mockReturnValue(new MockRepository());

  query = jest.fn().mockResolvedValue([]);

  createQueryBuilder = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(0),
  });
}

// Simple no-op decorator function
const noOpDecorator = (...args: any[]): any => {
  // If last argument is a descriptor (for property decorators), return it
  const lastArg = args[args.length - 1];
  if (lastArg && typeof lastArg === 'object' && 'value' in lastArg) {
    return lastArg;
  }
  // If second argument is a string (propertyKey), return undefined for property decorator
  if (args.length >= 2 && typeof args[1] === 'string') {
    return undefined;
  }
  // Return the class/target for class decorators
  return args[0];
};

export const DataSource = jest.fn().mockImplementation(() => new MockDataSource());

export const Repository = jest.fn().mockImplementation(() => new MockRepository());

// Entity decorator - handles Entity() or Entity(options)
export const Entity = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Column decorators - handle Column(), Column(options), etc
export const Column = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const PrimaryColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const PrimaryGeneratedColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const ObjectIdColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Relation decorators
export const OneToOne = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const OneToMany = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const ManyToOne = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const ManyToMany = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const JoinColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const JoinTable = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Index decorators
export const Index = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const Unique = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Tree decorators
export const Tree = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const TreeChildren = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const TreeParent = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Versioning
export const VersionColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Special columns
export const CreateDateColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const UpdateDateColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const DeleteDateColumn = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Validation decorator
export const Check = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Generated column
export const Generated = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Default values
export const Default = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// AfterLoad, etc
export const AfterLoad = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const BeforeInsert = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const AfterInsert = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const BeforeUpdate = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const AfterUpdate = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const BeforeRemove = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const AfterRemove = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const BeforeSoftRemove = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const AfterSoftRemove = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const BeforeRecover = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const AfterRecover = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const EventSubscriber = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const TransactionEntityManager = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;
export const TransactionRepository = jest.fn((...args: any[]) => noOpDecorator(...args)) as any;

// Query operators
export const In = jest.fn((values: any[]) => ({ _type: 'in', values }));
export const Not = jest.fn((value: any) => ({ _type: 'not', value }));
export const LessThan = jest.fn((value: any) => ({ _type: 'lessThan', value }));
export const LessThanOrEqual = jest.fn((value: any) => ({ _type: 'lessThanOrEqual', value }));
export const MoreThan = jest.fn((value: any) => ({ _type: 'moreThan', value }));
export const MoreThanOrEqual = jest.fn((value: any) => ({ _type: 'moreThanOrEqual', value }));
export const Equal = jest.fn((value: any) => ({ _type: 'equal', value }));
export const Like = jest.fn((value: any) => ({ _type: 'like', value }));
export const ILike = jest.fn((value: any) => ({ _type: 'ilike', value }));
export const Between = jest.fn((from: any, to: any) => ({ _type: 'between', from, to }));
export const IsNull = jest.fn(() => ({ _type: 'isNull' }));
export const IsNotNull = jest.fn(() => ({ _type: 'isNotNull' }));
export const Raw = jest.fn((value: any) => ({ _type: 'raw', value }));
export const Brackets = jest.fn((fn: any) => ({ _type: 'brackets', fn }));
export const And = jest.fn((...values: any[]) => ({ _type: 'and', values }));
export const Or = jest.fn((...values: any[]) => ({ _type: 'or', values }));

// Transaction/Connection methods
export const createConnection = jest.fn().mockResolvedValue(new MockDataSource());
export const getConnection = jest.fn().mockReturnValue(new MockDataSource());
export const getRepository = jest.fn().mockReturnValue(new MockRepository());
export const getTreeRepository = jest.fn().mockReturnValue(new MockRepository());
export const getMongoRepository = jest.fn().mockReturnValue(new MockRepository());
export const getCustomRepository = jest.fn().mockReturnValue(new MockRepository());

// Database connection options
export const DatabaseType = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  MARIADB: 'mariadb',
  SQLITE: 'sqlite',
  ORACLE: 'oracle',
  MSSQL: 'mssql',
  MONGODB: 'mongodb',
  COCKROACHDB: 'cockroachdb',
};

// Migration operations
export const Migration = createClassDecorator();

// Isolated Metrics
export const getMetadata = jest.fn().mockReturnValue({});
export const getMetadataArgsStorage = jest.fn().mockReturnValue({});

// Initialize helper
export const initializeDataSource = jest.fn().mockResolvedValue(new MockDataSource());
