
import rootLogger from "../logger";
import config from "../config";
import prisma from "../database";


const _log = rootLogger(config).getChildLogger({
    name: "DomainController",
});




export const createDomain = (domainName: string) => {
    if (domainName === undefined || domainName.length === 0) {
        throw new Error("domainName can't be null");
    }
    return prisma.domain.create({
        data: {
            name: domainName,
            enable: true,
        },
    });
}

export const updateDomain = (domaineId: number, domainName: string, domainEnable: boolean) => {
    const data: any = {};
    if (domainName !== undefined) {
        data.name = domainName;
    }
    if (domainEnable !== undefined) {
        data.enable = domainEnable;
    }
    return prisma.domain.update({
        where: {
            id: domaineId,
        },
        data,
    });
}