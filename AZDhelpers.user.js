// ==UserScript==
// @name         AZD Helpers
// @namespace    http://tampermonkey.net/
// @version      1.3.2
// @description  Make AZD better for me
// @author       You
// @match        https://dev.azure.com/*
// @grant        none
// ==/UserScript==

(async function() {
  'use strict';

  function waitFor(selector, cb) {
    //Rework this since it always observes all mutations?
    const observer = new MutationObserver(function (mutations, me) {
      //const mutMatch = element => mutations.reduce((matched, mut) => matched || mut.target === element, false)
      //console.log(`Mutation for ${selector}`, mutations)
      // `mutations` is an array of mutations that occurred
      // `me` is the MutationObserver instance
      var element = document.querySelector(selector)
      if (element) {
        cb(element)
        me.disconnect()
        return
      }
    });

    // start observing
    observer.observe(document, {
      childList: true,
      subtree: true
    })
  }

  console.log('Waiting for pull request element to modify')

  const repo = location.pathname.match(/_git\/(.+)\//) ? location.pathname.match(/_git\/(.+)\//)[1] : ''
  const previewUrl = 'https://stg.ashui.com/EmberApp/'

  waitFor('textarea.repos-pr-create-description', element => {
    //Wait a moment for things to settle
    setTimeout(() => {
      console.log('Updating PR description', element)
      element.value += `\n\n[Preview site](${previewUrl}${repo})`
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }, 4000)
  })

  waitFor('.markdown-toolbar', elementBefore => {
    if (!document.location.href.includes('pullrequestcreate')) return
    console.log('Adding snippets')
    const helper = document.createElement('input')

    //helper.className = 'bolt-textfield-input'
    helper.style.color = 'Black';
    helper.value = `[Preview site](${previewUrl}${repo})`
    helper.onfocus = function() { this.selectionStart=0; this.selectionEnd=this.value.length; document.execCommand('copy'); }
    elementBefore.parentElement.insertBefore(helper, elementBefore)
  })

  const updateStatus = element => {
    if (element.innerText.match(/succeed/i)) {
      document.title = document.querySelector('div[aria-label="Completed"')
        ? '* Completed'
        : '+ Succeeded'
    } else if (element.innerText.match(/failed/i)) {
      const failures = Array.from(document.querySelectorAll('.pr-completion-status-header'))
      if (failures.find(f => f.textContent.match(/build in progress/i))) {
        document.title = '? Building'
      } else {
        const list = failures
          .map(e => {
            if (e.textContent.match(/build/i)) return 'build'
            if (e.textContent.match(/comments/i)) return 'comments'
            return '?'
          })
        document.title = `- (${list.reduce((list, f, i) => list + (i ? ', ' : '') + f, '')})`
      }
    } else {
      document.title = '? Building'
    }
    waitFor('.bolt-status ~ div > .rhythm-horizontal-8 > span', updateStatus)
  }
  waitFor('.bolt-status ~ div > .rhythm-horizontal-8 > span', updateStatus)


  waitFor('div[aria-label="Completed"', element => {
    document.title = '* Completed'
  })

})();
