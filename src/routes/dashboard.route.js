import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideosGlobal,
  getChannelVideosOur,
} from "../controllers/dashboard.controller.js";
const router = Router();

router.route("/s/:channelName").post(verifyJwt, getChannelVideosGlobal);
router.route("/get-channel-stats").post(verifyJwt, getChannelStats);

router.route("get-channel-videos-our").post(verifyJwt, getChannelVideosOur);

export default router;
