const fs = require("fs");
const puppeteer = require("puppeteer");
const { parse } = require("json2csv"); //libreria para exportar en csv

const scraping = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
  });

  const page = await browser.newPage();

  await page.goto("http://localhost:8000/blog/3");

  const data = await page.evaluate(() => {
    const elements = document.querySelectorAll(".card-article");
    const results = [];

    Array.from(elements).forEach((element) => {
      const container = element.querySelector(".card-article-body");

      const date = container.querySelector("span").textContent;
      const shortDescription = container.querySelector("p").textContent;
      const path = container.querySelector("a").getAttribute("href");
      const title = container.querySelector("a h3").textContent;

      results.push({ date, shortDescription, path, title });
    });

    return results;
  });

  const resultsDetails = [];

  // Ciclo para ingresar a cada página
  for (const blog of data) {
    await page.goto(`http://localhost:8000${blog.path}`);

    // Esperando la respuesta del sitio web
    await page.waitForSelector(".article-info");
    await page.waitForSelector(".body-container");

    // Evaluando el sitio web
    const blogDetails = await page.evaluate(() => {
      const elements = document.querySelectorAll(".article-info");
      const bodyContainer = document.querySelectorAll(".blog-body");
      const resultsDetails = [];

      Array.from(bodyContainer).forEach((response) => {
        const blogBody = response.querySelector(".blog-main");
        const articleContainer = blogBody.querySelector(".article-container");
        const articleText = articleContainer.querySelector(".article-text");
        const body2 = articleText.querySelector(".body-2");

        const paragraphs = body2.querySelectorAll("p");
        const paragraphTexts = [];

        paragraphs.forEach((paragraph) => {
          const paragraphText = paragraph.textContent;
          paragraphTexts.push(paragraphText);
        });

        resultsDetails.push({ fullDescription: paragraphTexts });
      });

      // Detalles principales
      Array.from(elements).forEach((response) => {
        const container = response.querySelector(".text");
        const writtenBy = container.querySelector(".lead-2").innerText;

        resultsDetails.push({ writtenBy });
      });

      return resultsDetails;
    });

    resultsDetails.push({
      date: blog.date,
      shortDescription: blog.shortDescription,
      path: blog.path,
      title: blog.title,
      details: blogDetails,
    });
  }

  console.log(resultsDetails);

  await browser.close();

  // Escribiendo los resultados en un archivo JSON
  fs.writeFile(
    "data.json",
    JSON.stringify(resultsDetails, null, 2),
    function (err) {
      if (err) {
        throw err;
      }
      console.log("¡Éxito!");
    }
  );
};

scraping();
