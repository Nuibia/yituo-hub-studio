/*
 * 将原画廊 Production V6 的 750px 源模板编译为 402px 标准屏直出版。
 *
 * 关键约束：
 * - 只缩放 HTML 层的 px；SVG viewBox、路径和 SVG 内联样式保持原样。
 * - 字号采用 gallery-standard402-readable-full-effects-v2.html 的定稿值。
 * - 右侧复用纹样、左侧节点与章节安全区采用定稿放大值。
 * - 仅更新 motion/templates-v6 下的 30 个最终模板和对应清单哈希。
 *
 * 用法：
 *   node tools/compile-advanced-standard402-v30.js [Production V6 原画廊目录]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

const SOURCE_WIDTH = 750;
const TARGET_WIDTH = 402;
const SCALE = TARGET_WIDTH / SOURCE_WIDTH;
const CONTENT_WIDTH = 370;
const RELEASE = 'production-template.standard402-full-effects.v30';

const REPO_ROOT = path.resolve(__dirname, '..');
const defaultSource = path.resolve(
  REPO_ROOT,
  '..',
  'wechat-motion-layout',
  'examples',
  'production-motion-v6'
);
const sourceDir = path.resolve(process.argv[2] || defaultSource);
const targetDir = path.join(REPO_ROOT, 'motion', 'templates-v6');
const manifestPath = path.join(targetDir, 'manifest.json');

function fail(message) {
  throw new Error(message);
}

function sha256(source) {
  return crypto.createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
}

function px(value) {
  const scaled = Number(value) * SCALE;
  return String(Number(scaled.toFixed(2))) + 'px';
}

function scalePx(cssText) {
  return cssText.replace(/(-?(?:\d+(?:\.\d*)?|\.\d+))px\b/g, function (_, value) {
    return px(value);
  });
}

function styleValue(source, location) {
  const raw = source.slice(location.startOffset, location.endOffset);
  const match = raw.match(/^style\s*=\s*(["'])([\s\S]*)\1$/i);
  if (!match) fail('无法解析 style 属性：' + raw.slice(0, 80));
  return { quote: match[1], value: match[2] };
}

function appendCss(value, declarations) {
  let output = String(value || '').trim();
  if (output && !/;\s*$/.test(output)) output += ';';
  return output + declarations.join(';') + (declarations.length ? ';' : '');
}

function compileTemplate(source, filename) {
  const dom = new JSDOM(source, { includeNodeLocations: true });
  const doc = dom.window.document;
  const root = doc.body.firstElementChild;
  if (!root || root.tagName.toLowerCase() !== 'section') fail(filename + ' 缺少模板根节点');

  const overrides = new Map();
  const edits = [];

  function addStyle(node, declaration) {
    if (!node) return;
    if (!overrides.has(node)) overrides.set(node, []);
    overrides.get(node).push(declaration);
  }

  function setFont(nodes, value) {
    Array.from(nodes || []).forEach(function (node) {
      addStyle(node, 'font-size:' + value + 'px');
    });
  }

  addStyle(root, 'width:100%');
  addStyle(root, 'max-width:' + TARGET_WIDTH + 'px');

  const title = root.querySelector('[data-component-role="title"]');
  const frame = root.querySelector('[data-component-role="frame"]');
  const directory = root.querySelector('[data-component-role="directory"]');
  const tail = root.querySelector('[data-component-role="tail"]');
  if (!title || !frame || !directory || !tail) fail(filename + ' 缺少 title/frame/directory/tail');

  setFont(title.querySelectorAll('h1'), 18);
  setFont(title.querySelectorAll('p'), 7.5);
  setFont(frame.querySelectorAll('p'), 12);
  setFont(directory.querySelectorAll('h2'), 16);
  setFont(directory.querySelectorAll('span'), 8);
  setFont(directory.querySelectorAll('p'), 12);

  const directoryShell = directory.querySelector('[data-semantic-role="article-directory"]');
  if (!directoryShell) fail(filename + ' 缺少目录语义锚点');
  const directoryHeaderLabel = directoryShell.firstElementChild
    && directoryShell.firstElementChild.querySelector('p');
  const directoryFooterLabel = directoryShell.lastElementChild
    && directoryShell.lastElementChild.querySelector('p');
  setFont([directoryHeaderLabel, directoryFooterLabel].filter(Boolean), 7.5);

  const directoryMotif = directory.querySelector('[data-motif-placement="header-end"]');
  if (directoryMotif) {
    addStyle(directoryMotif, 'width:51.46px');
    addStyle(directoryMotif, 'max-width:24%');
    addStyle(directoryMotif, 'flex:0 0 51.46px');
  }

  const headings = Array.from(root.querySelectorAll('[data-article-section-heading="true"]'));
  if (!headings.length) fail(filename + ' 缺少章节标题模板');
  headings.forEach(function (heading) {
    setFont(heading.querySelectorAll('h2'), 15);
    setFont(heading.querySelectorAll('p'), 7.5);

    const rightMotif = heading.querySelector('[data-section-title-reusable-decor="foreground"]');
    if (rightMotif) {
      addStyle(rightMotif, 'width:18%');
      addStyle(rightMotif, 'min-width:37.52px');
      addStyle(rightMotif, 'max-width:51.46px');
    }

    const contentLayer = heading.querySelector('[data-section-title-content-layer="base"]');
    if (contentLayer) addStyle(contentLayer, 'padding-right:58.96px');

    const smallNode = Array.from(heading.querySelectorAll('svg')).find(function (svg) {
      return (svg.getAttribute('viewBox') || '').trim() === '0 0 64 44';
    });
    if (smallNode && smallNode.parentElement) {
      addStyle(smallNode.parentElement, 'width:35.38px');
      addStyle(smallNode.parentElement, 'flex:0 0 35.38px');
    }

    const paragraph = heading.nextElementSibling;
    if (!paragraph || paragraph.tagName.toLowerCase() !== 'p') {
      fail(filename + ' 缺少章节正文原型');
    }
    addStyle(paragraph, 'margin:0 0 15px');
    addStyle(paragraph, 'font-size:13px');
    addStyle(paragraph, 'line-height:1.86');
    addStyle(paragraph, 'letter-spacing:.015em');
    addStyle(paragraph, 'text-wrap:pretty');
    addStyle(paragraph, 'overflow-wrap:anywhere');
  });

  setFont(tail.querySelectorAll('p'), 8.5);

  Array.from(doc.querySelectorAll('[style]')).forEach(function (node) {
    if (node.namespaceURI === 'http://www.w3.org/2000/svg' || node.closest('svg')) return;
    const location = dom.nodeLocation(node);
    const attr = location && location.attrs && location.attrs.style;
    if (!attr) fail(filename + ' 存在无法定位的 HTML style 属性');
    const parsed = styleValue(source, attr);
    const value = appendCss(scalePx(parsed.value), overrides.get(node) || []);
    edits.push({
      start: attr.startOffset,
      end: attr.endOffset,
      value: 'style=' + parsed.quote + value + parsed.quote
    });
    overrides.delete(node);
  });

  if (overrides.size) fail(filename + ' 存在没有 style 属性的定稿节点');

  const rootLocation = dom.nodeLocation(root);
  edits.push({
    start: rootLocation.startTag.endOffset - 1,
    end: rootLocation.startTag.endOffset - 1,
    value: ' data-standard-screen="402" data-standard-source-width="750"'
      + ' data-standard-content-width="' + CONTENT_WIDTH + '"'
      + ' data-template-typography="v30-standard402-full-effects"'
  });

  headings.forEach(function (heading) {
    const location = dom.nodeLocation(heading);
    const safe = location.attrs && location.attrs['data-section-title-decor-safe-right'];
    if (safe) {
      edits.push({
        start: safe.startOffset,
        end: safe.endOffset,
        value: 'data-section-title-decor-safe-right="58.96"'
      });
    } else {
      edits.push({
        start: location.startTag.endOffset - 1,
        end: location.startTag.endOffset - 1,
        value: ' data-section-title-decor-safe-right="58.96"'
      });
    }
  });

  edits.sort(function (a, b) { return b.start - a.start; });
  let output = source;
  let previousStart = source.length + 1;
  edits.forEach(function (edit) {
    if (edit.end > previousStart) fail(filename + ' 的编译补丁发生重叠');
    output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
    previousStart = edit.start;
  });

  const checked = new JSDOM(output).window.document;
  const checkedRoot = checked.body.firstElementChild;
  const checkedHeading = checkedRoot.querySelector('[data-article-section-heading="true"]');
  const checkedSizes = [
    checkedRoot.querySelector('[data-component-role="title"] h1').style.fontSize,
    checkedRoot.querySelector('[data-component-role="frame"] p').style.fontSize,
    checkedRoot.querySelector('[data-component-role="directory"] h2').style.fontSize,
    checkedHeading.querySelector('h2').style.fontSize,
    checkedHeading.nextElementSibling.style.fontSize,
    checkedRoot.querySelector('[data-component-role="title"] p').style.fontSize
  ].join('/');
  if (checkedSizes !== '18px/12px/16px/15px/13px/7.5px') {
    fail(filename + ' 字号校验失败：' + checkedSizes);
  }
  if (checkedRoot.style.maxWidth !== '402px') fail(filename + ' 画布宽度不是 402px');

  return output;
}

if (!fs.existsSync(sourceDir)) fail('找不到 Production V6 原画廊目录：' + sourceDir);
if (!fs.existsSync(manifestPath)) fail('找不到目标模板清单：' + manifestPath);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let compiled = 0;
manifest.templates.forEach(function (template) {
  [['static_file', 'static_sha256'], ['motion_file', 'motion_sha256']].forEach(function (pair) {
    const filename = template[pair[0]];
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    if (!fs.existsSync(sourcePath)) fail('原画廊缺少：' + sourcePath);
    const output = compileTemplate(fs.readFileSync(sourcePath, 'utf8'), filename);
    fs.writeFileSync(targetPath, output, 'utf8');
    template[pair[1]] = sha256(output);
    compiled++;
  });
});

manifest.typography_release = RELEASE;
manifest.typography_policy = 'The original 750px gallery geometry is compiled directly to a 402px standard canvas. '
  + 'HTML spacing scales by 402/750 while SVG geometry remains intact; final visual sizes are title 18px, '
  + 'frame 12px, directory 16px, section 15px, body 13px and microcopy 7.5-8.5px.';
manifest.standard_screen_width = TARGET_WIDTH;
manifest.standard_source_width = SOURCE_WIDTH;
manifest.standard_layout_scale = SCALE;
manifest.standard_content_width = CONTENT_WIDTH;
manifest.longform_policy = 'Runtime section bodies are constrained to 370px, centered, with 13px/1.86 readable body copy and full Markdown effects.';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('compiled ' + compiled + ' templates from ' + sourceDir);
console.log('release ' + RELEASE + ' target=' + TARGET_WIDTH + ' content=' + CONTENT_WIDTH);
