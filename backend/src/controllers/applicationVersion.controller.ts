import { Application, Application_Version, PixelTemplate, PrismaClient, URL_Type } from "@prisma/client";
import { AppConfig } from "../utils";
import rootLogger from "../logger";
import { URLType } from "../model";
import topics from "../topics";


export default class ApplicationVersionController {

    private _log = rootLogger(this.config).getChildLogger({
        name: "ApplicationVersionController",
    });


    constructor(private config: AppConfig, private prisma: PrismaClient) {

    }


    public createPixelTemplate(uri: string, type: URLType, appVersionId: number): Promise<PixelTemplate> {
        return this.prisma.pixelTemplate.create({
            data: {
                type,
                uri,
                applicationVersionId: appVersionId
            }
        })
    }

    public updatePixelTemplate(pixelTemplateId: number, uri: string, type: URLType): Promise<PixelTemplate> {
        const data: any = {};
        if (uri !== undefined) {
            data.name = uri;
        }
        if (type !== undefined) {
            data.enable = type;
        }
        return this.prisma.pixelTemplate.update({
            where: {
                id: pixelTemplateId,
            },
            data,
        });
    }

    public deletePixelTemplate(pixelTemplateId: number) {
        return this.prisma.pixelTemplate.delete({
            where: {
                id: pixelTemplateId,
            }
        });
    }


    async createApplicationVersion(appId: number, versionName: string): Promise<Application_Version> {
        return await this.prisma.application_Version.create({
            data: {
                name: versionName,
                application: {
                    connect: {
                        id: appId,
                    },
                },
            },
        });
    }

    async updateApplicationVersion(version: any): Promise<Application_Version> {

        const urlsData = version.urls
            .filter((u: any) => !u.disabled)
            .map((u: any) => {
                return {
                    where: {
                        id: parseInt(u.id, 10) || 0,
                    },
                    create: {
                        path: u.path,
                        type: u.type,
                        domainId: u.domainId,
                        created: new Date(),
                    },
                    update: {
                        path: u.path,
                        domainId: u.domainId,
                        type: u.type,
                    },
                };
            });

        const urlsToDelete = version.urls
            .filter((u: any) => u.disabled)
            .map((u: any) => {
                return {
                    id: parseInt(u.id, 10),
                };
            });

        const cookiesData = version.cookies
            .filter((u: any) => !u.disabled)
            .map((u: any) => {
                const data = {
                    nameRegex: u.nameRegex,
                    httpOnly: u.httpOnly,
                    domain: u.domain,
                    path: u.path,
                    hostOnly: u.hostOnly,
                    secure: u.secure,
                    session: u.session,
                    categoryId: u.category
                };
                return {
                    where: {
                        id: parseInt(u.id, 10) || 0,
                    },
                    create: data,
                    update: data,
                };
            });

        const cookiesToDelete = version.cookies
            .filter((u: any) => u.disabled)
            .map((u: any) => {
                return {
                    id: parseInt(u.id, 10),
                };
            });

        return this.prisma.application_Version.update({
            data: {
                name: version.name,
                enable: version.enable,
                urls: {
                    upsert: urlsData,
                    deleteMany: urlsToDelete,
                },
                cookieTemplates: {
                    upsert: cookiesData,
                    deleteMany: cookiesToDelete,
                },
            },
            where: {
                id: parseInt(version.id, 10),
            },
        }).then(u => {
            topics.applicationVersionChanged.next(u.id);
            return u;
        });
    }

    public async deleteApplicationVersion(versionId: number): Promise<Application_Version> {
        return this.prisma.application_Version.delete({
            where: {
                id: versionId
            }
        })
    }

    public deleteCookieInstancesForVersion(versionID: number): Promise<number> {
        return this.prisma.cookieInstance
            .deleteMany({
                where: {
                    applicationVersion: {
                        id: versionID,
                    },
                },
            })
            .then((res) => res.count);
    }
}