import * as puppeteer from "puppeteer";

async function serverTest() {
  // headless 브라우저 실행
  const browser = await puppeteer.launch();
  // 새로운 페이지 열기
  const page = await browser.newPage();

  await page.goto("http://mrs.vatechsnc.com/mrs/ext/meal/reserv");
  //스크린샷을 캡처 하여 Docs 폴더에 저장
  await page.screenshot({ path: "./Docs/result.png" });
  // `react_korea.pdf` pdf 파일을 생성하여 Docs 폴더에 저장
  await page.pdf({ path: "./Docs/result.pdf", format: "a4" });

  /****************
   * 원하는 작업 수행 *
   ****************/

  // 모든 스크래핑 작업을 마치고 브라우저 닫기
  await browser.close();
}

export { serverTest };
