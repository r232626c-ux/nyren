const axios = require('axios');
const xml2js = require('xml2js');

const EUTILS_EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

function textOf(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(' ');
  if (!value || typeof value !== 'object') return '';
  if (typeof value._ === 'string') return value._.trim();
  return Object.entries(value)
    .filter(([key]) => key !== '$')
    .map(([, child]) => textOf(child))
    .filter(Boolean)
    .join(' ');
}

function findYear(article, medlineCitation) {
  const pubDate = article?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0];
  const directYear = textOf(pubDate?.Year?.[0]);
  const medlineDate = textOf(pubDate?.MedlineDate?.[0]);
  const candidate = directYear || medlineDate.match(/\b(?:19|20)\d{2}\b/)?.[0];
  const year = Number(candidate);
  return Number.isInteger(year) && year > 1800 ? year : null;
}

async function verifyPubMedReference(pmid) {
  const normalizedPmid = String(pmid || '').trim();
  if (!/^\d{1,10}$/.test(normalizedPmid)) {
    throw new Error('A valid numeric PMID is required.');
  }

  const response = await axios.get(EUTILS_EFETCH, {
    params: { db: 'pubmed', id: normalizedPmid, retmode: 'xml' },
    timeout: 15000,
    responseType: 'text',
  });
  const parsed = await xml2js.parseStringPromise(response.data);
  const record = parsed?.PubmedArticleSet?.PubmedArticle?.[0];
  const citation = record?.MedlineCitation?.[0];
  const article = citation?.Article?.[0];
  const verifiedPmid = textOf(citation?.PMID?.[0]);
  const title = textOf(article?.ArticleTitle?.[0]);

  if (!verifiedPmid || verifiedPmid !== normalizedPmid || !title) {
    return null;
  }

  const authors = (article?.AuthorList?.[0]?.Author || [])
    .map((author) => {
      const collectiveName = textOf(author.CollectiveName?.[0]);
      const foreName = textOf(author.ForeName?.[0]);
      const lastName = textOf(author.LastName?.[0]);
      return collectiveName || [foreName, lastName].filter(Boolean).join(' ');
    })
    .filter(Boolean);

  const doiSource = [
    ...(article?.ELocationID || []),
    ...(record?.PubmedData?.[0]?.ArticleIdList?.[0]?.ArticleId || []),
  ].find((entry) => entry?.$?.EIdType === 'doi' || entry?.$?.IdType === 'doi');
  const doi = textOf(doiSource) || null;
  const publicationTypes = (article?.PublicationTypeList?.[0]?.PublicationType || [])
    .map(textOf)
    .filter(Boolean);
  const abstract = textOf(article?.Abstract?.[0]?.AbstractText || []);

  return {
    title,
    authors,
    journal: textOf(article?.Journal?.[0]?.Title?.[0]) || null,
    year: findYear(article, citation),
    pmid: normalizedPmid,
    doi,
    url: `https://pubmed.ncbi.nlm.nih.gov/${normalizedPmid}/`,
    source: 'pubmed',
    articleType: publicationTypes,
    abstract: abstract || null,
    verifiedAt: new Date(),
  };
}

module.exports = { verifyPubMedReference };