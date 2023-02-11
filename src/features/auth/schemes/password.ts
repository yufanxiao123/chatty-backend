import Joi, { ObjectSchema } from 'joi';

const emailSchema: ObjectSchema = Joi.object().keys({
  //email should be string, qualify email format, required
  email: Joi.string().email().required().messages({
    //add or customize error messages.string.base: error messages thrown by Joi
    'string.base': 'Field must be valid',
    'string.required': 'Field must be valid',
    'string.email': 'Field must be valid'
  })
});

const passwordSchema: ObjectSchema = Joi.object().keys({
  password: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password should be of type string',
    'string.min': 'Invalid password, should be more than 4',
    'string.max': 'Invalid password, should be less than 8',
    'string.empty': 'Password is a required field'
  }),
  //valid(Joi.ref('password')) means password should == confirmPassword
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords should match',
    'any.required': 'Confirm password is a required field'
  })
});

export { emailSchema, passwordSchema };
