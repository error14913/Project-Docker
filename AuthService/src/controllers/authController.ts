import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../index";
import { User } from "../entity/User";
import { validate } from "class-validator";

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, email, password } = req.body;

        // kiểm tra xem user đã tồn tại chưa
        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOne({
            where: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: "Email hoặc tên đăng nhập này đã tồn tại"
            });
        }

        // tạo user mới
        const user = new User();
        user.username = username;
        user.email = email;
        user.password = await bcrypt.hash(password, 10);

        // kiểm tra dữ liệu
        const errors = await validate(user);
        if (errors.length > 0) {
            const errorMessages = errors.map(error => {
                if (error.property === 'email') {
                    return 'Email không hợp lệ';
                }
                return 'Dữ liệu không hợp lệ';
            });
            return res.status(400).json({ errors: errorMessages });
        }

        // lưu user
        await userRepository.save(user);

        // tạo token
        const payload = { id: user.id };
        const secret = process.env.JWT_SECRET || "secret"; 
        const options = { expiresIn: "24h" as const }; 
        const token = jwt.sign(payload, secret, options);

        return res.status(201).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        // tìm user
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ email });

        if (!user) {
            return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
        }

        // kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
        }

        // tạo token
        const payload = { id: user.id };
        const secret = process.env.JWT_SECRET || "secret";
        const options = { expiresIn: "24h" as const };
        const token = jwt.sign(payload, secret, options);

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Vui lòng đăng nhập" });
        } 

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
}; 