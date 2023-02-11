import { JoiRequestValidationError } from '@global/helpers/error-handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';

//Object.getOwnPropertyDescriptor(objName, propertyName)返回PropertyDescriptor，包含objName中propertyName属性的信息
/** a method decorator
 * @param: target: The prototype of the class to which the method belongs.
 * @param: key: The name of the method being decorated.
 * @param: descriptor: A property descriptor for the method, which can be used to modify its behavior.
 * *
 */
type IJoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void;

//根据要验证的schema，返回一个类型为IJoiDecorator的函数，这个函数的作用是修改其第三个参数descriptor: PropertyDescriptor的value为一个可以根据schema验证request body的异步函数
export function joiValidation(schema: ObjectSchema): IJoiDecorator {
  //不打算使用的参数就在前面标上_
  //相当于对所有被装饰的函数，在运行前执行return originalMethod.apply(this, args);前的函数
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value; // it is a function, refers to the original method being decorated, and can be used to modify or override its behavior.
    //perform actual validation
    /***
     * ...args: any[] is using the Rest Parameters construct which essentially says that
     * there can be any number of parameters of the provided type any.
     * Because there are an unknown amount of any parameters, the type of the argument is an array of any.
     * there should be function like signin(req,res,next)
     */
    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];
      //validate method, schema.validate(req.body)返回{error,value}，value是请求中的payload，error是如果validate失败会有的东西，里面有关于error的信息
      const { error, value } = await Promise.resolve(schema.validate(req.body));
      if (error?.details) {
        throw new JoiRequestValidationError(error.details[0].message);
      }
      //Function.prototype.apply(thisArg, argsArray)，
      //argsArray: An array-like object, specifying the arguments with which func should be called, or null or undefined if no arguments should be provided to the function.
      //将通过验证的args应用到原来descriptor.value里

      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
