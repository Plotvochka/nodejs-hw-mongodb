import Joi from 'joi';

import { emailRegEx } from '../constants/index.js';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email(emailRegEx).required(),
  password: Joi.string().required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});
