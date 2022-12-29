import mongoose from "mongoose";
import express from "express";

import PostMessage from "../models/postMessage.js";
import { cloudinary } from "../util/cloudinary.js";

const router = express.Router();
export const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await PostMessage.findById(id);

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
  const { page } = req.query;
  try {
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
    const total = await PostMessage.countDocuments({}); // get total posts

    const posts = await PostMessage.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .skip(startIndex); // get the specific starting index posts

    res.status(200).json({
      data: posts,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / LIMIT),
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPostsBySearch = async (req, res) => {
  const { searchQuery, tags } = req.query;

  try {
    const title = new RegExp(searchQuery, "i");

    const posts = await PostMessage.find({
      $or: [{ title }, { tags: { $in: tags.split(",") } }],
    });

    res.json({ data: posts });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  const post = req.body;

  try {
    const fileStr = post.selectedFile;
    const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: "dev_setups",
    });
    // console.log(uploadedResponse);
    const newPost = new PostMessage({
      ...post,
      selectedFile: uploadedResponse.url,
      creator: req.userId,
      createdAt: new Date().toISOString(),
    });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  const { id: _id } = req.params;
  const post = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(404).send("No post with that id");
    }
    const postToUpdate = await PostMessage.findById(_id);
    postToUpdate.title = post.title;
    postToUpdate.message = post.message;
    postToUpdate.tags = post.tags;
    if (post.selectedFile) {
      // Delete the old file
      // the URL: https://res.cloudinary.com/djhbfnaz0/image/upload/v1658323985/tycxbzk2yckn8cwyn0j7.png
      let public_id = postToUpdate.selectedFile.split("/");
      public_id = public_id[public_id.length - 1].split(".")[0];
      await cloudinary.uploader.destroy(public_id, function (result) {
        // console.log(result);
      });
      // Upload new file
      const fileStr = post.selectedFile;
      const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
        upload_preset: "dev_setups",
      });
      postToUpdate.selectedFile = uploadedResponse.url;
    }
    await postToUpdate.save();
    res.json(postToUpdate);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Failed to update." });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("No post with that id");
  }
  try {
    const postToDelete = await PostMessage.findById(id);
    if (postToDelete.selectedFile) {
      // Delete file if existing
      // the URL: https://res.cloudinary.com/djhbfnaz0/image/upload/v1658323985/tycxbzk2yckn8cwyn0j7.png
      let public_id = postToDelete.selectedFile.split("/");
      public_id = public_id[public_id.length - 1].split(".")[0];
      await cloudinary.uploader.destroy(public_id, function (result) {
        // console.log(result);
      });
    }
    await PostMessage.findByIdAndDelete(id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Deletion failed." });
  }
};

export const likePost = async (req, res) => {
  const { id } = req.params;

  if (!req.userId) return res.json({ message: "Unauthenticated" });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send("No post with that id");

  const post = await PostMessage.findById(id);

  const index = post.likes.findIndex((id) => id === String(req.userId));

  if (index === -1) {
    // like the post
    post.likes.push(req.userId);
  } else {
    // dislike the post
    post.likes = post.likes.filter((id) => id !== String(req.userId));
  }

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {
    new: true,
  });

  res.json(updatedPost);
};

export const commentPost = async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;

  const post = await PostMessage.findById(id);

  post.comments.push(value);

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {
    new: true,
  });

  res.json(updatedPost);
};

export default router;
