import express from 'express';
const router = express.Router();
import { verifyToken } from '../middleware/auth_middlewere';

import {
    createUser,
    getUsers,
    loginUser,
    updatePassword,
    profile_update,
    forget_password,
    reset_password
} from '../controller/auth_controller';

router.post("/create_user",  createUser);
router.get("/get_users", verifyToken, getUsers);
router.post("/login_user", loginUser);
router.post("/update_password", verifyToken, updatePassword);
router.post("/profile_update", verifyToken, profile_update);
router.post("/forget_password", verifyToken, forget_password);
router.post("/reset_password", verifyToken, reset_password);


export default router;
