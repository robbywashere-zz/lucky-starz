
const request = require('axios');
const { pkgName } = require('../package.json').name;
const get = require('lodash/get');

module.exports = class Github {

  constructor(token) {
    this.token = token
  }


  async fetchReadme(repo) {
    let error;
    let readme;
    const readmeContent = (await request({
      method: 'GET',
      url: `https://api.github.com/repos/${repo.obj().owner}/${repo.obj().name}/readme`,
      headers: {
        'User-Agent': `${pkgName}`,
        'Authorization': `Bearer ${this.token}`
      }
    })).data.content;
    readme = Buffer.from(readmeContent, 'base64').toString();
    return readme;
  }



  async getReposStarCount(repos){

    const rq = (repo) => `${btoa(repo.str()).replace(/=/g,'_')}: repository(owner: "${repo.obj().owner}", name: "${repo.obj().name}") {
     stargazers {
        totalCount
      }
  }`
    const gqlQuery = `query { ${repos.map(rq).join("\n")} }`;

    const query = get( (await this.gql(gqlQuery)) ,'data.data',{});
    let o = {};
    Object.entries(query).forEach( ([key, val]) => o[atob(key.replace(/_/g,'='))] = get(val,'stargazers.totalCount') )
    return o;
  }


  gql(q) {
    return request({
      method: 'POST',
      url: `https://api.github.com/graphql`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'User-Agent': `${pkgName}`
      },
      data: {
        query: q
      }
    });

  }



}



