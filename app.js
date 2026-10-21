/* YI TUO HUB STUDIO 排版工坊前端
 * - 基础主题：18 套原有版式
 * - 高级排版：蓝梦原创的 16 套 Production V6 主题 × 6 档视觉等级
 */
(function () {
  'use strict';

  var Themes = window.Md2GZHThemes;
  var Shared = window.Md2GZHShared;
  var Converter = window.Md2GZHConverter;
  var Validator = window.Md2GZHValidator;
  var Originals = window.Md2GZHOriginalVisuals;
  var OriginalData = window.Md2GZHOriginalData;

  var editor = document.getElementById('editor');
  var preview = document.getElementById('preview');
  var previewWrap = document.getElementById('previewWrap');
  var validBadge = document.getElementById('validBadge');
  var validPanel = document.getElementById('validPanel');
  var authorInput = document.getElementById('authorInput');
  var exportImageBtn = document.getElementById('btnExportImage');
  var toastEl = document.getElementById('toast');
  var pickerSlot = document.getElementById('themePickerSlot');
  var levelSlot = document.getElementById('levelPickerSlot');
  var colorSlot = document.getElementById('colorPickerSlot');
  var motionModeBtn = document.getElementById('motionModeBtn');
  var previewWidth = 'fit';

  var state = {
    themeId: Themes.SPECS[0].id,
    library: 'base',
    group: 'all',
    levelId: 'motion-themed-frame',
    motionEnabled: true,
    colorId: 'default',
    html: '',
    timer: null,
    renderId: 0,
    pending: Promise.resolve(),
    manifest: null,
    assetCache: {}
  };

  var SAMPLE_MD = [
    '# 一条信息如何变成行动 / 402 标准屏长文压力测试',
    '',
    '> 信息真正产生价值，不是在它被看到的时候，而是在它被理解、被选择、被执行的时候。',
    '',
    '一篇长文真正开始之前，作者面对的通常不是一个完整答案，而是一批来源不同、重要程度也不同的材料。它们可能来自采访记录、公开资料、数据表格，也可能只是一次讨论里留下的零散判断。',
    '',
    '稳定的版式首先要容纳这种不整齐。段落有长有短，句子有快有慢，但阅读宽度、行距和段间距必须保持一致，读者才不会因为内容变长而失去方向。',
    '',
    '## 看见信号',
    '',
    '当材料被整理成问题，文章才会出现一条可阅读的路径。每个章节只承担一个推进动作：提出问题、补充证据、解释变化，最后回到读者真正需要的结论。',
    '',
    '移动端最容易出现的错误，是为了塞入更多信息而不断缩小文字。这样虽然一屏能看到更多内容，却会让读者在真实手机上频繁放大或跳读。',
    '',
    '因此这里让正文保持可辨识的字号，同时限制文字栏宽度。较长句子自然换成两到三行，短句则保留停顿，不用人为把所有段落拉成同样的高度。',
    '',
    '![横图测试：图像进入正文节奏，但不挤压相邻段落](placeholder://16-9)',
    '',
    '### 三级标题与行内效果',
    '',
    '同一段内集中检查 **关键词强调**、*斜体补充*、~~删除内容~~、==荧光高亮==、`行内代码`，以及 [链接文字](https://example.com)。',
    '',
    '- 无序列表支持关键词强调与自然换行',
    '- 行内代码不会抬高整行，也不会突破正文宽度',
    '- 较长列表项换行后仍与正文起点保持对齐',
    '',
    '1. 先整理材料与章节关系',
    '2. 再验证图片、引用和数据组件',
    '3. 最后检查公众号复制后的可编辑性',
    '',
    '---',
    '',
    '## 形成路径',
    '',
    '图片不应该只是插在段落之间。它需要明确的上下间隔、稳定的圆角和图注位置，才能成为论证的一部分，而不是突然打断阅读的广告位。',
    '',
    '正文模板的目标不是让每一页都一样，而是让不同长度的内容都遵守同一套阅读节奏。连续滚动几屏之后，字号、行距和左右边界不能发生变化。',
    '',
    '![第二张图片：连续多图与长图注测试](placeholder://4-5)',
    '',
    '> 装饰应该退到正确的位置：读者先看见标题，再进入正文，需要证据时遇到图片，需要停顿时遇到引用。',
    '',
    '## 验证过程',
    '',
    '版式是否可靠，不能只看一篇短样张。需要把多段文字、连续图片、引用和列表同时放进来，观察它们在真实宽度下是否发生重叠、截断或不合理的大空洞。',
    '',
    '这次压力测试保留原画廊的视觉骨架，只把文字独立为阅读层。左右装饰仍然存在，但它们不再占用正文的有效宽度，也不会抢走章节标题的视觉中心。',
    '',
    '![第三张图片：超宽信息图位置测试](placeholder://2.35-1)',
    '',
    '```javascript',
    'function layout(article) {',
    '  return article.sections.map(renderSection);',
    '}',
    '```',
    '',
    '| 项目 | 基础排版 | 高级排版 |',
    '|------|---------|---------|',
    '| 正文 | 稳定段落 | 完整对齐 |',
    '| 图片 | 图注与边界 | 完整对齐 |',
    '| 代码 | 行内与块级 | 完整对齐 |',
    '| 表格 | 多列数据 | 完整对齐 |',
    '',
    '## 回到结果',
    '',
    '稳定的长文版式最终会让视觉系统负责引导，而不是要求内容迁就装饰。如果一段话特别长，它仍然应该保持舒适的行长。',
    '',
    '如果一段话很短，也不需要额外填充。统一的段落节奏会自然留下空白，让短句成为强调，而不是看起来像遗漏了内容。',
    '',
    '最后回到文章的核心结论：版式要能够承受内容变化。只有通过长文和多图压力测试，才能确认它不是一张好看的样片，而是一套真正可用的公众号模板。',
    '',
    '我是 蓝梦，持续整理公众号视觉与长文排版。'
  ].join('\n');

  function syncPreviewHeight() {
    if (!preview.contentDocument || !preview.contentDocument.body) return;
    var doc = preview.contentDocument;
    var minimumHeight = Math.max(1, previewWrap.clientHeight);
    preview.style.height = minimumHeight + 'px';
    var contentHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
    preview.style.height = Math.max(minimumHeight, Math.ceil(contentHeight)) + 'px';
  }

  function queuePreviewHeight() {
    requestAnimationFrame(function () {
      syncPreviewHeight();
      requestAnimationFrame(syncPreviewHeight);
    });
  }

  function applyPreviewLayout() {
    if (!preview.contentDocument || !preview.contentDocument.body) return;
    var body = preview.contentDocument.body;
    var fixed = previewWidth !== 'fit';
    previewWrap.classList.toggle('device', fixed);
    previewWrap.classList.toggle('readable', !fixed);
    if (fixed) previewWrap.style.setProperty('--preview-width', previewWidth + 'px');
    else previewWrap.style.removeProperty('--preview-width');
    body.style.zoom = '1';
    body.setAttribute('data-preview-scale', '1');
    queuePreviewHeight();
  }

  function previewShell(html, advanced) {
    var bodyLayout = advanced
      ? 'padding:0;background:transparent;display:flex;justify-content:center;align-items:flex-start;'
      : 'padding:18px 16px;background:#fff;';
    return '<!DOCTYPE html><html><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>html,body{overflow:hidden;scrollbar-width:none;}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;}'
      + 'body{margin:0;min-width:0;' + bodyLayout
      + 'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;}'
      + 'img,svg{max-width:100%;}</style></head><body>' + html + '</body></html>';
  }

  function setPreviewWidth(value) {
    previewWidth = value;

    document.querySelectorAll('[data-preview-width]').forEach(function (button) {
      var active = button.getAttribute('data-preview-width') === value;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    applyPreviewLayout();
  }

  function isOriginalSpec(spec) { return !!spec && spec.group === 'motion'; }
  function currentLevel() { return OriginalData.level(state.levelId); }
  function isDynamicLevel() { return currentLevel().motion !== 'none'; }

  function setLoading() {
    validBadge.className = 'badge';
    validBadge.textContent = '载入高级排版…';
    validPanel.hidden = true;
  }

  function commitHtml(html, advanced) {
    state.html = html;
    preview.srcdoc = previewShell(html, advanced);
    var result = Validator.validate(html);
    validBadge.className = 'badge ' + (result.ok ? (result.warnings.length ? 'warn' : 'ok') : 'bad');
    validBadge.textContent = result.ok
      ? (result.warnings.length ? '⚠ ' + result.warnings.length + ' 条建议' : '✓ 平台合规')
      : '✗ ' + result.errors.length + ' 个错误';
    var panelHtml = '';
    result.errors.forEach(function (message) { panelHtml += '<div class="err">✗ ' + message + '</div>'; });
    result.warnings.forEach(function (message) { panelHtml += '<div class="warn">⚠ ' + message + '</div>'; });
    validPanel.innerHTML = panelHtml;
    validPanel.hidden = result.ok && !result.warnings.length;
  }

  function renderFailure(error) {
    state.html = '';
    var message = error && error.message ? error.message : String(error);
    var localFileBlocked = location.protocol === 'file:' && /Failed to fetch|motion\//i.test(message);
    validBadge.className = 'badge bad';
    validBadge.textContent = localFileBlocked ? '✗ 请从本地服务打开' : '✗ 高级排版载入失败';
    if (localFileBlocked) {
      validPanel.innerHTML = '<div class="err">✗ 浏览器禁止本地文件页面读取排版资源。'
        + '<a href="' + Themes.esc('http://127.0.0.1:8123' + location.pathname) + '">打开本地测试地址</a>'
        + '（先在仓库目录运行 python -m http.server 8123）</div>';
    } else {
      validPanel.innerHTML = '<div class="err">✗ ' + Themes.esc(message) + '</div>';
    }
    validPanel.hidden = false;
    preview.srcdoc = previewShell('<section style="padding:28px;color:#8A382F;font-size:14px;line-height:1.8;">'
      + (localFileBlocked
        ? '当前是本地文件直开模式，请从页面下方提示进入本地测试地址。'
        : '高级排版资源暂时无法载入，请刷新后重试。')
      + '</section>', false);
  }

  function ensureManifest() {
    if (state.manifest) return Promise.resolve(state.manifest);
    return fetch('motion/manifest.json').then(function (response) {
      if (!response.ok) throw new Error('无法读取 motion/manifest.json（' + response.status + '）');
      return response.json();
    }).then(function (manifest) {
      if (!manifest.components || manifest.component_count !== manifest.components.length) throw new Error('动静态组件清单不完整');
      state.manifest = manifest;
      return manifest;
    });
  }

  function fetchAsset(requirement) {
    if (state.assetCache[requirement.sourcePath]) return Promise.resolve(state.assetCache[requirement.sourcePath]);
    return fetch(requirement.sitePath).then(function (response) {
      if (!response.ok) throw new Error('无法读取 ' + requirement.sitePath + '（' + response.status + '）');
      return response.text();
    }).then(function (svg) {
      state.assetCache[requirement.sourcePath] = svg;
      return svg;
    });
  }

  function loadOriginalAssets(spec, manifest) {
    var requirements = Originals.assetRequirements(spec.id, state.levelId, state.motionEnabled, manifest);
    return Promise.all(requirements.map(fetchAsset)).then(function () {
      var assets = {};
      requirements.forEach(function (requirement) { assets[requirement.sourcePath] = state.assetCache[requirement.sourcePath]; });
      return assets;
    });
  }

  function convert() {
    var renderId = ++state.renderId;
    var spec = Themes.getSpec(state.themeId);
    var tokens;
    try { tokens = Converter.parse(editor.value); }
    catch (error) { renderFailure(error); return Promise.reject(error); }

    var task;
    if (!isOriginalSpec(spec)) {
      task = Promise.resolve(Themes.render(tokens, spec, { author: authorInput.value.trim() }));
    } else if (currentLevel().order < 3) {
      task = Promise.resolve(Originals.render(tokens, spec, {
        author: authorInput.value.trim(), levelId: state.levelId, motionEnabled: state.motionEnabled, colorId: state.colorId
      }, {}, null));
    } else {
      setLoading();
      task = ensureManifest().then(function (manifest) {
        return loadOriginalAssets(spec, manifest).then(function (assets) {
          return Originals.render(tokens, spec, {
            author: authorInput.value.trim(), levelId: state.levelId, motionEnabled: state.motionEnabled, colorId: state.colorId
          }, assets, manifest);
        });
      });
    }

    state.pending = task.then(function (html) {
      if (renderId === state.renderId) commitHtml(html, isOriginalSpec(spec));
      return html;
    }).catch(function (error) {
      if (renderId === state.renderId) renderFailure(error);
      throw error;
    });
    return state.pending;
  }

  function scheduleConvert() {
    clearTimeout(state.timer);
    state.timer = setTimeout(function () { convert().catch(logConvertError); }, 350);
  }

  /* renderFailure 已把错误显示在校验面板，这里补一条控制台日志便于排查 */
  function logConvertError(error) {
    console.warn('[studio] 排版失败：', error && error.message ? error.message : error);
  }

  function toast(message) { Shared.toast(toastEl, message); }

  /* ---------- 下拉选择器骨架（主题库 / 视觉等级 / 配色三处共用） ---------- */

  /* 当前打开的下拉；打开任意一个会自动收起前一个 */
  var openDropdown = null;

  function createDropdown(slot, config) {
    var pop = document.createElement('div');
    pop.id = config.popId;
    pop.className = config.popClass;
    pop.hidden = true;
    pop.addEventListener('click', function (event) { event.stopPropagation(); });
    var dropdown = {
      open: false,
      pop: pop,
      buttons: [],
      setOpen: function (value) {
        if (value === dropdown.open) return;
        dropdown.open = value;
        if (value) {
          if (openDropdown && openDropdown !== dropdown) openDropdown.setOpen(false);
          openDropdown = dropdown;
          pop.hidden = false;
          config.renderPop();
        } else {
          if (openDropdown === dropdown) openDropdown = null;
          pop.hidden = true;
        }
        config.renderButtons();
      },
      close: function () { dropdown.setOpen(false); }
    };
    dropdown.buttons = config.buildButtons(dropdown);
    slot.appendChild(pop);
    return dropdown;
  }

  function closeOpenDropdown() { if (openDropdown) openDropdown.close(); }

  /* ---------- 主题库下拉（基础 18 套 / 高级排版 16 套） ---------- */

  function libraryThemes(library) {
    return Themes.SPECS.filter(function (spec) { return library.groups.indexOf(spec.group) !== -1; });
  }

  function libraryForTheme(spec) {
    for (var i = 0; i < Themes.LIBRARIES.length; i++) {
      if (Themes.LIBRARIES[i].groups.indexOf(spec.group) !== -1) return Themes.LIBRARIES[i];
    }
    return Themes.LIBRARIES[0];
  }

  var themeDropdown = createDropdown(pickerSlot, {
    popId: 'themePickerPop',
    popClass: 'picker-pop',
    buildButtons: function (dropdown) {
      return Themes.LIBRARIES.map(function (library) {
        var button = document.createElement('button');
        button.className = 'picker-btn';
        button.dataset.library = library.id;
        button.type = 'button';
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          var sameOpenLibrary = dropdown.open && state.library === library.id;
          state.library = library.id;
          state.group = 'all';
          dropdown.setOpen(!sameOpenLibrary);
        });
        pickerSlot.appendChild(button);
        return button;
      });
    },
    renderButtons: renderThemeButtons,
    renderPop: renderThemePop
  });

  function renderThemeButtons() {
    var spec = Themes.getSpec(state.themeId);
    var selectedLibrary = libraryForTheme(spec);
    Themes.LIBRARIES.forEach(function (library, index) {
      var button = themeDropdown.buttons[index];
      var selected = selectedLibrary.id === library.id;
      var open = themeDropdown.open && state.library === library.id;
      var count = libraryThemes(library).length;
      button.classList.toggle('selected', selected);
      button.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-controls', 'themePickerPop');
      button.setAttribute('aria-label', library.name + (selected ? '，当前为' + spec.name : '，共' + count + '套'));
      button.innerHTML = '<span class="picker-kind">' + library.shortName + '</span>'
        + (selected ? '<span class="swatch" style="background:' + spec.swatch + '"></span><span class="picker-name">' + spec.name + '</span>' : '<span class="picker-count">' + count + ' 套</span>')
        + Shared.CHEVRON_SVG;
    });
  }

  function renderThemePop() {
    var library = Themes.LIBRARIES.filter(function (item) { return item.id === state.library; })[0] || Themes.LIBRARIES[0];
    var inLibrary = libraryThemes(library);
    var note = inLibrary.length + ' THEMES' + (library.id === 'original' ? ' · 6 LEVELS' : '');
    var html = '<div class="pop-head"><span class="pop-title">' + library.en + ' · ' + library.name + '</span><span class="pop-note">' + note + '</span></div>';
    if (library.id === 'base') {
      html += '<div class="pop-tabs">';
      Themes.GROUPS.filter(function (group) { return group.id === 'all' || library.groups.indexOf(group.id) !== -1; }).forEach(function (group) {
        var count = group.id === 'all' ? inLibrary.length : inLibrary.filter(function (spec) { return spec.group === group.id; }).length;
        html += '<button class="group-tab' + (state.group === group.id ? ' active' : '') + '" data-group="' + group.id + '">' + group.name + ' <span class="cnt">' + count + '</span></button>';
      });
      html += '</div>';
    }
    html += '<div class="pop-grid">';
    inLibrary.filter(function (spec) { return state.group === 'all' || spec.group === state.group; }).forEach(function (spec) {
      html += '<button class="pop-card' + (spec.id === state.themeId ? ' active' : '') + '" data-id="' + spec.id + '"><span class="swatch" style="background:' + spec.swatch + '"></span><span class="pop-card-text"><span class="tname">' + spec.name + '</span><span class="tdesc">' + spec.desc + '</span></span></button>';
    });
    html += '</div>';
    var pop = themeDropdown.pop;
    pop.innerHTML = html;
    pop.querySelectorAll('.group-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { state.group = tab.dataset.group; renderThemePop(); });
    });
    pop.querySelectorAll('.pop-card').forEach(function (card) {
      card.addEventListener('click', function () {
        state.themeId = card.dataset.id;
        state.library = libraryForTheme(Themes.getSpec(state.themeId)).id;
        state.colorId = 'default';
        themeDropdown.close();
        renderLevelControls();
        renderColorControls();
        convert().catch(logConvertError);
      });
    });
  }

  /* ---------- 高级排版视觉等级 ---------- */

  var levelDropdown = createDropdown(levelSlot, {
    popId: 'levelPickerPop',
    popClass: 'level-pop',
    buildButtons: function (dropdown) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-btn level-picker-btn';
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        dropdown.setOpen(!dropdown.open);
      });
      levelSlot.appendChild(button);
      return [button];
    },
    renderButtons: renderLevelControls,
    renderPop: renderLevelPop
  });

  function renderLevelControls() {
    var button = levelDropdown.buttons[0];
    var original = isOriginalSpec(Themes.getSpec(state.themeId));
    levelSlot.hidden = !original;
    motionModeBtn.hidden = !original || !isDynamicLevel();
    if (!original) {
      levelDropdown.close();
      return;
    }
    var level = currentLevel();
    button.classList.toggle('open', levelDropdown.open);
    button.setAttribute('aria-expanded', String(levelDropdown.open));
    button.setAttribute('aria-controls', 'levelPickerPop');
    button.innerHTML = '<span class="picker-kind">视觉</span><span class="level-index">L' + level.order + '</span><span class="picker-name">' + level.short + '</span>' + Shared.CHEVRON_SVG;
    motionModeBtn.classList.toggle('active', state.motionEnabled);
    motionModeBtn.textContent = state.motionEnabled ? '动态' : '静态回退';
    motionModeBtn.setAttribute('aria-pressed', String(state.motionEnabled));
    motionModeBtn.title = state.motionEnabled ? '当前输出动态 SVG，点击切换为几何一致的静态回退' : '当前输出静态回退，点击恢复动态 SVG';
  }

  function renderLevelPop() {
    var html = '<div class="level-pop-head"><span class="pop-title">PRESENTATION LEVEL · 视觉等级</span><span class="pop-note">81 COMBINATIONS</span></div><div class="level-list">';
    OriginalData.LEVELS.forEach(function (level) {
      html += '<button class="level-option' + (state.levelId === level.id ? ' active' : '') + '" data-level="' + level.id + '"><span class="level-no">L' + level.order + '</span><span class="level-copy"><strong>' + level.name + '</strong><small>' + level.description + '</small></span>' + (level.motion !== 'none' ? '<span class="level-motion">动</span>' : '') + '</button>';
    });
    html += '</div><p class="level-footnote">L1 为全库唯一黑白排版；L2–L6 分别适用于 16 套原创主题。</p>';
    var pop = levelDropdown.pop;
    pop.innerHTML = html;
    pop.querySelectorAll('.level-option').forEach(function (option) {
      option.addEventListener('click', function () {
        state.levelId = option.dataset.level;
        state.motionEnabled = true;
        levelDropdown.close();
        renderColorControls();
        convert().catch(logConvertError);
      });
    });
  }

  motionModeBtn.addEventListener('click', function () {
    state.motionEnabled = !state.motionEnabled;
    renderLevelControls();
    convert().catch(logConvertError);
  });

  /* ---------- 高级排版配色选择（每主题 5 套定制配色） ---------- */

  function currentColorways() {
    return (isOriginalSpec(Themes.getSpec(state.themeId)) && OriginalData.colorwaysForTheme(state.themeId)) || null;
  }

  function currentColorway() {
    var list = currentColorways();
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === state.colorId) return list[i];
    return list[0];
  }

  var colorDropdown = createDropdown(colorSlot, {
    popId: 'colorPickerPop',
    popClass: 'color-pop',
    buildButtons: function (dropdown) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-btn color-picker-btn';
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        dropdown.setOpen(!dropdown.open);
      });
      colorSlot.appendChild(button);
      return [button];
    },
    renderButtons: renderColorControls,
    renderPop: renderColorPop
  });

  function renderColorControls() {
    var button = colorDropdown.buttons[0];
    var original = isOriginalSpec(Themes.getSpec(state.themeId));
    var visible = original && currentLevel().order > 1 && currentColorways();
    colorSlot.hidden = !visible;
    if (!visible) {
      colorDropdown.close();
      return;
    }
    var colorway = currentColorway();
    button.classList.toggle('open', colorDropdown.open);
    button.setAttribute('aria-expanded', String(colorDropdown.open));
    button.setAttribute('aria-controls', 'colorPickerPop');
    button.innerHTML = '<span class="picker-kind">配色</span><span class="color-chip-dots">' + colorwayDots(colorway) + '</span><span class="picker-name">' + colorway.name + '</span>' + Shared.CHEVRON_SVG;
  }

  /* 配色预览色点：底色、面板、主强调、次强调、线条。 */
  function colorwayDots(colorway) {
    var p = OriginalData.profileForTheme(state.themeId, colorway.id);
    var roles = [p.paper, p.surface, p.accent, p.accent2, p.line];
    var html = '';
    for (var i = 0; i < roles.length; i++) {
      html += '<i class="color-dot" style="background:' + roles[i] + '"></i>';
    }
    return html;
  }

  function renderColorPop() {
    var colorways = currentColorways();
    var spec = Themes.getSpec(state.themeId);
    var html = '<div class="level-pop-head"><span class="pop-title">COLORWAYS · 主题配色</span><span class="pop-note">' + colorways.length + ' PALETTES</span></div><div class="color-list">';
    colorways.forEach(function (colorway) {
      html += '<button class="color-option' + (state.colorId === colorway.id ? ' active' : '') + '" data-color="' + colorway.id + '"><span class="color-chip-dots large">' + colorwayDots(colorway) + '</span><span class="color-copy"><strong>' + colorway.name + '</strong><small>' + spec.name + ' · ' + (colorway.id === 'default' ? '主题原配色' : '定制配色') + '</small></span></button>';
    });
    html += '</div><p class="level-footnote">每套主题附带 4 套定制配色；L2–L6 全等级生效，L1 黑白极简不参与配色。</p>';
    var pop = colorDropdown.pop;
    pop.innerHTML = html;
    pop.querySelectorAll('.color-option').forEach(function (option) {
      option.addEventListener('click', function () {
        state.colorId = option.dataset.color;
        colorDropdown.close();
        convert().catch(logConvertError);
      });
    });
  }

  /* ---------- 复制 / 下载 ---------- */

  function fallbackCopy() {
    var box = document.createElement('section');
    box.contentEditable = 'true';
    box.innerHTML = state.html;
    box.style.position = 'fixed';
    box.style.left = '-9999px';
    document.body.appendChild(box);
    var range = document.createRange();
    range.selectNodeContents(box);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(box);
  }

  function copyToWechat() {
    state.pending.then(function () {
      if (!state.html) { toast('先粘贴一点内容再复制'); return; }
      var plain = new Blob([Converter.plainText(editor.value)], { type: 'text/plain' });
      var rich = new Blob([state.html], { type: 'text/html' });
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': rich, 'text/plain': plain })])
          .then(function () { toast('✓ 已复制，去公众号编辑器粘贴'); })
          .catch(function () { fallbackCopy(); toast('✓ 已复制（兼容模式）'); });
      } else { fallbackCopy(); toast('✓ 已复制（兼容模式）'); }
    }).catch(function () { toast('高级排版尚未载入完成'); });
  }

  function exportName(extension) {
    var spec = Themes.getSpec(state.themeId);
    var title = (editor.value.match(/^#\s*(.+)$/m) || [])[1] || '文章';
    var name = title.trim().replace(/[\\/:*?"<>| ]/g, '_').slice(0, 30);
    var suffix = spec.name + '(' + spec.id + ')';
    if (isOriginalSpec(spec)) {
      var level = currentLevel();
      suffix += '_L' + level.order + '_' + level.short;
      if (isDynamicLevel()) suffix += state.motionEnabled ? '_动态' : '_静态回退';
      var colorway = currentColorway();
      if (colorway && colorway.id !== 'default') suffix += '_' + colorway.name;
    }
    return name + '_排版_' + suffix + '.' + extension;
  }

  function saveBlob(blob, name) {
    var anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = name;
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 0);
  }

  function download() {
    state.pending.then(function () {
      if (!state.html) { toast('先粘贴一点内容'); return; }
      saveBlob(new Blob(['\ufeff' + state.html], { type: 'text/html;charset=utf-8' }), exportName('html'));
    }).catch(function () { toast('高级排版尚未载入完成'); });
  }

  function waitForPreviewAssets(doc) {
    var images = Array.prototype.slice.call(doc.images || []);
    var imageTasks = images.map(function (image) {
      if (image.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 3000);
      });
    });
    var fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready.catch(function () {}) : Promise.resolve();
    return Promise.all([fonts].concat(imageTasks));
  }

  function exportLongImage() {
    state.pending.then(function () {
      if (!state.html) { toast('先粘贴一点内容再导出'); return null; }
      if (typeof window.html2canvas !== 'function') throw new Error('长图导出组件未加载');
      var doc = preview.contentDocument;
      if (!doc || !doc.body) throw new Error('预览尚未就绪');
      exportImageBtn.disabled = true;
      exportImageBtn.textContent = '正在生成…';
      return waitForPreviewAssets(doc).then(function () {
        var target = doc.body;
        var width = Math.ceil(Math.max(target.scrollWidth, doc.documentElement.scrollWidth));
        var height = Math.ceil(Math.max(target.scrollHeight, doc.documentElement.scrollHeight));
        var maxCanvasSide = 16384;
        var preferredScale = 3;
        var scale = Math.min(preferredScale, maxCanvasSide / width, maxCanvasSide / height);
        if (scale < 0.5) throw new Error('文章过长，无法生成清晰的单张长图');
        return window.html2canvas(target, {
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          scale: scale,
          width: width,
          height: height,
          windowWidth: width,
          windowHeight: height,
          scrollX: 0,
          scrollY: 0
        });
      }).then(function (canvas) {
        return new Promise(function (resolve) {
          canvas.toBlob(resolve, 'image/png');
        });
      }).then(function (blob) {
        if (!blob) throw new Error('浏览器未能编码 PNG');
        saveBlob(blob, exportName('png'));
        toast('✓ 长图已导出 PNG');
      });
    }).catch(function (error) {
      toast(error && error.message ? error.message : '长图导出失败，请稍后重试');
    }).finally(function () {
      exportImageBtn.disabled = false;
      exportImageBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> 导出长图';
    });
  }

  /* ---------- 事件 / 启动 ---------- */

  editor.addEventListener('input', scheduleConvert);
  authorInput.addEventListener('input', scheduleConvert);
  document.getElementById('btnCopy').addEventListener('click', copyToWechat);
  document.getElementById('btnDownload').addEventListener('click', download);
  exportImageBtn.addEventListener('click', exportLongImage);
  document.getElementById('btnSample').addEventListener('click', function () { editor.value = SAMPLE_MD; convert().catch(logConvertError); });
  document.getElementById('btnClear').addEventListener('click', function () { editor.value = ''; convert().catch(logConvertError); editor.focus(); });
  document.querySelectorAll('[data-preview-width]').forEach(function (button) {
    button.addEventListener('click', function () {
      setPreviewWidth(this.getAttribute('data-preview-width'));
    });
  });
  preview.addEventListener('load', applyPreviewLayout);
  if (window.ResizeObserver) new ResizeObserver(applyPreviewLayout).observe(previewWrap);
  else window.addEventListener('resize', applyPreviewLayout);
  validBadge.addEventListener('click', function () { validPanel.hidden = !validPanel.hidden; });
  document.addEventListener('click', closeOpenDropdown);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeOpenDropdown(); });

  renderThemeButtons();
  setPreviewWidth(previewWidth);
  editor.value = SAMPLE_MD;
  try {
    var handoffMd = localStorage.getItem('yth.create.handoff') || '';
    if (handoffMd.trim()) {
      localStorage.removeItem('yth.create.handoff');
      editor.value = handoffMd;
      toast('已载入 AI 创作的文章，选一套主题即可复制');
    }
  } catch (error) { /* 隐私模式等场景回落到示例文章 */ }
  convert().catch(logConvertError);
})();
