import express from 'express';

const router = express.Router();

router.post('/signup', (req, res) => {
  res.send('signup');
});

router.post('/signin', (req, res) => {
  res.send('signin');
});
router.post('/signout', (req, res) => {
  res.send('signout');
});

export default router;
