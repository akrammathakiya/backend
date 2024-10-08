import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-like-v/:videoId").post(verifyJwt, toggleVideoLike);
router.route("/toggle-like-c/:commentId").post(verifyJwt, toggleCommentLike);
router.route("/toggle-like-t/:tweetId").post(verifyJwt, toggleTweetLike);
router.route("/get-liked-v").post(verifyJwt, getLikedVideos);

export default router;
