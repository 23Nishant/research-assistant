// server/services/paperService.js
const axios = require('axios');
const xml2js = require('xml2js');

class PaperService {
  constructor() {
    this.baseUrl = 'http://export.arxiv.org/api/query';
  }

  async searchPapers(query) {
    try {
      console.log('Searching for:', query);
      const response = await axios.get(this.baseUrl, {
        params: {
          search_query: `all:${query}`,
          start: 0,
          max_results: 10,
          sortBy: 'relevance',
          sortOrder: 'descending'
        }
      });

      return await this.parseArxivResponse(response.data);
    } catch (error) {
      console.error('Error fetching papers:', error);
      throw new Error('Failed to fetch papers');
    }
  }

  async parseArxivResponse(xmlData) {
    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      if (!result.feed.entry) {
        return [];
      }

      return result.feed.entry.map(entry => ({
        id: entry.id[0],
        title: entry.title[0].replace(/\n/g, ' ').trim(),
        authors: entry.author.map(author => author.name[0]),
        abstract: entry.summary[0].replace(/\n/g, ' ').trim(),
        url: entry.id[0],
        published: entry.published[0]
      }));
    } catch (error) {
      console.error('Error parsing arXiv response:', error);
      throw new Error('Failed to parse paper data');
    }
  }
}

module.exports = PaperService;