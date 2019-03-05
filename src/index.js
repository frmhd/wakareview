const branchNameSplittedString = document
  .querySelector('.label-branch.label-truncate.js-source-branch')
  .textContent
  .split('/');

const branchName = branchNameSplittedString[branchNameSplittedString.length - 1];
chrome.runtime.sendMessage({ branchName }, (response) => {
  console.log(response);
});
