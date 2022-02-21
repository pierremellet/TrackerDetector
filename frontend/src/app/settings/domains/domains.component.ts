import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { GraphQLService } from 'src/app/graph-ql.service';
import { Domain } from 'src/app/model';

@Component({
  selector: 'app-domains',
  templateUrl: './domains.component.html',
  styleUrls: ['./domains.component.scss']
})
export class DomainsComponent implements OnInit {

  public domains: Domain[] = [];
  public newDomainName: string = "";

  constructor(public gql: GraphQLService) { }

  ngOnInit(): void {
    const query = `
    {
      configuration {
        domains {
          id
          name
          enable
        }
      }
    }    
    `

    this.gql.sendQuery(query)
      .pipe(map(resp => resp.data.configuration.domains))
      .subscribe(doms => {
        this.domains = doms; 
      });
  }

  createDomain() {
    const query = `mutation {
      createDomain(domainName: "${this.newDomainName}"){
        id
      }
    }`;

    this.gql.sendQuery(query).subscribe(() => {
      this.ngOnInit();
      this.newDomainName = "";
    });
  }

  saveDomain(dom: Domain) {
    const query = `mutation{
      updateDomain(domainId: ${dom.id}, domainName: "${dom.name}", domainEnable: ${dom.enable}){
        id
      }
    }`;
    this.gql.sendQuery(query).subscribe(() => this.ngOnInit());
  }

  toggleDomainState(dom: Domain) {
    this.saveDomain({
      id: dom.id,
      enable: !dom.enable,
      name: dom.name
    })
  }

}

