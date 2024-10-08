import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create-playlist").post(verifyJwt, createPlaylist);
router.route("/get-user-playlist/:userId").post(verifyJwt, getUserPlaylists);
router
  .route("/get-playlist-by-id/:playlistId")
  .post(verifyJwt, getPlaylistById);
router
  .route("/add-v-to-playlist/:playlistId/:videoId")
  .post(addVideoToPlaylist);
router
  .route("/remove-v-from-playlist/:playlistId/:videoId")
  .post(verifyJwt, removeVideoFromPlaylist);
router.route("delete-playlist").delete(verifyJwt, deletePlaylist);
router.route("update-playlist/:playlistId").patch(verifyJwt, updatePlaylist);

export default router;
