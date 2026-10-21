/* Md2GZH 封面图 / 分享卡片渲染器：
 * 以固定像素尺寸输出离屏 HTML（配合 html2canvas 导出 PNG），
 * 视觉取自当前主题 spec.c 的颜色角色。产物不进公众号正文，不受平台红线约束。
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHCards = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function clip(text, max) {
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }

  /* 公众号封面：900×383（2.35:1），左色带 + 刊头 + 双行标题 + 关键词 + 底栏 */
  function coverCard(spec, t) {
    var c = spec.c;
    var keywords = (t.keywords || []).slice(0, 3).join(' · ');
    return '<section style="width:900px;height:383px;box-sizing:border-box;background:' + c.tint + ';font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;overflow:hidden;display:flex;">'
      + '<section style="width:14px;height:100%;background:linear-gradient(180deg,' + c.coverA + ',' + c.coverB + ');"></section>'
      + '<section style="flex:1;display:flex;flex-direction:column;padding:34px 40px 0;min-width:0;">'
      + '<section style="display:flex;align-items:center;justify-content:space-between;">'
      + '<span style="font-size:15px;letter-spacing:5px;font-weight:700;color:' + c.primary + ';">' + esc(spec.en) + '</span>'
      + '<span style="font-size:14px;letter-spacing:3px;color:' + c.sub + ';">' + esc(spec.kickerZh) + '</span>'
      + '</section>'
      + '<section style="margin-top:26px;font-size:46px;line-height:1.28;font-weight:800;color:' + c.ink + ';word-break:break-word;">' + esc(clip(t.title, 30)) + '</section>'
      + (t.sub ? '<section style="margin-top:12px;font-size:22px;font-weight:600;color:' + c.primary + ';">' + esc(clip(t.sub, 26)) + '</section>' : '')
      + (keywords ? '<section style="margin-top:auto;margin-bottom:22px;font-size:15px;letter-spacing:1px;color:' + c.sub + ';">' + esc(clip(keywords, 40)) + '</section>' : '<section style="flex:1;"></section>')
      + '</section>'
      + '<section style="width:170px;height:100%;background:linear-gradient(160deg,' + c.coverA + ',' + c.coverB + ');display:flex;flex-direction:column;justify-content:flex-end;padding:22px;box-sizing:border-box;">'
      + '<span style="font-size:14px;letter-spacing:2px;color:rgba(255,255,255,.85);">' + esc(t.author ? '文 / ' + t.author : 'WECHAT ARTICLE') + '</span>'
      + '<span style="margin-top:6px;font-size:20px;font-weight:800;color:#FFFFFF;">' + esc(t.parts > 0 ? (t.parts + ' PARTS') : 'LONG READ') + '</span>'
      + '</section>'
      + '</section>';
  }

  /* 分享卡：1080×1440（3:4 朋友圈竖卡），opt.qr 为已保存的二维码 dataURL */
  function shareCard(spec, t, opt) {
    opt = opt || {};
    var c = spec.c;
    var summary = clip(t.sub || t.keywords && t.keywords.slice(0, 2).join('，') || '', 60);
    var qrSlot = opt.qr
      ? '<img src="' + esc(opt.qr) + '" alt="二维码" style="width:100%;height:100%;object-fit:contain;display:block;">'
      : '<span style="font-size:20px;color:' + c.sub + ';letter-spacing:2px;">贴入 / 拖入二维码图片</span>';
    return '<section style="width:1080px;height:1440px;box-sizing:border-box;background:' + c.tint + ';font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;display:flex;flex-direction:column;padding:64px 64px 0;overflow:hidden;">'
      + '<section style="display:flex;align-items:center;gap:14px;">'
      + '<span style="width:16px;height:16px;border-radius:50%;background:' + c.primary + ';"></span>'
      + '<span style="font-size:20px;letter-spacing:4px;font-weight:700;color:' + c.ink + ';">YI TUO HUB STUDIO</span>'
      + '</section>'
      + '<section style="margin-top:20px;font-size:16px;letter-spacing:5px;color:' + c.primary + ';font-weight:700;">' + esc(spec.en) + ' · ' + esc(spec.name) + '</section>'
      + '<section style="margin-top:48px;font-size:64px;line-height:1.32;font-weight:800;color:' + c.ink + ';word-break:break-word;">' + esc(clip(t.title, 24)) + '</section>'
      + (summary ? '<section style="margin-top:30px;font-size:26px;line-height:1.75;color:' + c.text + ';font-weight:500;">' + esc(summary) + '</section>' : '')
      + '<section style="margin-top:44px;width:120px;height:4px;border-radius:2px;background:' + c.primary + ';"></section>'
      + '<section style="flex:1;"></section>'
      + '<section data-qr-slot="true" style="width:300px;height:300px;margin:0 auto;box-sizing:border-box;border:2px dashed ' + c.sub + ';border-radius:18px;background:#FFFFFF;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">'
      + qrSlot
      + '</section>'
      + '<section style="margin:26px auto 0;font-size:22px;letter-spacing:2px;color:' + c.sub + ';">长按识别二维码 · 阅读全文</section>'
      + '<section style="margin:34px -64px 0;height:110px;background:linear-gradient(90deg,' + c.coverA + ',' + c.coverB + ');display:flex;align-items:center;justify-content:center;">'
      + '<span style="font-size:24px;letter-spacing:3px;color:#FFFFFF;font-weight:600;">' + esc(t.author ? '文 / ' + t.author : 'WECHAT · LONG READ') + '</span>'
      + '</section>'
      + '</section>';
  }

  return { coverCard: coverCard, shareCard: shareCard };
});
