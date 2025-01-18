/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function tocItemLinkClicked(dataset) {
  webviewApi.postMessage({
    name: 'scrollToHeader',
    lineno: dataset.lineno,
    hash: dataset.slug,
  });
}

function showCopySuccess() {
  document.getElementById('copy-success-message').innerHTML = ' 复制成功!';
  setTimeout(() => {
    document.getElementById('copy-success-message').innerHTML = '';
  }, 800);
}

function copyInnerLink(dataset, text) {
  if (dataset === '') {
    webviewApi.postMessage({
      name: 'contextMenu',
      hash: '',
      content: '',
    });
  } else {
    webviewApi.postMessage({
      name: 'contextMenu',
      hash: dataset.slug,
      content: text.trim(),
    });
  }
  showCopySuccess(); // 调用显示复制成功消息的函数
}

function scrollToTop() {
  webviewApi.postMessage({
    name: 'scrollToHeader',
    lineno: 0,
    hash: 'rendered-md',
  });
}

function toggleHidden(groupId) {
  const group = document.getElementById(`toc-group-${groupId}`);
  const toggleElem = document.getElementById(`toggle-${groupId}`);
  if (group.style.display === 'none') {
    group.style.display = 'block';
    toggleElem.innerHTML = '&#9662';
  } else {
    group.style.display = 'none';
    toggleElem.innerHTML = '&#9656';
  }
}
