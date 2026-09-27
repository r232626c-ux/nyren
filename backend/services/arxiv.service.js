const axios = require("axios");
const xml2js = require("xml2js");

const searchArxiv = async (query) => {
  try {
    const url =
      `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
        query
      )}&start=0&max_results=10`;

    const res = await axios.get(url);

    const parsed = await xml2js.parseStringPromise(
      res.data
    );

    const entries =
      parsed.feed.entry || [];

    return entries.map((p) => ({
      title: p.title?.[0],
      abstract: p.summary?.[0],
      source: "arxiv",
      year: p.published?.[0],
      authors:
        p.author?.map(a => a.name?.[0]) || [],
      url: p.id?.[0],
    }));

  } catch (err) {
    console.log("ARXIV ERROR:", err.message);
    return [];
  }
};

module.exports = { searchArxiv };