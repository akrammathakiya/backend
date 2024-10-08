import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoBy",
      },
    },
    {
      $unwind: "$videoBy",
    },
    {
      $project: {
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        description: 1,
        videoBy: {
          fullName: 1,
          userName: 1,
          avatar: 1,
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, thumbnail } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if ([title, description, thumbnail].some((item) => item.trim() === "")) {
    throw new ApiErrors(400, "provide title, description and thumbnali");
  }

  const videoLocalPath = req.files.videoFile[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiErrors(
      404,
      "provide proper video and thumbnail to publish a video"
    );
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnailCloudnary = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video || !thumbnailCloudnary) {
    throw new ApiErrors(
      500,
      "something went wrong when uploading video or thumbnail"
    );
  }

  const uploaded = await Video.create({
    owner: req.user._id,
    title,
    description,
    videoFile: video.path,
    thumbnail: thumbnailCloudnary.path,
    duration: video.duration,
  });

  if (!uploaded) {
    throw new ApiErrors(500, "something went wrong when making a document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploaded, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "provide video id");
  }
  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "uploadedBy",
      },
    },
    {
      $unwind: "$uploadedBy",
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        TotalLikes: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$subscribers",
        },
        isSubscriberd: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        title: 1,
        views: 1,
        thumbnail: 1,
        videoFile: 1,
        uploadedBy: {
          fullName: 1,
          userName: 1,
          avatar: 1,
        },
        TotalLikes: 1,
        isLiked: 1,
        totalSubscribers: 1,
        isSubscriberd: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, video, "video fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { titleNew, descriptionNew } = req.body;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "provide valid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, "video not found");
  }

  if (!video.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(408, "You have no rights to update this video");
  }

  if (!titleNew && !descriptionNew) {
    throw new ApiErrors(409, "Atleast provide title and description to update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: titleNew || title,
        description: descriptionNew || description,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiErrors(500, "something went wrong when updataing details");
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, "changed"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "provide valid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, "video not found");
  }

  const deleted = await Video.findByIdAndDelete(videoId);

  if (!deleted) {
    throw new ApiErrors(500, "something went wrong when deleting a video");
  }

  await Like.deleteMany({ video: videoId });

  await Comment.deleteMany({ video: videoId });

  await User.updateMany(
    { watchHistory: videoId },
    { $pull: { watchHistory: videoId } }
  );

  return res.status(200).json(new ApiResponse(200, deleted, "deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "provide valid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors(404, "video not found");
  }

  if (!video.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(408, "You have no rights to update this video");
  }

  const updated = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: isPublished ? false : true,
      },
    },
    {
      new: true,
    }
  );

  if (!updated) {
    throw new ApiErrors(500, "something went wrong when toggling publish");
  }

  return res.status(200).json(new ApiErrors(200, updated, "publish toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
