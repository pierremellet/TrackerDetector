import { Application, PrismaClient } from "@prisma/client";
import { AppConfig } from "../utils";
import rootLogger from "../logger";


export default class ApplicationController {

    private _log = rootLogger(this.config).getChildLogger({
        name: "ApplicationController",
    });


    constructor(private config: AppConfig, private prisma: PrismaClient) {

    }

    async createApplication(appName: string): Promise<Application> {
        return this.prisma.application.create({
            data: {
                name: appName,
            },
        });
    }

    async deleteApplication(appId: number): Promise<Application> {
        await this.prisma.application_Version.deleteMany({
            where: {
                applicationId: appId,
            },
        });
        return this.prisma.application.delete({
            where: {
                id: appId,
            },
        });
    }

    async updateApplication(appId: number, name: string): Promise<Application> {
        return this.prisma.application.update({
            where: {
                id: appId,
            },
            data: {
                name: name,
            },
        });
    }

    public getApplication(id: number): Promise<Application | null> {
        this._log.debug(`Get application ${id}`);
        return this.prisma.application.findUnique({
            where: {
                id: id,
            },
            include: {
                versions: true,
            },
        });
    }

}