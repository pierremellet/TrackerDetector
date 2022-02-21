import { expect } from 'chai';
import 'mocha';
import { TrackerFinderController } from '../src/controller';
import { AppConfig } from '../src/utils';
import sinon from 'sinon';
import { Application, PrismaClient } from '@prisma/client';

const config: AppConfig = {
  endpoint: "/",
  input_buffer: 5,
  log_level: 'error',
  port: 3000
};

describe('Test Controller', () => {
  it('Checking createApplication', async () => {

    const prisma = new PrismaClient();
    const sandbox = sinon.createSandbox();
    sandbox.stub(prisma, 'application').value({
      create : async (params: any): Promise<Application>=>params.data
    })

    const controller = new TrackerFinderController(config, prisma);
    const res = await controller.createApplication("demo")

    expect(res.name).to.be.equal("demo");
  });

  it('Checking post partial report is correctly duplicated', () => {

    const prisma = new PrismaClient();
    const sandbox = sinon.createSandbox(); 

    const controller = new TrackerFinderController(config, prisma);

    controller.rawPartialReportSubject.subscribe(report => {
      console.log(report);
    })

    controller.rawPartialReportSubject.next({
      url: 'URL1',
      cookies: [
        {
          name : 'Cookie1',
          applicationVersionId : 0,
          domain  : '',
          duration : 0,
          hostOnly : true,
          httpOnly: true,
          path : '/',
          secure : true,
          session : true,
          timestamp : 0
        }
      ]
    })
  })
  
});