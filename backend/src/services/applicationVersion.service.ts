import { Application, Application_Version, PixelTemplate, PrismaClient, URL_Type } from "@prisma/client";
import { AppConfig } from "../utils";
import rootLogger from "../logger";
import { URLType } from "../model";
import topics from "../topics";
import config from "../config";
import prisma from "../database";


const _log = rootLogger(config).getChildLogger({
    name: "ApplicationVersionController",
});



export const createPixelTemplate = (uri: string, type: URLType, appVersionId: number): Promise<PixelTemplate> => {
    return prisma.pixelTemplate.create({
        data: {
            type,
            uri,
            applicationVersionId: appVersionId
        }
    })
}

export const updatePixelTemplate = (pixelTemplateId: number, uri: string, type: URLType): Promise<PixelTemplate> => {
    const data: any = {};
    if (uri !== undefined) {
        data.name = uri;
    }
    if (type !== undefined) {
        data.enable = type;
    }
    return prisma.pixelTemplate.update({
        where: {
            id: pixelTemplateId,
        },
        data,
    });
}

export const deletePixelTemplate = (pixelTemplateId: number) => {
    return prisma.pixelTemplate.delete({
        where: {
            id: pixelTemplateId,
        }
    });
}


export const createApplicationVersion = async (appId: number, versionName: string): Promise<Application_Version> => {
    return await prisma.application_Version.create({
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

export const updateApplicationVersion = async (version: any): Promise<Application_Version> => {

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

    return prisma.application_Version.update({
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

export const deleteApplicationVersion = async (versionId: number): Promise<Application_Version> => {
    return prisma.application_Version.delete({
        where: {
            id: versionId
        }
    })
}

export const deleteCookieInstancesForVersion = (versionID: number): Promise<number> => {
    return prisma.cookieInstance
        .deleteMany({
            where: {
                applicationVersion: {
                    id: versionID,
                },
            },
        })
        .then((res) => res.count);
} 
 