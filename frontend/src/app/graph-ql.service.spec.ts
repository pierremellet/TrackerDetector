import { TestBed } from '@angular/core/testing';

import { GraphQLService } from './graph-ql.service';

describe('GraphQLService', () => {
  let service: GraphQLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphQLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
