import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import * as Multer from 'multer';
import multer, { FileFilterCallback } from 'multer';
const path = require('path');
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import randomstring from 'randomstring';
import nodemailer from 'nodemailer';
import config from '../config/config';

const prisma = new PrismaClient();



// Image validation
const storage = Multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, 'public/');
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
) => void = (req: Request, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
});//image validation

// Password validation
const securePassword = async (password: string): Promise<string> => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error: any) { // Specify the type of error
        throw new Error(error.message);
    }
};// Password validation

//token 
const create_token = async (id: string): Promise<string> => {
    try {
        const token = jwt.sign({ id: id }, "ok");
        return token;
    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An error occurred");
        }
    }
};//token

//reset mail code
const sendResetPasswordMail = async (name: string, email: string, token: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });

        const mailOption = {
            from: config.emailUser,
            to: email,
            subject: "for Reset Password",
            // html: "<p> Hii " + name + ", Please copy the link and <a href='http://localhost:3000/api/reset-password?token=" + token + "'> reset your password</a> "
            html: `<p> Hi ${name}, Please copy the link and <a href='http://localhost:3000/api/reset-password?token=${token}'> reset your password</a></p>`
        }

        transporter.sendMail(mailOption, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Mail has been send:- ", info.response);
            }
        });

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An error occurred");
        }

    };
};//reset mail code



//create users
export const createUser = async (req: Request, res: Response) => {
    try {
        upload.single("image")(req, res, async (error) => {
            if (error) {
                return res.status(400).json({ error: error.message });
            }

            const image = req.file?.filename;
            const { name, email, phone, type } = req.body;
            const sPassword = await securePassword(req.body.password);

            const findUser_Data = await prisma.users.findMany({ where: { email: email, name: name } });

            if (findUser_Data.length === 0) {



                const userData = await prisma.users.create({
                    data: {
                        name,
                        email,
                        phone,
                        image,
                        password: sPassword,
                        type
                    }
                });

                // console.log(userData);


                res.json(userData);


            } else {
                res.status(200).json({ success: false, msg: "This User Alrady Exgist" });

            }

        });//uplod Image


    } catch (error) {
        res.status(400).json(error);
    }//trycatch
};//create users

//login user
export const loginUser = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user_DAta = await prisma.users.findMany({ where: { email: email } });
        if (user_DAta.length > 0) {
            const { id, name, email, phone, image, password: securePassword } = user_DAta[0];

            const passwordMatch = await bcrypt.compare(password, securePassword);
            if (passwordMatch) {

                const token = await create_token(user_DAta[0].id.toString());

                const userResult = {
                    id,
                    name,
                    email,
                    phone,
                    image,
                    token: token
                }
                res.json(userResult);
            } else {
                res.status(200).json({ success: true, msg: "User Password is  Incorrect!" });

            }
        } else {
            res.status(200).json({ success: true, msg: "User Email not found!" });
        }


    } catch (error) {
        console.error("Prisma error:", error);
        res.status(400).json(error);

    }

};//login user

//update password
export const updatePassword = async (req: Request, res: Response) => {
    try {
        const user_id = req.body.id;
        const password = req.body.password;

        if (!user_id) {
            return res.status(400).json({ success: false, msg: "'id' is required in the request body" });
        }

        const user_Data = await prisma.users.findUnique({ where: { id: user_id } });

        if (!user_Data) {
            return res.status(404).json({ success: false, msg: "User not found!" });
        }

        const newPassword = await securePassword(password);

        const updatedPassword = await prisma.users.update({ where: { id: user_id }, data: { password: newPassword } });
        res.json({ success: true, msg: "Password updated successfully", user_Data: updatedPassword });

    } catch (error) {
        console.error("Prisma error:", error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
};//update password

//update profile
export const profile_update = async (req: Request, res: Response) => {
    try {
        upload.single("image")(req, res, async (error) => {
            const image = req.file?.filename;
            const { id, name, email, phone, type } = req.body;
            const user_Data = await prisma.users.findUnique({ where: { id: parseInt(id, 10) } });
            if (!user_Data) {
                res.status(404).json({ success: false, msg: "User not found!" });
            }

            const update_profile = await prisma.users.update({
                where: { id: id },
                data: {
                    name,
                    email,
                    phone,
                    image
                }
            });
            res.json(update_profile);
        });
    } catch (error) {
        console.error("Prisma error:", error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
};//update profile

//forget password
export const forget_password = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const user_Data = await prisma.users.findMany({ where: { email: email } });
        if (user_Data && user_Data.length > 0) {
            const randomString = randomstring.generate();

            await prisma.users.update({ where: { email: email }, data: { token: randomString } as any });

            sendResetPasswordMail(user_Data[0].name, user_Data[0].email, randomString);

            res.status(200).json({ success: true, msg: "please check Your Inbox of mail and reset your password." });

        } else {
            res.status(404).json({ success: false, msg: "User not found with the provided email." });
        }
    } catch (error) {
        console.error("Prisma error:", error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
};//forget password

//reset password
export const reset_password = async (req: Request, res: Response) => {
    try {
        const token = req.body.token;
        const tokenData = await prisma.users.findMany({ where: { id: token } });
        if (tokenData.length > 0) {
            const password = req.body.password;
            const newPassword = await securePassword(password);

            const userData = await prisma.users.update({
                where: { id: tokenData[0].id },
                data: { password: newPassword, token: "" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    // Add other fields you want to select
                },
            });

            res.status(200).json({ success: true, msg: "User password has been reset", data: userData });
        } else {
            res.status(200).json({ success: false, msg: "This link has been expired." });
        }
    } catch (error) {
        console.error("Prisma error:", error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
};//reset password

//get users 
export const getUsers = async (req: Request, res: Response) => {
    try {
        const get_all_user = await prisma.users.findMany();
        console.log(get_all_user);

        res.json(get_all_user);
    } catch (error) {
        res.status(400).json(error);

    }
};//get users


