import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Project } from "../models/Project.js";
import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.js";
import { UserRoleEnum } from "../constants/constants.js";
import { pipeline } from "nodemailer/lib/xoauth2/index.js";

const getProjects = asyncHandler(async (req, res) => {});

const getProjectById = asyncHandler(async (req, res) => {});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: mongoose.Types.ObjectId(req.user._id),
  });
  const projectMember = await ProjectMember.create({
    user: mongoose.Types.ObjectId(req.user._id),
    project: mongoose.Types.ObjectId(project._id),
    role: UserRoleEnum.ADMIN,
  });
  res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { project, projectMember },
        "Project created successfully",
      ),
    );
});
const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const projectId = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { name, description },
    { new: true },
  );
  if (!updatedProject) {
    throw new ApiError(500, "Failed to update project");
  }
  res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  await Project.findByIdAndDelete(projectId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Project deleted successfully"));
});

const AddMembersToProject = asyncHandler(async (req, res) => {});
const getProjectMembers = asyncHandler(async (req, res) => {});
const updateMemberRole = asyncHandler(async (req, res) => {});
const deleteMember = asyncHandler(async (req, res) => {});

export {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  AddMembersToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
};
