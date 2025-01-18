import { readFileSync, existsSync } from 'fs';
import { settingValue } from './settings';

// From https://stackoverflow.com/a/6234804/561309
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getHeaderPrefix(level: number) {
  /* eslint-disable no-return-await */
  return await settingValue(`h${level}Prefix`);
}

async function headerToHtml(header: any, showNumber: boolean, prefixHtml: string = '') {
  let numberPrefix = '';
  if (showNumber) {
    numberPrefix = header.number;
  }
  return `<a class="toc-item toc-item-link toc-item-${header.level}" href="javascript:;" `
    + `data-slug="${escapeHtml(header.slug)}" data-lineno="${header.lineno}" `
    + 'onclick="tocItemLinkClicked(this.dataset)" '
    + 'oncontextmenu="copyInnerLink(this.dataset, this.innerText)">'
    + `${prefixHtml}`
    + `<span>${await getHeaderPrefix(header.level)} </span>`
    + `<span class="number-prefix">${numberPrefix} </span>`
    + `<span>${header.html}</span>`
    + '</a>';
}

export default async function panelHtml(headers: any[]) {
  // Settings
  const bgColor = await settingValue('bgColor');
  const collapsible = await settingValue('collapsible');
  const disableLinewrap = await settingValue('disableLinewrap');
  const fontFamily = await settingValue('fontFamily');
  const fontSize = await settingValue('fontSize');
  const fontColor = await settingValue('fontColor');
  const headerIndent = await settingValue('headerIndent');
  const headerDepth = await settingValue('headerDepth');
  const hoverStyleType = await settingValue('hoverStyleType');
  const itemPadding = await settingValue('itemPadding');
  const showNumber = await settingValue('showNumber');
  const userStyleFile = await settingValue('userStyleFile');
  const userStyle = await settingValue('userStyle');

  let linewrapStyle = '';
  if (disableLinewrap) {
    linewrapStyle += `
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;`;
  }

  const itemHtmlList = [];
  const divsToClose = [];

  for (let headerIdx = 0; headerIdx < headers.length; headerIdx += 1) {
    const header = headers[headerIdx];

    // header depth
    /* eslint-disable no-continue */
    if (header.level > headerDepth) {
      continue;
    }

    /* eslint-disable no-await-in-loop */
    if (collapsible) {
      let suffix: string = '';
      let toggleElem: string = '<span style="display: inline-block;width:15px">&ensp;</span>';

      if (headerIdx >= headers.length - 1) {
        // Last element
        while (divsToClose.length !== 0) {
          suffix = suffix.concat('</div>');
          divsToClose.splice(divsToClose.length - 1, 1);
        }
      } else {
        const nextHeader = headers[headerIdx + 1];

        if (header.level < nextHeader.level) {
          toggleElem = `<span id="toggle-${header.number}" class="toggle-button" style="display: inline-block;width:15px" onclick="toggleHidden('${header.number}')">&#9662</span>`;
          suffix = suffix.concat(`<div id="toc-group-${header.number}">`);
          divsToClose.push(nextHeader.level);
        } else if (header.level > nextHeader.level) {
          while (divsToClose[divsToClose.length - 1] > nextHeader.level) {
            suffix = suffix.concat('</div>');
            divsToClose.splice(divsToClose.length - 1, 1);
          }
        }
      }
      itemHtmlList.push(`${await headerToHtml(header, showNumber, toggleElem)}${suffix}`);
    } else {
      itemHtmlList.push(`${await headerToHtml(header, showNumber)}`);
    }
  }

  let hoverStyle = `.toc-item:hover {
  font-weight: bold;
}`;
  if (hoverStyleType === 1) {
    hoverStyle = `.toc-item:hover {
  background-color: var(--joplin-background-color-hover3);
  border-radius: 3px;
}`;
  }
  const defaultStyle = `.outline-content {
  font-family: ${fontFamily};
  min-height: calc(100vh - 1em);
  background-color: ${bgColor};
  padding: 5px;
}
.toc-item,
.toc-item > span {
  font-size: ${fontSize}pt;
}
.toc-item {
  display: block;
  margin: 0;
  padding: ${itemPadding}px 0;
  color: ${fontColor};
  ${linewrapStyle}
  text-decoration: none;
}
/* 添加的样式来隐藏 body 右侧的滚动条但允许上下滚动 */
html {
    height: 100%;
    overflow-x: hidden; /* 隐藏水平滚动条 */
}

body {
    margin: 0;
    padding: 0;
    height: 100vh; /* 设置 body 高度为视口高度 */
    overflow-y: scroll; /* 允许垂直滚动 */
    overflow-x: hidden; /* 确保水平滚动条被隐藏 */
    scrollbar-width: none; /* Firefox 隐藏滚动条 */
}
body::-webkit-scrollbar {
    width: 0; /* Chrome, Safari, Edge 隐藏滚动条 */
    background: transparent; /* Chrome, Safari, Edge 隐藏滚动条 */
}
#header {
    position: fixed;
    top: 0;
    width: 90%;
    background-color: #fff; /* 设置背景颜色以防止内容被遮挡 */
    z-index: 1000; /* 确保 header 在其他内容上方 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 10px 3px 10px;; /* 添加一些内边距 */
}
/* 添加的 #copy-success-message 样式 */
#copy-success-message {
    color: green; /* 可以根据需要更改颜色 */
    font-size: 14px; /* 可以根据需要更改字体大小 */
}
.container {
    margin-top: 25px; /* 根据 header 的高度调整，避免内容被固定 header 遮挡 */
    margin-left: 0px; /* 调整左侧缩进 */
}
${hoverStyle}
${[1, 2, 3, 4, 5, 6].map((item) => `.toc-item-${item} {
  padding-left: ${(item - 1) * headerIndent + 5}px !important;
}`).join('\n')}
.number-prefix {
  font-weight: normal;
  font-style: normal;
}`;

  let userStyleFromFile: string = '';
  if (existsSync(userStyleFile)) {
    userStyleFromFile = readFileSync(userStyleFile, 'utf-8');
  }

  return `<html><head><style>
${defaultStyle}
${userStyleFromFile}
${userStyle}
</style></head>
<body><div class="outline-content">
<a id="header" href="javascript:;" onclick="scrollToTop()" oncontextmenu="copyInnerLink('', '')">文章大纲<span id="copy-success-message"></span></a>
<div class="container">
${itemHtmlList.join('\n')}
</div>
</div></body></html>`;
}
