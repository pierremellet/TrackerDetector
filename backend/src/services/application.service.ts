import { Application } from "@prisma/client";
import rootLogger from "../logger";
import config from "../config";
import prisma from "../database";

const _log = rootLogger(config).getChildLogger({
    name: "ApplicationController",
});
 

export const createApplication = (appName: string, appDesc: string): Promise<Application> => {
    return prisma.application.create({
        data: {
            name: appName,
            description: appDesc
        },
    });
}

export const deleteApplication = async (appId: number): Promise<Application> => {
    await prisma.application_Version.deleteMany({
        where: {
            applicationId: appId,
        },
    });
    return prisma.application.delete({
        where: {
            id: appId,
        },
    });
}

export const updateApplication = async (appId: number, name: string, desc: string): Promise<Application> => {
    return prisma.application.update({
        where: {
            id: appId,
        },
        data: {
            name: name,
            description: desc,
        },
    });
}

export const getApplication = async (id: number): Promise<Application | null> => {
    _log.debug(`Get application ${id}`);
    return prisma.application.findUnique({
        where: {
            id: id,
        },
        include: {
            versions: true,
        },
    });
}
