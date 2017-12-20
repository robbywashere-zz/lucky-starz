import Head from 'next/head';
import { Component, createElement } from 'react';
import axios from 'axios';
import get from 'lodash/get';
import Github from '../github';
import ReactMarkdown from 'react-markdown';
import parse from 'url-parse';
import PropTypes from 'prop-types';
import visit from 'unist-util-visit';
import stylesheet from '../styles/markdown.css';

const repos = `
  enaqx/awesome-react
  avelino/awesome-go
  xgrommx/awesome-redux
  h4cc/awesome-elixir
  webpack-contrib/awesome-webpack
`.split("\n").map(s=>s.trim()).filter(x=>x)

export default class Main extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { 
    }
  }
  render() {
    return (<div>
      <Head title="Awesome lists with stars">
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
      </Head>
      <br />
      <h1>Awsome lists with stars</h1>
      <ul>
        { repos.map(r=><li><a href={r}>{ r }</a></li>) }
      </ul>
      
    </div>)
  }
}
