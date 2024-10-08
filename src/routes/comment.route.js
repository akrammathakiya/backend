import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
const router = Router();

router.route("/video-comments").post(verifyJwt, getVideoComments);
router.route("/add-comment").post(verifyJwt, addComment);
router.route("update-comment").patch(verifyJwt, updateComment);
router.route("delete-comment").delete(verifyJwt, deleteComment);

export default router;
