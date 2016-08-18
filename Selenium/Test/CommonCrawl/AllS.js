var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver1 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
var driver2 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
var driver3 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.opera()).build();
var driver4 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.ie()).build();
var driver5 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.edge()).build();
var driver6 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.safari()).build();
var driver7 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.phantomjs()).build();

driver1.get('http://google.com.sg');
driver2.get('http://google.com.sg');
driver3.get('http://google.com.sg');
driver4.get('http://google.com.sg');
driver5.get('http://google.com.sg');
driver6.get('http://google.com.sg');
driver7.get('http://google.com.sg');