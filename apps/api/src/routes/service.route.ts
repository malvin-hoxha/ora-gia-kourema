import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const servicesRouter = Router();

servicesRouter.get("/", async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            where: {
                active: true,
            },
            orderBy: {
                createdAt: "asc",
            },
            select: {
                id: true,
                name: true,
                description: true,
                durationMinutes: true,
                price: true,
            },
        });

        const response = services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description ?? "",
            duration: service.durationMinutes,
            price: Number(service.price),
        }));

        res.status(200).json({
            data: response,
        });
    } catch (error) {
        console.error("Failed to retrieve services:", error);

        res.status(500).json({
        message: "Unable to retrieve services",
        });
    }
})