'use strict';
// Run the unchanged ordinary recorder check with loopback-only browser networking.
const {chromium}=require('playwright');
const base='http://127.0.0.1:5195';
process.env.RECORDER_QA_URL=base;
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
  const browser=await launch(options),newPage=browser.newPage.bind(browser);
  browser.newPage=async options=>{
    const page=await newPage(options);
    await page.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    return page;
  };
  return browser;
};
require('../reading-recorder-check.cjs');
