import express from "express";
import auth from '../middleware/auth.js'

import { getPostsBySearch, getPost, getPosts, createPost, updatePost, deletePost, likePost, commentPost } from "../controllers/posts.js";

const router = express.Router();

router.get('/search', getPostsBySearch);
router.get('/:id', getPost);
router.get('/', getPosts);
router.post('/', auth, createPost);
router.patch('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.patch('/:id/likePost', auth, likePost);
router.patch('/:id/commentPost', auth, commentPost);

export default router;


