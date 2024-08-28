const UserModel = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { deleteJWT, refreshJWT } = require('../jwt.js');
const jwt = require('jsonwebtoken');

const secretKey = '1234!!!!QWe';

const UserController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserByUsername : async (req, res) => {
    try {
        const username = req.params.username;
        const user = await UserModel.getByUsername(username);
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await UserModel.getUserById(req.params.id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const existingUser = await UserModel.getUserByUsernameOrEmail(req.body.username, req.body.email);
        if (existingUser) {
            if (existingUser.username === req.body.username) {
                return res.status(400).json({ message: "Username already exists" });
            }
            if (existingUser.email === req.body.email) {
                return res.status(400).json({ message: "Email already exists" });
            }
          }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const profilePicture = req.file
        ? `${req.body.username}${path
            .extname(req.file.originalname)
            .toLowerCase()}`
        : "default.jpg";
      const user = {
        ...req.body,
        password: hashedPassword,
        profile_picture: profilePicture,
      };
      const newUser = await UserModel.createUser(user);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateUser : async (req, res) => {
    try {
        // Fetch the existing user data
        const existingUser = await UserModel.getUserById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the username is being updated and is not already taken
        if (req.body.username && req.body.username !== existingUser.username) {
            const usernameExists = await UserModel.getByUsername(req.body.username);
            if (usernameExists) {
                return res.status(400).json({ message: "Username already exists" });
            }

            // Rename the profile picture if it exists and is not the default one
            if (existingUser.profile_picture && existingUser.profile_picture !== 'default.jpg') {
                const oldProfilePath = path.join(
                    __dirname,
                    "../uploads/profiles",
                    `${existingUser.username}${path.extname(existingUser.profile_picture)}`
                );
                const newProfilePath = path.join(
                    __dirname,
                    "../uploads/profiles",
                    `${req.body.username}${path.extname(existingUser.profile_picture)}`
                );

                if (fs.existsSync(oldProfilePath)) {
                    fs.renameSync(oldProfilePath, newProfilePath);
                    console.log(`Renamed profile picture from ${oldProfilePath} to ${newProfilePath}`);
                }

                existingUser.profile_picture = `${req.body.username}${path.extname(existingUser.profile_picture)}`;
            }
        }

        // Hash password if provided
        const hashedPassword = req.body.password
            ? await bcrypt.hash(req.body.password, 10)
            : null;

        let profilePicture;

        // Handle new profile picture upload
        if (req.file) {
            console.log("request", req.file.path);

            // Determine the new profile picture filename
            profilePicture = `${req.body.username || existingUser.username}${path
                .extname(req.file.originalname)
                .toLowerCase()}`;

            // Save the new profile picture
            const newProfilePath = path.join(
                __dirname,
                "../uploads/profiles",
                profilePicture
            );
            fs.renameSync(req.file.path, newProfilePath); // Move the file to the correct location with the correct name
        } else {
            // Keep the renamed or old profile picture if no new file is uploaded
            profilePicture = existingUser.profile_picture;
        }

        const user = {
            ...req.body,
            password: hashedPassword || existingUser.password, // Use existing password if not provided
            profile_picture: profilePicture,
        };

        console.log("User object to be updated:", user);

        const updatedUser = await UserModel.updateUser(req.params.id, user);
        if (updatedUser) {
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},

  deleteUser: async (req, res) => {
    try {
      // Fetch the user to get the profile picture path
      const user = await UserModel.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove the user's profile picture if it's not the default one
      const profilePicturePath = path.join(
        __dirname,
        "../uploads/profiles",
        user.profile_picture
      );
      if (
        user.profile_picture &&
        user.profile_picture !== "default.jpg" &&
        fs.existsSync(profilePicturePath)
      ) {
        console.log("Deleting profile picture:", profilePicturePath);
        fs.unlinkSync(profilePicturePath);
      }

      // Delete the user from the database
      const deletedUser = await UserModel.deleteUser(req.params.id);
      if (deletedUser) {
        res.json({ message: "User deleted" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const user = await UserModel.getByEmail(req.body.email);
      if (user && (await bcrypt.compare(req.body.password, user.password))) {
        const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
        res.json({ message: "Login successful",token});
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: async (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (token) {
      deleteJWT(token);
      res.json({ message: "Logout successful" });
    } else {
      res.status(400).json({ message: "No token provided" });
    }
  }
};

module.exports = UserController;
