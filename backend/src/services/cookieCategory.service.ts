import { CookieCategory } from "@prisma/client";
import rootLogger from "../logger";
import config from "../config";
import prisma from "../database";


const _log = rootLogger(config).getChildLogger({
    name: "CookieCategoryService",
});


export const createCookieCategory = (name: string): Promise<CookieCategory> => {
    if (name === undefined || name.length === 0) {
        throw new Error("name can't be null");
    }
    return prisma.cookieCategory.create({
        data: {
            name,
            enable: true
        },
    });
}



export const updateCookieCategory = async (cookieCategoryId: number, cookieCategoryName: string, cookieCategoryEnable: string): Promise<CookieCategory> => {
    const data: any = {};
    if (cookieCategoryName !== undefined) {
        data.name = cookieCategoryName;
    }
    if (cookieCategoryEnable !== undefined) {
        data.enable = cookieCategoryEnable;
    }
    const cookie = await prisma.cookieCategory.update({
        where: {
            id: cookieCategoryId,
        },
        data,
    });
    return cookie;
}