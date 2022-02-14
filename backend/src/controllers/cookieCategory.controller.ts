import { Application, CookieCategory, PrismaClient } from "@prisma/client";
import { AppConfig } from "../utils";
import rootLogger from "../logger";

export default class CookieCategoryController {

    private _log = rootLogger(this.config).getChildLogger({
        name: "DomainController",
    });


    constructor(private config: AppConfig, private prisma: PrismaClient) {

    }


    createCookieCategory(name: string): Promise<CookieCategory> {
        if (name === undefined || name.length === 0) {
            throw new Error("name can't be null");
        }
        return this.prisma.cookieCategory.create({
            data: {
                name,
                enable: true
            },
        });
    }



    public async updateCookieCategory(cookieCategoryId: number, cookieCategoryName: string, cookieCategoryEnable: string): Promise<CookieCategory> {
        const data: any = {};
        if (cookieCategoryName !== undefined) {
            data.name = cookieCategoryName;
        }
        if (cookieCategoryEnable !== undefined) {
            data.enable = cookieCategoryEnable;
        }
        const cookie = await this.prisma.cookieCategory.update({
            where: {
                id: cookieCategoryId,
            },
            data,
        });

        return cookie;
    }

}