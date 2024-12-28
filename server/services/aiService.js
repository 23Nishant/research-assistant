const { OpenAI } = require('openai');
const { ChromaClient } = require('chromadb');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

class AIService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.chroma = new ChromaClient();
    this.collection = null;
    this.initializeChroma();
  }

  async initializeChroma() {
    try {
      this.collection = await this.chroma.createCollection({
        name: "research_papers",
        metadata: { "description": "Research papers and their embeddings" }
      });
    } catch (error) {
      console.error('Error initializing ChromaDB:', error);
    }
  }

  async processAndStoreDocument(paper) {
    // Split paper content into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const content = `${paper.title}\n${paper.abstract}`;
    const chunks = await splitter.createDocuments([content]);

    // Generate embeddings and store in ChromaDB
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await this.openai.embeddings.create({
          input: chunk.pageContent,
          model: "text-embedding-ada-002"
        });
        return response.data[0].embedding;
      })
    );

    // Store in ChromaDB
    await this.collection.add({
      ids: chunks.map((_, i) => `${paper.id}_${i}`),
      embeddings: embeddings,
      metadatas: chunks.map(chunk => ({
        paperId: paper.id,
        title: paper.title
      })),
      documents: chunks.map(chunk => chunk.pageContent)
    });
  }

  async generateResearchInsights(papers) {
    const context = papers.map(paper => 
      `Title: ${paper.title}\nAbstract: ${paper.abstract}`
    ).join('\n\n');

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a research assistant helping to analyze academic papers. Provide insights, connections between papers, and highlight key findings."
        },
        {
          role: "user",
          content: `Analyze these research papers and provide key insights, relationships between them, and main findings:\n\n${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  }

  async semanticSearch(query) {
    // Generate embedding for the query
    const queryEmbedding = await this.openai.embeddings.create({
      input: query,
      model: "text-embedding-ada-002"
    });

    // Search in ChromaDB
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding.data[0].embedding],
      nResults: 5
    });

    return results;
  }
}
