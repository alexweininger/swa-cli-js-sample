const fetch = require("node-fetch").default;
const baseUrl = "https://gentle-sand-07379f510.azurestaticapps.net";

test("root returns /index.html", async () => {
    const { doc } = await fetchHtmlDoc(`${baseUrl}/`);
    expect(doc.title).toBe("/index.html");
});

test("/index.html returns /index.html", async () => {
    const { doc } = await fetchHtmlDoc(`${baseUrl}/index.html`);
    expect(doc.title).toBe("/index.html");
});

test("folder returns folder/index.html", async () => {
    const { doc } = await fetchHtmlDoc(`${baseUrl}/folder/`);
    expect(doc.title).toBe("/folder/index.html");
});

test("rewrite to file returns correct content", async () => {
    const { doc } = await fetchHtmlDoc(`${baseUrl}/rewrite_index2`);
    expect(doc.title).toBe("/index2.html");
});

test("rewrite to function returns function response", async () => {
    jest.setTimeout(10000);
    const { json } = await fetchJson(`${baseUrl}/rewrite-to-function`);
    expect(json["x-swa-custom"]).toBe("/api/headers");
});

test("content response contains global headers", async () => {
    const response = await fetch(`${baseUrl}/`, { redirect: "manual" });
    expect(response.headers.get("a")).toBe("b");
});

// test("function response contains global headers", async () => {
//     const response = await fetch(`${baseUrl}/api/headers`);
//     expect(response.headers.get("a")).toBe("b");
// })

test("route headers override global headers", async () => {
    const response = await fetch(`${baseUrl}/redirect_index2`, { redirect: "manual" });
    expect(response.headers.get("a")).toBe("c");
});

test("default redirect returns 302 with correct location", async () => {
    const response = await fetch(`${baseUrl}/redirect/foo`, { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/index2.html");
});

test("redirect with statusCode 302 returns 302 with correct location", async () => {
    const response = await fetch(`${baseUrl}/redirect/302`, { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/index2.html");
});

test("redirect with statusCode 301 returns 301 with correct location", async () => {
    const response = await fetch(`${baseUrl}/redirect/301`, { redirect: "manual" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/index2.html");
});

test("setting mimetype of unknown file type returns correct mime type", async () => {
    const response = await fetch(`${baseUrl}/test.swaconfig`, { redirect: "manual" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
});

test("navigation fallback returns /index.html", async () => {
    const { response, doc } = await fetchHtmlDoc(`${baseUrl}/does_not_exist.html`);
    expect(response.status).toBe(200);
    expect(doc.title).toBe("/index.html");
});

test("navigation fallback that's excluded returns 404", async () => {
    const response = await fetch(`${baseUrl}/does_not_exist.txt`, { redirect: "manual" });
    expect(response.status).toBe(404);
});

test("/*.foo matches extension", async () => {
    const response = await fetch(`${baseUrl}/thing.foo`, { redirect: "manual" });
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/foo.html");
});

test("/*.{jpg} matches extension", async () => {
    const response = await fetch(`${baseUrl}/thing.jpg`, { redirect: "manual" });
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/jpg.html");
});

test("/*.{png,gif} matches multiple extensions", async () => {
    const response = await fetch(`${baseUrl}/thing.png`, { redirect: "manual" });
    const response2 = await fetch(`${baseUrl}/thing.gif`, { redirect: "manual" });
    expect(response.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/png_gif.html");
    expect(response2.headers.get("location").replace(new RegExp(`^${baseUrl.replace(".", "\\.")}`), "")).toBe("/png_gif.html");
});

test("redirect can redirect to external URL", async () => {
    const response = await fetch(`${baseUrl}/something.google`, { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://www.google.com/");
});

test("rewrite to folder returns folder's default file", async () => {
    const { response, doc } = await fetchHtmlDoc(`${baseUrl}/folder/somefile.html`);
    expect(response.status).toBe(200);
    expect(doc.title).toBe("/folder/index.html");
});

// TODO: remove default headers with global headers
// TODO: remove default headers with route headers

async function fetchHtmlDoc(url, options) {
    const fetchOptions = Object.assign({ redirect: "manual" }, options);
    const response = await fetch(url, fetchOptions);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return {
        doc,
        response
    };
}

async function fetchJson(url) {
    const response = await fetch(url);
    return {
        json: await response.json(),
        response
    };
}