/* Md2GZH 富文本粘贴桥接：把剪贴板里的 text/html（网页 / 飞书 / Notion / Word / 公众号）
 * 转换为本文档支持的 Markdown（含 ==高亮==、++下划线++ 扩展语法）。
 * 只读语义标签，忽略内联样式；未知容器（section/div 套娃）按块级展平。
 */
(function (global, factory) {
  var api = factory(typeof DOMParser !== 'undefined' ? DOMParser : null);
  global.Md2GZHRichPaste = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (DOMParserImpl) {
  'use strict';

  var BLOCK_TAGS = {
    P: 1, DIV: 1, SECTION: 1, ARTICLE: 1, MAIN: 1, ASIDE: 1, HEADER: 1, FOOTER: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, PRE: 1, HR: 1, TABLE: 1, FIGURE: 1, FIGCAPTION: 1
  };
  var DROP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, HEAD: 1, META: 1, LINK: 1, BUTTON: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1 };

  /* 纯文本已经像 Markdown（从编辑器/代码工具复制）时优先用纯文本 */
  function looksLikeMarkdown(text) {
    var t = String(text || '');
    if (!t.trim()) return false;
    return /^#{1,6}\s+\S/m.test(t)
      || /\*\*[^*\n]+\*\*/.test(t)
      || /`[^`\n]+`/.test(t)
      || /```/.test(t)
      || /^>\s+\S/m.test(t)
      || /^(\s*[-*+]\s+\S|\s*\d+\.\s+\S)/m.test(t);
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ');
  }

  function hasBlockChild(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (child.nodeType === 1 && (BLOCK_TAGS[child.tagName] || hasBlockChild(child))) return true;
    }
    return false;
  }

  function dropJunk(root) {
    var nodes = root.querySelectorAll(Object.keys(DROP_TAGS).join(','));
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function inline(node) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) { out += cleanText(n.nodeValue); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName;
      var inner = inline(n);
      if (tag === 'STRONG' || tag === 'B') out += inner.trim() ? '**' + inner + '**' : '';
      else if (tag === 'EM' || tag === 'I') out += inner.trim() ? '*' + inner + '*' : '';
      else if (tag === 'U') out += inner.trim() ? '++' + inner + '++' : '';
      else if (tag === 'DEL' || tag === 'S') out += inner.trim() ? '~~' + inner + '~~' : '';
      else if (tag === 'MARK') out += inner.trim() ? '==' + inner + '==' : '';
      else if (tag === 'CODE') out += n.textContent ? '`' + String(n.textContent).replace(/\s+/g, ' ').trim() + '`' : '';
      else if (tag === 'A') {
        var href = n.getAttribute('href') || '';
        out += href && inner.trim() ? '[' + inner + '](' + href + ')' : inner;
      }
      else if (tag === 'BR') out += '\n';
      else if (tag === 'IMG') out += imageMarkdown(n);
      else out += inner;
    }
    return out;
  }

  function imageMarkdown(img) {
    var src = img.getAttribute('src') || '';
    var alt = String(img.getAttribute('alt') || '').replace(/[[\]]/g, ' ').trim();
    return src ? '![' + alt + '](' + src + ')' : '';
  }

  function headingPrefix(tag) {
    var level = parseInt(tag.charAt(1), 10);
    var hash = '';
    for (var i = 0; i < level; i++) hash += '#';
    return hash;
  }

  function listMarkdown(node, ordered, depth) {
    var out = '';
    var items = node.children;
    var index = 0;
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      if (li.tagName !== 'LI') continue;
      index++;
      var indent = '';
      for (var d = 0; d < depth; d++) indent += '  ';
      var marker = ordered ? (index + '. ') : '- ';
      var nested = '';
      var contentOwner = li;
      /* 先把嵌套列表摘出来单独处理 */
      var subLists = li.querySelectorAll('ul,ol');
      for (var s = 0; s < subLists.length; s++) {
        var sub = subLists[s];
        if (sub.parentNode) {
          sub.parentNode.removeChild(sub);
          nested += listMarkdown(sub, sub.tagName === 'OL', depth + 1);
        }
      }
      var text = inline(contentOwner).trim();
      out += indent + marker + (text || '') + '\n' + nested;
    }
    return out;
  }

  function tableMarkdown(node) {
    var rows = node.querySelectorAll('tr');
    if (!rows.length) return '';
    var lines = [];
    var columnCount = 0;
    for (var r = 0; r < rows.length; r++) {
      var cells = [];
      var cellNodes = rows[r].querySelectorAll('th,td');
      for (var c = 0; c < cellNodes.length; c++) {
        cells.push(inline(cellNodes[c]).replace(/\|/g, '\\|').trim() || ' ');
      }
      columnCount = Math.max(columnCount, cells.length);
      lines.push('| ' + cells.join(' | ') + ' |');
      if (r === 0) {
        var sep = [];
        for (var k = 0; k < columnCount; k++) sep.push('---');
        lines.push('| ' + sep.join(' | ') + ' |');
      }
    }
    return lines.join('\n') + '\n';
  }

  function quoteMarkdown(node) {
    var inner = blocks(node).replace(/\n+$/, '');
    return inner.split('\n').map(function (line) {
      return line ? '> ' + line : '>';
    }).join('\n') + '\n';
  }

  function blocks(node) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) {
        var text = cleanText(n.nodeValue).trim();
        if (text) out += text + '\n\n';
        continue;
      }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName;
      if (DROP_TAGS[tag]) continue;
      if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
        var ht = inline(n).trim();
        if (ht) out += headingPrefix(tag) + ' ' + ht + '\n\n';
      } else if (tag === 'P') {
        var pt = inline(n).trim();
        if (pt) out += pt + '\n\n';
      } else if (tag === 'PRE') {
        var codeEl = n.querySelector('code');
        var lang = '';
        if (codeEl) {
          var lm = (codeEl.className || '').match(/language-([\w+-]+)/);
          if (lm) lang = lm[1];
        }
        var code = ((codeEl || n).textContent || '').replace(/\n+$/, '');
        out += '```' + lang + '\n' + code + '\n```\n\n';
      } else if (tag === 'UL' || tag === 'OL') {
        out += listMarkdown(n, tag === 'OL', 0) + '\n';
      } else if (tag === 'BLOCKQUOTE') {
        out += quoteMarkdown(n);
      } else if (tag === 'HR') {
        out += '---\n\n';
      } else if (tag === 'TABLE') {
        out += tableMarkdown(n) + '\n';
      } else if (tag === 'IMG') {
        out += imageMarkdown(n) + '\n\n';
      } else if (tag === 'FIGURE' || tag === 'FIGCAPTION') {
        out += blocks(n);
      } else if (hasBlockChild(n)) {
        out += blocks(n);
      } else {
        var gt = inline(n).trim();
        if (gt) out += gt + '\n\n';
      }
    }
    return out;
  }

  function toMarkdown(html) {
    if (!DOMParserImpl) return '';
    var doc = new DOMParserImpl().parseFromString(String(html || ''), 'text/html');
    dropJunk(doc.body);
    var md = blocks(doc.body);
    return md.replace(/\n{3,}/g, '\n\n').trim();
  }

  return { toMarkdown: toMarkdown, looksLikeMarkdown: looksLikeMarkdown };
});
