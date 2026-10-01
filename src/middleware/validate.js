const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])'))
      .required()
      .messages({
        'string.pattern.base': 'Password must be alphanumeric and at least 8 characters long.'
      })
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
