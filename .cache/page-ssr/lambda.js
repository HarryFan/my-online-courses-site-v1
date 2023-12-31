"use strict";

exports.__esModule = true;
exports.default = void 0;
var path = _interopRequireWildcard(require("path"));
var fs = _interopRequireWildcard(require("fs-extra"));
var _https = require("https");
var _http = require("http");
var _os = require("os");
var _stream = require("stream");
var _url = require("url");
var _util = require("util");
var _linkfs = require("linkfs");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const cdnDatastore = ``;
const PATH_PREFIX = ``;
function setupFsWrapper() {
  // setup global._fsWrapper
  try {
    fs.accessSync(__filename, fs.constants.W_OK);
    // TODO: this seems funky - not sure if this is correct way to handle this, so just marking TODO to revisit this
    return path.join(__dirname, `..`, `data`, `datastore`);
  } catch (e) {
    // we are in a read-only filesystem, so we need to use a temp dir

    const TEMP_DIR = path.join((0, _os.tmpdir)(), `gatsby`);
    const TEMP_CACHE_DIR = path.join(TEMP_DIR, `.cache`);
    global.__GATSBY.root = TEMP_DIR;

    // TODO: don't hardcode this
    const cacheDir = `/var/task/.cache`;

    // we need to rewrite fs
    const rewrites = [[path.join(cacheDir, `caches`), path.join(TEMP_CACHE_DIR, `caches`)], [path.join(cacheDir, `caches-lmdb`), path.join(TEMP_CACHE_DIR, `caches-lmdb`)], [path.join(cacheDir, `data`), path.join(TEMP_CACHE_DIR, `data`)]];
    console.log(`Preparing Gatsby filesystem`, {
      from: cacheDir,
      to: TEMP_CACHE_DIR,
      rewrites
    });
    // Alias the cache dir paths to the temp dir
    const lfs = (0, _linkfs.link)(fs, rewrites);

    // linkfs doesn't pass across the `native` prop, which graceful-fs needs
    for (const key in lfs) {
      if (Object.hasOwnProperty.call(fs[key], `native`)) {
        lfs[key].native = fs[key].native;
      }
    }
    const dbPath = path.join(TEMP_CACHE_DIR, `data`, `datastore`);

    // 'promises' is not initially linked within the 'linkfs'
    // package, and is needed by underlying Gatsby code (the
    // @graphql-tools/code-file-loader)
    lfs.promises = (0, _linkfs.link)(fs.promises, rewrites);

    // Gatsby uses this instead of fs if present
    // eslint-disable-next-line no-underscore-dangle
    global._fsWrapper = lfs;
    if (!cdnDatastore) {
      const dir = `data`;
      if (!process.env.NETLIFY_LOCAL && fs.existsSync(path.join(TEMP_CACHE_DIR, dir))) {
        console.log(`directory already exists`);
        return dbPath;
      }
      console.log(`Start copying ${dir}`);
      fs.copySync(path.join(cacheDir, dir), path.join(TEMP_CACHE_DIR, dir));
      console.log(`End copying ${dir}`);
    }
    return dbPath;
  }
}
global.__GATSBY = {
  root: process.cwd(),
  buildId: ``
};

// eslint-disable-next-line no-constant-condition
if (``) {
  global.__GATSBY.imageCDNUrlGeneratorModulePath = require.resolve(``);
}
// eslint-disable-next-line no-constant-condition
if (``) {
  global.__GATSBY.fileCDNUrlGeneratorModulePath = require.resolve(``);
}
const dbPath = setupFsWrapper();

// using require instead of import here for now because of type hell + import path doesn't exist in current context
// as this file will be copied elsewhere

const {
  GraphQLEngine
} = require(`../query-engine`);
const {
  getData,
  renderPageData,
  renderHTML
} = require(`./index`);
const streamPipeline = (0, _util.promisify)(_stream.pipeline);
function get(url, callback) {
  return new _url.URL(url).protocol === `https:` ? (0, _https.get)(url, callback) : (0, _http.get)(url, callback);
}
async function getEngine() {
  if (cdnDatastore) {
    // if this variable is set we need to download the datastore from the CDN
    const downloadPath = dbPath + `/data.mdb`;
    console.log(`Downloading datastore from CDN (${cdnDatastore} -> ${downloadPath})`);
    await fs.ensureDir(dbPath);
    await new Promise((resolve, reject) => {
      const req = get(cdnDatastore, response => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error(`Failed to download ${cdnDatastore}: ${response.statusCode} ${response.statusMessage || ``}`));
          return;
        }
        const fileStream = fs.createWriteStream(downloadPath);
        streamPipeline(response, fileStream).then(resolve).catch(error => {
          console.log(`Error downloading ${cdnDatastore}`, error);
          reject(error);
        });
      });
      req.on(`error`, error => {
        console.log(`Error downloading ${cdnDatastore}`, error);
        reject(error);
      });
    });
    console.log(`Downloaded datastore from CDN`);
  }
  const graphqlEngine = new GraphQLEngine({
    dbPath
  });
  await graphqlEngine.ready;
  return graphqlEngine;
}
const engineReadyPromise = getEngine();
function reverseFixedPagePath(pageDataRequestPath) {
  return pageDataRequestPath === `index` ? `/` : pageDataRequestPath;
}
function getPathInfo(requestPath) {
  const matches = requestPath.matchAll(/^\/?page-data\/(.+)\/page-data.json$/gm);
  for (const [, requestedPagePath] of matches) {
    return {
      isPageData: true,
      pagePath: reverseFixedPagePath(requestedPagePath)
    };
  }

  // if not matched
  return {
    isPageData: false,
    pagePath: requestPath
  };
}
function setStatusAndHeaders({
  page,
  data,
  res
}) {
  if (page.mode === `SSR`) {
    if (data.serverDataStatus) {
      res.status(data.serverDataStatus);
    }
  }
  if (data.serverDataHeaders) {
    for (const [name, value] of Object.entries(data.serverDataHeaders)) {
      res.setHeader(name, value);
    }
  }
}
function getErrorBody(statusCode) {
  let body = `<html><body><h1>${statusCode}</h1><p>${statusCode === 404 ? `Not found` : `Internal Server Error`}</p></body></html>`;
  if (statusCode === 404 || statusCode === 500) {
    const filename = path.join(process.cwd(), `public`, `${statusCode}.html`);
    if (fs.existsSync(filename)) {
      body = fs.readFileSync(filename, `utf8`);
    }
  }
  return body;
}
function getPage(pathname, graphqlEngine) {
  const pathInfo = getPathInfo(pathname);
  if (!pathInfo) {
    return undefined;
  }
  const {
    isPageData,
    pagePath
  } = pathInfo;
  const page = graphqlEngine.findPageByPath(pagePath);
  if (!page) {
    return undefined;
  }
  return {
    page,
    isPageData,
    pagePath
  };
}
async function engineHandler(req, res) {
  try {
    var _req$url;
    const graphqlEngine = await engineReadyPromise;
    let pageInfo;
    const originalPathName = (_req$url = req.url) !== null && _req$url !== void 0 ? _req$url : ``;
    if (PATH_PREFIX && originalPathName.startsWith(PATH_PREFIX)) {
      const maybePath = originalPathName.slice(PATH_PREFIX.length);
      pageInfo = getPage(maybePath, graphqlEngine);
    }
    if (!pageInfo) {
      pageInfo = getPage(originalPathName, graphqlEngine);
    }
    if (!pageInfo) {
      res.status(404).send(getErrorBody(404));
      return;
    }
    const {
      pagePath,
      isPageData,
      page
    } = pageInfo;
    const data = await getData({
      pathName: pagePath,
      graphqlEngine,
      req
    });
    if (isPageData) {
      const results = await renderPageData({
        data
      });
      setStatusAndHeaders({
        page,
        data,
        res
      });
      res.json(results);
      return;
    } else {
      const results = await renderHTML({
        data
      });
      setStatusAndHeaders({
        page,
        data,
        res
      });
      res.send(results);
      return;
    }
  } catch (e) {
    console.error(`Engine failed to handle request`, e);
    res.status(500).send(getErrorBody(500));
  }
}
var _default = engineHandler;
exports.default = _default;
//# sourceMappingURL=lambda.js.map