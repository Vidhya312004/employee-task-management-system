const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    await page.goto('http://localhost:4200/admin/login', {waitUntil: 'networkidle2'});
    await page.type('#email', 'admin@example.com');
    await page.type('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    console.log('CURRENT URL:', page.url());
    await browser.close();
})();
