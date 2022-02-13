import { Application, PrismaClient } from "@prisma/client";
import { AppConfig } from "../utils";
import rootLogger from "../logger";

export default class DomainController {

    private _log = rootLogger(this.config).getChildLogger({
        name: "DomainController",
    });


    constructor(private config: AppConfig, private prisma: PrismaClient) {

    }

    public createDomain(domainName: string) {
        if (domainName === undefined || domainName.length === 0) {
            throw new Error("domainName can't be null");
        }
        return this.prisma.domain.create({
            data: {
                name: domainName,
                enable: true,
            },
        });
    }

    public updateDomain(domaineId: number, domainName: string, domainEnable: boolean) {
        const data: any = {};
        if (domainName !== undefined) {
            data.name = domainName;
        }
        if (domainEnable !== undefined) {
            data.enable = domainEnable;
        }
        return this.prisma.domain.update({
            where: {
                id: domaineId,
            },
            data,
        });
    }
}