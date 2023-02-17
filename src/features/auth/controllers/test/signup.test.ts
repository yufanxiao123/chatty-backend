import { authService } from '@service/db/auth.service';
import { CustomError } from '@global/helpers/error-handler';
import { SignUp } from '@auth/controllers/signup';
import { authMock, authMockRequest, authMockResponse } from './../../../../mocks/auth.mock';
import { Request, Response } from 'express';
//The as keyword is used to assign a custom name to the imported module.
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { userService } from '@service/db/user.service';
import { UserCache } from '@service/redis/user.cache';

//creates a new mock object that replaces the original module. The mock object has the same API as the original module, but you can control its behavior in your tests.
/**
 * @param: the name or path of the module to be mocked
 * the methods in the module will not execute when it is being mocked with jest.mock
 */
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@global/helpers/cloudinary-upload');
jest.useFakeTimers();

/**
 * describe is a way of grouping together tests in Jest
 * Each describe block contains one or more individual tests, which are defined using it blocks.
 * @param: label
 * @param: tests
 */
describe('SignUp',()=> {
  //always good to this
  /**
   * By calling jest.resetAllMocks() before each test,
   * you can ensure that each test is isolated from other tests and that
   * any mocks created in previous tests will not affect the outcome of subsequent tests.
   */
  beforeEach(()=> {
    jest.resetAllMocks();
  });
  //always good to this
  afterEach(()=> {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  /**
   * The it block in Jest is used to define a single test case within a test suite.
   * @param a string that describes the behavior that you're testing,
   * @param a callback function that contains the actual test.
   */
  it('should throw an error if username is not available', () => {
    const req: Request = authMockRequest({},{
      username: '',
      email: 'manny@me.com',
      password:'qwery',
      avatarColor: '#9c27b0',
      avatarImage:'data:geafedefsgb'
    }) as Request;
    const res: Response = authMockResponse();
    SignUp.prototype.create(req,res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username length is less than min', () => {
    const req: Request = authMockRequest({},{
      username: 'ma',
      email: 'manny@me.com',
      password:'qwery',
      avatarColor: '#9c27b0',
      avatarImage:'data:geafedefsgb'
    }) as Request;
    const res: Response = authMockResponse();
    SignUp.prototype.create(req,res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid username');
    });
  });
  //针对JoiValidation的test就不多写了，都类似

  it('should throw unauthorize error if user already exist',()=> {
    const req: Request = authMockRequest({},{
      username: 'Manny',
      email: 'manny@test.com',
      password:'123456',
      avatarColor: 'blue',
      avatarImage:'data:geafedefsgb'
    }) as Request;
    const res: Response = authMockResponse();
    /**
     * jest.spyOn is a Jest function that allows you to create a spy, which is a mock function that can be used to observe the behavior of other functions. A spy can be used to check if a function was called, with which arguments, and how many times.
     * @param The object that you want to create the spy on.
     * @param The name of the method on the object that you want to create the spy on.
     * @returns a Jest spy object, a wrapped version of the original method on the object being spied on
     */
    //.mockResolvedValue(authMock) method is used to configure the spy to return a specific value
    jest.spyOn(authService,'getUserByUsernameOrEmail').mockResolvedValue(authMock);
    SignUp.prototype.create(req,res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid credentials, username or email already exists');
    });
  });

  it('should set session data for valid credentials and send correct json response', async ()=> {
    const req: Request = authMockRequest({},{
      username: 'Manny',
      email: 'manny@test.com',
      password:'123456',
      avatarColor: 'blue',
      avatarImage:'data:geafedefsgb'
    }) as Request;

    const res: Response = authMockResponse();

    const userSpy = jest.spyOn(UserCache.prototype,'saveUserToCache');
    jest.spyOn(authService,'getUserByUsernameOrEmail').mockResolvedValue(null as any);
    jest.spyOn(cloudinaryUploads,'uploads').mockImplementation(():any => Promise.resolve({version: 1234,public_id: '1234456'}));

    await SignUp.prototype.create(req,res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      //即userSpy所监测的函数call时的第三个参数
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });
  });
});
