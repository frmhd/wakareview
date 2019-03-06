const branchNameElem = document.querySelector('.label-branch.label-truncate.js-source-branch');

if (branchNameElem) {
  const branchNameSplittedString = branchNameElem.textContent.split('/');

  const branchName = branchNameSplittedString[branchNameSplittedString.length - 1];
  chrome.runtime.sendMessage({ branchName }, (response) => {
    console.log(response);
  });
}
