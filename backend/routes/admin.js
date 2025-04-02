import express from 'express';
import { validateAdmin } from "../middlewares/validate.js";


const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.send('This is a admin route');
});


export default router;