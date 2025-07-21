const express = require('express');
const { 
  register, 
  registerValidation, 
  login, 
  loginValidation 
} = require('../controllers/authController');

const router = express.Router();

// POST /auth/register
router.post('/register', registerValidation, register);

// POST /auth/login
router.post('/login', loginValidation, login);

module.exports = router;