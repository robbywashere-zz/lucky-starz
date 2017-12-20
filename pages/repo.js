import Head from 'next/head';
import { Component, createElement } from 'react';
import axios from 'axios';
import get from 'lodash/get';
import Github from '../github';
import ReactMarkdown from 'react-markdown';
import { parse } from 'url';
import PropTypes from 'prop-types';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import visit from 'unist-util-visit';
import stylesheet from '../styles/markdown.css';

class Repo {
  constructor(repo){
    if (typeof repo === 'object') {
      this.repo = {owner: repo.owner, name: repo.name };
    } 
    if (typeof repo === 'string') {
      this.repo = Repo.strToObj(repo);
    }
  }

  static strToObj(repo){
    const [owner, name] = repo.split('/').splice(-2);
    return { owner, name }
  }
  static objToStr(repo){
    let { owner, name } = repo;
    return `${owner}/${name}`;
  }
  str(repo = this.repo){
    return `${repo.owner}/${repo.name}`;
  }

  obj(repo = this.repo){
    return repo;
  }
}


function Flash({ text }) {

  if (!text) return null

  return (<div 
    style={{
      position: "fixed",
      width: "100%",
      height: "36px",
      background: "#90F",
      color: "#FFF",
      opacity: 0.5,
      textAlign: "center",
      fontWeight: "bold",
      lineHeight: "36px",
      top: 0,
      left:0,
      right: 0,
    }}
  >{ text }</div>)

}

const linkPlugin = (nodeFn,cb) =>  {

  return (tree) => {
    const { children } = tree;
    const fn = (node, index, parent) => {

      if (node.url) { 
        let { host, pathname } = parse(node.url); 
        if (pathname && pathname.split('/').length === 3 && host === 'github.com'){
          let repo = new Repo(node.url);
          if (repo) nodeFn(repo);
        }
      }

    }
    visit(tree, 'link', fn);
    cb();
    return tree;
  }
}


const repoToStr = ({ owner, name }) => `${owner}/${name}`;


function Heading(props) {
  let id;
  if (typeof props.children[0] === "string") id = props.children[0].replace(' ','-').toLowerCase() 
  return createElement(`h${props.level}`, { id  }, props.children)
}

class A extends Component {
  constructor(props, context){
    super(props, context);
    this.repo = new Repo(props.href);
    this.state = { stars: null }
  }
  componentDidMount(){
    if (this.repo) {
      this.context.subscribe(() => this.setState({ stars: this.context.getRepo(this.repo) }) )
    }
  }

  /*
  shouldComponentUpdate(){
  }*/

  render(){
    return (
      <span>
        { (this.state.stars) ? (<span className="stars"> { this.state.stars } </span>) : null}
        { (this.props.href.substr(0,1) !== "#") ? <a target="_blank" href={ this.props.href }>{ this.props.children }</a> : <a href={ this.props.href }>{ this.props.children }</a> }
      </span>
    )
  }
}

A.contextTypes = {
  getRepo: PropTypes.function,
  subscribe: PropTypes.function,
}


class Markdown extends Component {

  shouldComponentUpdate(){
    if (this.props.source) {
      if (this.rendered) return false
      return this.rendered = true;
    }
    return false;
  }

  render(){ 
    return (<ReactMarkdown 
      source={ this.props.source } 
      skipHtml={ true }
      astPlugins={ this.props.astPlugins } 
      renderers={ this.props.renderers }/>)
  }
}
export default class Main extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = { 
      user: props.user || { },
      readme: props.readme || "",
      repo: new Repo(props.repo),
      errorFlash: props.errorFlash || "",
      infoFlash: props.infoFlash || "",
      stars: props.stars || {},
      repoCount: 0,
    }

    this.resetSelfState();
    if (this.state.user.accessToken) { 
      this.githubClient =  new Github(this.state.user.accessToken); 
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        let user = window.localStorage.getItem('user');
        if (user) {
          this.login(JSON.parse(user));
          window.localStorage.removeItem('user')
        }
      });
    }
  }

  ghClient(accessToken) {
    return new Github(accessToken)
  }

  login(user){
    this.setState({ user });
    this.githubClient = this.ghClient(user.accessToken);
    this.fetchList(); 
  }

  resetSelfState() {
    this.subs = [];
    this.repos = [];
    this.repoCount = 0;
  }
  static async getInitialProps({ req }) {
    let repo;
    let stars;
    let readme;
    let errorFlash
    let user;
    const { owner,name } = get(req,'params',{});
    if (owner && name) {
      repo = new Repo({ owner, name }).str()
    }
    user = get(req,'user',null);
    /*if (user && repo && user.accessToken) {
      let githubClient = new Github(user.accessToken);
      try {
        const readme = await githubClient.fetchReadme(repo);
        const stars = await githubClient.getReposStarCount(this.repos);
      } catch(e) {
        console.error(e)
        errorFlash = e.toString();
      }
    }*/
    return { user, repo, readme, stars, errorFlash }
  }
  async fetchList() {
    this.resetSelfState();
    try {
      this.setState({ infoFlash: 'Fetching readme ...' });
      const readme = await this.githubClient.fetchReadme(this.state.repo);
      this.setState({ readme });
    } catch(e) {
      console.error(e);
      this.setState({errorFlash: e.toString() });
    }
    this.setState({ infoFlash: '' })
  }

  getRepo(repo) {
    return this.stars[repo.str()]
  }

  subscribe(fn){
    this.subs.push(fn)
  }

  getChildContext(){
    return {
      getRepo: this.getRepo.bind(this),
      subscribe: this.subscribe.bind(this),
    }
  }

  async showStars(){
    this.stars = await this.githubClient.getReposStarCount(this.repos);
  }



  nodeFn(repo){
    this.repos.push(repo);
    this.repoCount++;
  }

  astCb(){
    if (this.repoCount > 0 ) {
      this.setState({ infoFlash: "Fetching stars..." });
      this.showStars().then(()=>{
        this.subs.forEach(fn=>fn());
        this.subs = [];
        this.setState({ infoFlash: "" });
      }); 
    }
  }

  componentDidMount(){
    if (this.loggedIn()) {
      this.fetchList();
    }
  }


  loggedIn(){
    return !!get(this.state,'user.profile');
  }


  render() {

    return (<div>
      <Head title="OkThanks!">
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
      </Head>
      <pre>{ this.loggedIn() ? `Logged in as ${get(this.state,'user.profile.username')}` : null } </pre>  

      { (!get(this.state,'user.accessToken')) ? 
          <div><div>You must login to github to continue...</div><button style={{ padding: "10px" }}onClick={ ()=>window.open('/oauth-login') }> Login </button></div> : 
          <a href="/logout"> Logout </a> 
      }

      { (this.loggedIn()) ? <h1> { this.state.repo.str() } </h1> : null }

      <Flash text={this.state.infoFlash}/>

      <pre>{ this.state.errorFlash }</pre>
      <Markdown source={ this.state.readme } astPlugins={[linkPlugin(this.nodeFn.bind(this),this.astCb.bind(this))]} renderers={ { heading: Heading, link: A } }/>
      <pre>{ /* this.state.readme */ }</pre>

    </div>);
  }
}

Main.childContextTypes = {
  getRepo: PropTypes.function,
  subscribe: PropTypes.function,
};

