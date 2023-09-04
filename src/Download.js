//codigo para descargar toda la informacion de los blogs. (Esto genera archivos json por cada pagina)

const fs = require("fs");
const puppeteer = require("puppeteer");

const scraping = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);
  let currentPage = 1; // Número de página inicial

  while (true) {
    const url = `https://d2gyiz1l4kzlah.cloudfront.net/blog/${currentPage}`;
    await page.goto(url);

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

    for (const blog of data) {
      await page.goto(`https://d2gyiz1l4kzlah.cloudfront.net${blog.path}`);

      await page.waitForSelector(".article-info");
      await page.waitForSelector(".body-container");

      const blogDetails = await page.evaluate(() => {
        //codigo para leer el blog details
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

    console.log(`Página ${currentPage}:`, resultsDetails);

    // Escribir los resultados en un archivo JSON con el número de página en el nombre
    fs.writeFile(
      `data_page_${currentPage}.json`,
      JSON.stringify(resultsDetails, null, 2),
      function (err) {
        if (err) {
          throw err;
        }
        console.log(`¡Éxito en la página ${currentPage}!`);
      }
    );

    currentPage++; // Incrementar el número de página

    if (currentPage === 21) {
      break;
    }
  }

  await browser.close();
};

scraping();
