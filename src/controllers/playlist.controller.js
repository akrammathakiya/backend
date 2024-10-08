import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiErrors(404, "provide playlist's name and description");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiErrors(
      500,
      "something went wrong when creating your playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "your playlist is created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiErrors(400, "invalid user id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiErrors(404, "user not found");
  }

  const playlists = await Playlist.find({ owner: userId });

  if (!playlists) {
    throw new ApiErrors(404, "this user have not any playlist yet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlists fetched successfully !!"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, "invalid id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, "playlist not found");
  }

  return res
    .stauts(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, "invalid playlist id ");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "invalid video id ");
  }

  const videoExist = await Video.findById(videoId);

  if (!videoExist) {
    throw new ApiErrors(404, "The video does not exist");
  }

  const playlistexist = await Playlist.findById(playlistId);

  if (!playlistexist) {
    throw new ApiErrors(404, "playlist does not exist");
  }

  if (playlistexist?.owner !== req.user._id) {
    throw new ApiErrors(
      408,
      "You does not have permission to add video in this playlist"
    );
  }

  if (playlistexist?.videos.includes(videoId)) {
    throw new ApiErrors(405, "This video is already in this playlist");
  }

  const isAdded = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!isAdded) {
    throw new ApiErrors(
      500,
      "something went wrong when adding your video to playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, isAdded, "video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, "invalid playlist id ");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiErrors(400, "invalid video id ");
  }

  const videoExist = await Video.findById(videoId);

  if (!videoExist) {
    throw new ApiErrors(404, "The video does not exist");
  }

  const playlistexist = await Playlist.findById(playlistId);

  if (!playlistexist) {
    throw new ApiErrors(404, "playlist does not exist");
  }

  if (playlistexist?.owner !== req.user._id) {
    throw new ApiErrors(
      408,
      "You does not have permission to remove video from this playlist"
    );
  }

  if (!playlistexist?.videos.includes(videoId)) {
    throw new ApiErrors(
      404,
      "The video you want to remove is not present in playlist"
    );
  }

  const removed = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: {
          $in: [`${videoId}`],
        },
      },
    },
    {
      new: true,
    }
  );

  if (!removed) {
    throw new ApiErrors(
      500,
      "something went wrong when removing video from playlist"
    );
  }

  return res.status(200).json(new ApiResponse(200, removed, "video removed"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, "playlist not found");
  }

  if (!playlist?.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(408, "You are not owner of the playlist can't delete");
  }

  const isDeleted = await Playlist.findByIdAndDelete(playlistId);

  if (!isDeleted) {
    throw new ApiErrors(500, "something went wrong when deleting the playlist");
  }

  return res
    .stauts(200)
    .json(new ApiResponse(200, isDeleted, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiErrors(400, "invalid playlist id");
  }

  if (!name && !description) {
    throw new ApiErrors(404, "Atleast provide name or description");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiErrors(404, "playlist not found");
  }

  if (playlist?.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(
      408,
      "You do not have permission to update this playlist "
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name || playlist?.name,
        description: description || playlist?.description,
      },
    },
    {
      new: true,
    }
  );

  if (!updatePlaylist) {
    throw new ApiErrors(500, "something went wrong when updating the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "The playlist is updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
