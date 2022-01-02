import { Application, Application_URL, Application_Version, CookieInstance, PrismaClient } from '@prisma/client'
import rootLogger from "./logger"

export class StorageService {
   

    private _log = rootLogger.getChildLogger({ name: "StorageService" });

    constructor(public prisma : PrismaClient){}

    public async getCookieByURL(appURL: string): Promise<CookieInstance[]> {
        return this.prisma.cookieInstance.findMany({
            where: {
                url: appURL
            }
        });
    }

    public async getApplication_URLs(version: Application_Version): Promise<Application_URL[]> {
        return this.prisma.application_URL.findMany({
            where: {
                applicationVersion: version
            }
        })
    }

    public getApplications(limit: number = 10): Promise<Application[]> {
        return this.prisma.application.findMany({
            take: limit
        });
    }

    public getApplication(id: number): Promise<Application | null> {
        this._log.debug(`Get application ${id}`);
        return this.prisma.application.findUnique({
            where: {
                'id': id
            },
            include: {
                versions : true
            }
        });
    }

    public getCookieByNameAndURL(name: string, url: string): Promise<CookieInstance | null> {
        return this.prisma.cookieInstance.findFirst({
            where: {
                'name': name,
                'url': url
            }
        });
    }

    public saveCookie(cookie: CookieInstance): Promise<CookieInstance> {
        return this.prisma.cookieInstance.create({
            data: cookie
        })
    }



    public application_URLExist(url: string): Promise<Application_URL | null> {
        return this.prisma.application_URL.findFirst({
            where: {
                'url': url
            }
        });
    }


    public getCookies(): Promise<CookieInstance[]> {
        return this.prisma.cookieInstance.findMany({
            orderBy: {
                name: 'asc',
            }
        })
    }

    public saveApplication(applicationToCreate: Application): Promise<Application> {
        return this.prisma.application.create({
            data: applicationToCreate
        });
    }

    public getApplicationVersion(applicationId: number, versionId: number): Promise<Application_Version | null> {
        return this.prisma.application_Version.findFirst({
            where: {
                application: {
                    id: applicationId
                },
                AND: {
                    id: versionId
                }
            }
        });
    }

    public getApplicationVersions(applicationId: number): Promise<Application_Version[]> {
        return this.prisma.application_Version.findMany({
            where : {
                application : {
                    id : applicationId
                }
            }
        })
    }

    public findApplicationVersionsByURL(url: string): Promise<Application_Version[]> {
        return this.prisma.application_Version.findMany({
            where: {
                urls: {
                    some: {
                        url: {
                            startsWith: url
                        }
                    }
                }
            }
        })
    }

    public saveApplication_Version(applicationId: number, applicationVersion: Application_Version): Promise<Application_Version> {
        return this.prisma.application_Version.create({
            data : {
                name : applicationVersion.name,
                application : {
                    connect : {
                        id : applicationId
                    }
                }
            }
        });
    }
  
  


}
