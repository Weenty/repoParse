const puppeteer = require('puppeteer');
const fs = require('fs');
let space = ''
let arr = []
let Collab = []
let normal = []
let browser
let page
let struct = []
fs.writeFile('users.txt', '', function () { })
fs.writeFile('struct.JSON', '', function () { })
async function addUser(repo) {
  let url = page.url().split('?')[0];
  let name = url.split('/')[3]
  if (!struct.some(item => {
    return item.name === name
  })) {
    struct.push({ name: name, url: url, repo: repo })
    fs.writeFileSync('struct.json', JSON.stringify(struct));
    for (let i = 0; i < struct[struct.length - 1].repo.length; i++) {
      if (struct[struct.length - 1].repo[i].collabs.length == 1) {
        continue
      }
      try {
        for (let j = 1; j < struct[struct.length - 1].repo[i].collabs.length; j++) {
          if (!struct.some(item => {
            return item.name === struct[struct.length - 1].repo[i].collabs[j].name
          })) {
            console.log('СONTROLLER CALL REPO TO LINK ' + struct[struct.length - 1].repo[i].collabs[j][0].src)
            await searchRep(struct[struct.length - 1].repo[i].collabs[j][0].src)
          }
        }
      }
      catch {
        continue
      }
    }
  }
}

async function main(startUrl) {
  browser = await puppeteer.launch({ headless: true });
  await searchRep(startUrl)
  await browser.close()
  fs.writeFileSync('struct.json', JSON.stringify(struct));
  await paintStruct(0)
  console.log('successfully! check users.txt')
}

async function nextPage() {
  if (await page.$$eval('a.btn.btn-outline.BtnGroup-item', (item) => item.length) == 1) {
    await Promise.all([
      page.waitForNavigation(),
      page.waitFor(3000),
      page.click('a.btn.btn-outline.BtnGroup-item'),
    ]);
  }
  if (await page.$$eval('a.btn.btn-outline.BtnGroup-item', (item) => item.length) == 0) {
    return 0
  }
  else {
    await Promise.all([
      page.waitForNavigation(),
      page.waitFor(3000),
      page.evaluateHandle(() => document.querySelectorAll('a.btn.btn-outline.BtnGroup-item')[1].click()
      )
    ]);
  }
}

async function giveCollabs(url) {
  await tolink(url + '/graphs/contributors')
  return await page.$$eval('a.text-normal', (options) =>
    options.map((option) => [{ name: option.textContent, src: option.href }]));
}
async function giveContent() {
  return await page.$$eval('h3.wb-break-all a', (options) =>
    options.map((option) => [{ name: option.textContent, src: option.href }]));
}
async function paintStruct(count) {
  let i = count
  for (; i < struct.length; i++) {
    fs.appendFileSync("users.txt", space + struct[i].name + '\n');
    space = space + ''.padStart(struct[i].name.length, "_");
    for (let j = 0; j < struct[i].repo.length; j++) {
      fs.appendFileSync("users.txt", space + struct[i].repo[j].name + '\n');
      if (struct[i].repo[j].collabs.length !== 0) {
        await paintStruct(count + 1)
      }
    }
    space = space.slice(0, -struct[i].name)
  }
}
async function tolink(url) {
  page = await browser.newPage();
  console.log('GO TO ' + url)
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitFor(3000)
}
async function searchRep(url) {
  arr = []
  await tolink(url + '?tab=repositories')
  console.log('search repo work in ' + page.url())
  for (let i = parseInt(await page.$eval('span.Counter', (e) => e.title)); i >= 0; i = i - 30) {
    arr.push(await giveContent())
    await nextPage()
  }

  page.close()
  normal = []
  for (let j = 0; arr[0].length > j; j++) {
    let u = await giveCollabs(arr[0][j][0].src)
    page.close()
    Collab = []
    for (let y = 0; u.length > y; y++) {
      if (u[y][0].name.split(' ').some(item => {
        return item == 'commits'
      })) { }
      else {
        Collab.push(u[y])
      }
    }
    normal.push({ name: arr[0][j][0].name.replace(/\s+/g, ''), src: arr[0][j][0].src, collabs: Collab })
  }
  await addUser(normal)
}

main('https://github.com/Weenty')

